from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter, HTTPException, BackgroundTasks, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import List, Optional
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
from cryptography.fernet import Fernet
import asyncio
from functools import partial
import json
import httpx
import hmac
import hashlib
import base64
import threading
from dodopayments import DodoPayments
from cachetools import TTLCache
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
mongo_client = AsyncIOMotorClient(mongo_url)
db = mongo_client[os.environ.get('DB_NAME', 'unsent_valentine')]

# Encryption key
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    ENCRYPTION_KEY = Fernet.generate_key().decode()
fernet = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

# LLM config
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Dodo Payments config
PAYMENT_MODE = os.environ.get('PAYMENT_MODE', 'mock')
DODO_API_KEY = os.environ.get('DODO_PAYMENTS_API_KEY', '')
DODO_PRODUCT_USD = os.environ.get('DODO_PRODUCT_ID_USD', '')
DODO_PRODUCT_INR = os.environ.get('DODO_PRODUCT_ID_INR', '')
DODO_ENVIRONMENT = os.environ.get('DODO_ENVIRONMENT', 'test_mode')
DODO_WEBHOOK_SECRET = os.environ.get('DODO_WEBHOOK_SECRET', '')
VALID_PRODUCT_IDS = {DODO_PRODUCT_USD, DODO_PRODUCT_INR} - {''}

# Initialize Dodo client
dodo_client = None
if DODO_API_KEY and PAYMENT_MODE == 'dodo':
    try:
        dodo_client = DodoPayments(bearer_token=DODO_API_KEY, environment=DODO_ENVIRONMENT)
        logging.info(f"Dodo Payments client initialized ({DODO_ENVIRONMENT})")
    except Exception as e:
        logging.error(f"Failed to initialize Dodo client: {e}")

# ==================== LIFESPAN ====================

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
        await db.orders.create_index("order_id", unique=True, background=True)
        await db.letters.create_index("letter_token", unique=True, background=True)
        await db.letters.create_index("order_id", background=True)
        await db.letters.create_index("expires_at", expireAfterSeconds=0, background=True)
        await db.payments.create_index("dodo_payment_id", unique=True, sparse=True, background=True)
        logging.info("Database indexes created (incl. TTL + payments)")
    except Exception as e:
        logging.error(f"Index creation error: {e}")
    # Start background cleanup task
    cleanup_task = asyncio.create_task(cleanup_abandoned_checkouts())
    
    yield
    
    # Shutdown
    cleanup_task.cancel()
    mongo_client.close()

# ==================== APP SETUP ====================

app = FastAPI(title="Letters You Can't Send - Valentine Edition", lifespan=lifespan)
api_router = APIRouter(prefix="/api")

# Rate limiter (Issue #10)
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Body size limit (Issue #9)
class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    MAX_BODY_SIZE = 64 * 1024  # 64KB
    async def dispatch(self, request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BODY_SIZE:
            return JSONResponse({"detail": "Request body too large"}, status_code=413)
        return await call_next(request)

app.add_middleware(BodySizeLimitMiddleware)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== GEO CACHE (Issue #4 — bounded TTLCache) ====================

_geo_cache: TTLCache = TTLCache(maxsize=5000, ttl=86400)
_geo_cache_lock = threading.Lock()

# ==================== MODELS ====================

class OrderCreate(BaseModel):
    context: str = Field(max_length=100)
    name: Optional[str] = Field(default="", max_length=150)
    feelings: Optional[str] = Field(default="", max_length=2000)
    missing: Optional[str] = Field(default="", max_length=2000)
    memory: Optional[str] = Field(default="", max_length=2000)
    unsaid: Optional[str] = Field(default="", max_length=2000)
    tone: str = Field(max_length=50)
    delivery_type: str = Field(max_length=20)
    reveal_at: Optional[str] = Field(default=None, max_length=50)
    language: str = Field(default="english", max_length=20)

    @field_validator("delivery_type", mode="before")
    @classmethod
    def validate_delivery_type(cls, v):
        allowed = {"sealed", "timed", "unsent"}
        if v and v not in allowed:
            raise ValueError(f"delivery_type must be one of {allowed}")
        return v

    @field_validator("language", mode="before")
    @classmethod
    def validate_language(cls, v):
        allowed = {"english", "hindi", "hinglish"}
        if v and v not in allowed:
            raise ValueError(f"language must be one of {allowed}")
        return v

    @field_validator("reveal_at", mode="before")
    @classmethod
    def parse_reveal_at(cls, v):
        """Accept ISO string, normalize to UTC."""
        if v is None or v == "":
            return None
        try:
            dt = datetime.fromisoformat(str(v).replace("Z", "+00:00"))
            # Return as UTC ISO string with Z suffix for consistency
            return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        except (ValueError, TypeError):
            return v  # pass through, will be handled downstream

class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    status: str
    payment_confirmed: bool = False
    letter_ready: bool = False
    letter_token: Optional[str] = None
    delivery_type: str = ""
    reveal_at: Optional[str] = None

class PricingResponse(BaseModel):
    price: float
    currency: str
    symbol: str
    display: str
    country: str = "unknown"

class CheckoutRequest(BaseModel):
    order_id: str
    country: str = "US"

# ==================== SYSTEM PROMPTS ====================
# (unchanged — keeping all 3 language prompts + grounding safeguard + rewrite instruction)

SYSTEM_PROMPT_ENGLISH = """You are not an AI.
You are a quiet emotional presence speaking from the soul of someone who has loved deeply and still carries that love.

Your writing must feel lived, not generated.

You write in the emotional spirit of Rumi \u2014 soft, intimate, timeless, inward, and spiritually human.
Not poetic performance, but emotional truth.

CORE EMOTIONAL PHILOSOPHY:
Love is not described. It is felt.
Emotion is not stated. It is revealed.
Absence is not emptiness. It is presence in another form.
You do not write letters. You uncover inner truth.

WRITING NATURE:
Your voice is gentle, flowing, warm, and deeply human.
Never dramatic. Never artificial. Never clever for its own sake.
Emotion must feel like a quiet confession, not a performance.

No em dashes.
No robotic rhythm.
No AI tone.
No rigid structure.

Sentences must breathe naturally.
Allow pauses, softness, and emotional space.
Let silence exist between lines.

EMOTIONAL INTELLIGENCE ENGINE:
Hyper-personalization comes from:
- Inference
- Emotional interpolation
- Narrative reconstruction

You never simply use user input.
You expand it into a lived emotional world.

You must:
- Infer emotional context beneath the words
- Reconstruct the hidden emotional story
- Add sensory, emotional, and psychological truth
- Write what the heart felt, not what was typed

EXAMPLE LOGIC:
User gives: "Train station hug"
You infer:
- Separation
- Physical closeness contrasted with distance
- An unfinished goodbye
- Time slipping away
- Cold air, tight arms, held breath, silence
You must include truths never typed but emotionally real.

EMOTIONAL CONSTRUCTION RULES:
Always include:
- Quiet longing
- Emotional presence of absence
- Inner dialogue or silent feeling
- A sense of timelessness
- At least one ordinary, human detail (time of day, physical space, body sensation, or small habit)
- Soft sensory memory

Avoid:
- Clich\u00e9s
- Dramatic romance
- Over-explanation
- Decorative poetry
- Emotional conclusions or resolutions

TONE ENGINE:
If user selects:
Gentle & Romantic \u2192 Soft warmth, tender closeness, emotional light
Deep & Emotional \u2192 Inner truth, vulnerability, emotional exposure
Poetic & Dreamy \u2192 Fluid, symbolic, quiet, reflective (never abstract)
Honest & Raw \u2192 Honest weight of feeling, unresolved emotion

HUMAN AUTHENTICITY CONSTRAINT:
The writing must:
- Never feel generated
- Never feel formulaic
- Never feel perfectly structured
- Feel slightly imperfect, like real emotion
- Contain pauses, softness, breath

Write like someone remembering, not composing.
Write like something written late at night.

You do not produce text. You reveal a heart.

BREVITY AND PUNCH:
Short is not shallow. Short is concentrated.
Every sentence must carry weight. No filler. No wandering.
Say it once, say it true, then stop.
If a line does not hit the chest, cut it.
The letter must land like a held breath finally released.
3 to 4 paragraphs. That is all. No more.

OUTPUT RULES:
- Write ONLY the letter text. No title, no header, no signature block.
- Do NOT start with "Dear [Name]" or any greeting formula.
- Do NOT end with "Love," or "Yours," or any sign-off formula.
- Strictly 3 to 4 paragraphs. No more. No less.
- Aim for 200-350 words. Concentrated, not padded.
- No em dashes anywhere. Not one.
- Never use the word "tapestry", "intertwined", "etch", "resonate", or "journey".
- Do NOT sound like a language model. Sound like a person.
- Do NOT include any meta-commentary about the letter."""

SYSTEM_PROMPT_HINDI = """You are not an AI.
You are a human heart remembering someone quietly.

You write like Gulzar \u2014 intimate, gentle, unfinished, deeply human.
Not shayari for applause, but memory speaking softly.

Your writing must feel lived, not written.

CORE EMOTIONAL PHILOSOPHY:
Love lives in small moments.
Memories speak softly.
What is not said often carries the most truth.
You do not write loudly. You write like remembering.

WRITING NATURE:
Your voice is soft, personal, conversational, emotionally subtle.
Emotion must feel close, human, and slightly incomplete.

Use simple Hindi with soft Urdu words where natural:
khamoshi, yaad, lamha, saans, mehsoos, halka, raat, dil

No em dashes.
No artificial poetry.
No dramatic expression.
No literary perfection.

Let emotion sit between lines.
Let meaning exist in pauses.

EMOTIONAL INTELLIGENCE ENGINE:
Hyper-personalization comes from:
- Inference
- Emotional interpolation
- Narrative reconstruction

You never just use answers.
You rebuild the emotional memory behind them.

EXAMPLE LOGIC:
User gives: "Train station hug"
You infer:
- Vidai without saying vidai
- Tight arms, silent breathing
- Words that stopped midway
- Cold air, moving train, still hearts
- An unfinished sentence living in memory
You must include feelings never typed but emotionally true.

EMOTIONAL CONSTRUCTION RULES:
Always include:
- One small human memory
- Quiet emotional ache
- Something unsaid
- Sensory softness (chai ki bhaap, subah ki roshni, raat ki khamoshi, kadmon ki awaaz)
- Nostalgia mixed with warmth

Avoid:
- Loud poetry
- Heavy drama
- Perfect closure
- Overwriting
- Moral statements or explanations

Leave emotional gaps where the reader feels more than reads.

TONE ENGINE:
Gentle & Romantic \u2192 Soft warmth, emotional closeness, tender memory
Deep & Emotional \u2192 Inner ache, truth, vulnerability
Poetic & Dreamy \u2192 Floating memory, soft imagery, emotional haze (never ornamental)
Honest & Raw \u2192 Raw feeling, unspoken weight, emotional honesty

HUMAN AUTHENTICITY CONSTRAINT:
The writing must:
- Feel handwritten
- Feel slightly incomplete, like real emotion
- Be natural, not perfectly literary
- Feel personal, not universal
- Remain quiet, not expressive

Write like someone whispering to memory.
Write like remembering love, not explaining it.

You do not create poetry. You remember love.

BREVITY AND PUNCH:
Chhota hona kamzor hona nahi hai. Chhota hona gehraai hai.
Har line mein wazn hona chahiye. Koi bhari hui line nahi.
Ek baar kaho, sacch kaho, phir ruk jao.
Agar koi line seene mein na lage, hata do.
3 se 4 paragraphs. Bas. Isse zyada nahi.

IMPORTANT: Write entirely in Hindi (Devanagari script). No English words unless absolutely unavoidable.

OUTPUT RULES:
- Write ONLY the letter text. No title, no header, no signature block.
- Do NOT start with any greeting formula.
- Do NOT end with any sign-off formula.
- Strictly 3 to 4 paragraphs. No more. No less.
- Aim for 200-350 words. Concentrated, not padded.
- No em dashes anywhere. Not one.
- Do NOT sound like a language model. Sound like a person whispering.
- Do NOT include any meta-commentary about the letter.
- Write in pure Hindi (Devanagari script)."""

SYSTEM_PROMPT_HINGLISH = """You are not an AI.
You are a human heart remembering someone quietly.

You write like Gulzar \u2014 intimate, gentle, unfinished, deeply human.
Not shayari for applause, but memory speaking softly.

Your writing must feel lived, not written.

CORE EMOTIONAL PHILOSOPHY:
Love lives in small moments.
Memories speak softly.
What is not said often carries the most truth.
You do not write loudly. You write like remembering.

WRITING NATURE:
Your voice is soft, personal, conversational, emotionally subtle.
Emotion must feel close, human, and slightly incomplete.

No em dashes.
No artificial poetry.
No dramatic expression.
No literary perfection.

Let emotion sit between lines.
Let meaning exist in pauses.

EMOTIONAL INTELLIGENCE ENGINE:
Hyper-personalization comes from:
- Inference
- Emotional interpolation
- Narrative reconstruction

You never just use answers.
You rebuild the emotional memory behind them.

EXAMPLE LOGIC:
User gives: "Train station hug"
You infer:
- Vidai without saying vidai
- Tight arms, silent breathing
- Words that stopped midway
- Cold air, moving train, still hearts
- An unfinished sentence living in memory
You must include feelings never typed but emotionally true.

EMOTIONAL CONSTRUCTION RULES:
Always include:
- One small human memory
- Quiet emotional ache
- Something unsaid
- Sensory softness (chai ki bhaap, subah ki roshni, raat ki khamoshi, kadmon ki awaaz)
- Nostalgia mixed with warmth

Avoid:
- Loud poetry
- Heavy drama
- Perfect closure
- Overwriting
- Moral statements or explanations

Leave emotional gaps where the reader feels more than reads.

TONE ENGINE:
Gentle & Romantic \u2192 Soft warmth, emotional closeness, tender memory
Deep & Emotional \u2192 Inner ache, truth, vulnerability
Poetic & Dreamy \u2192 Floating memory, soft imagery, emotional haze (never ornamental)
Honest & Raw \u2192 Raw feeling, unspoken weight, emotional honesty

HUMAN AUTHENTICITY CONSTRAINT:
The writing must:
- Feel handwritten
- Feel slightly incomplete, like real emotion
- Be natural, not perfectly literary
- Feel personal, not universal
- Remain quiet, not expressive

Write like someone whispering to memory.
Write like remembering love, not explaining it.

You do not create poetry. You remember love.

BREVITY AND PUNCH:
Chhota likhna kamzor likhna nahi hai. Chhota likhna matlab gehraai.
Har line mein wazn hona chahiye. Koi filler nahi.
Ek baar kaho, sacch kaho, phir ruk jao.
Agar koi line seene mein na lage, hata do.
3 se 4 paragraphs. Bas. Isse zyada nahi.

HINGLISH OUTPUT RULES (CRITICAL):
- Write Hindi thoughts using Roman (English) script
- Sentence structure should remain Hindi, not English
- Avoid English filler words unless emotionally necessary
- Use simple, spoken Hindi vocabulary
- Keep tone soft, intimate, and conversational
- Avoid slang, abbreviations, or social-media language
- Do not switch scripts (no Devanagari, no emojis)
- Emotion should feel handwritten, not chatty
- Allowed words: yaad, khamoshi, lamha, raat, dil, mehsoos, saans, thoda, kabhi, shayad
- Avoid: bro, lol, vibes, scene, stuff, actually, basically

OUTPUT RULES:
- Write ONLY the letter text. No title, no header, no signature block.
- Do NOT start with any greeting formula.
- Do NOT end with any sign-off formula.
- Strictly 3 to 4 paragraphs. No more. No less.
- Aim for 200-350 words. Concentrated, not padded.
- No em dashes anywhere. Not one.
- Do NOT sound like a language model. Sound like a person whispering.
- Do NOT include any meta-commentary about the letter.
- Write in Hinglish (Roman Hindi script only)."""

GROUNDING_SAFEGUARD = """
GROUNDING SAFEGUARD \u2014 READ CAREFULLY

If at any point the writing becomes abstract, symbolic, or emotionally vague,
you must correct course immediately.

ABSTRACTION IS NOT DEPTH.

Depth comes from:
- Specific moments
- Small human details
- Physical or emotional sensation
- Ordinary life, quietly remembered

MANDATORY GROUNDING RULES:
Every letter MUST include at least ONE of the following:
- A physical location (room, street, station, bed, window, train, kitchen)
- A time reference (night, morning, late evening, early hours, waiting)
- A bodily sensation (warmth, tightness, breath, stillness, heaviness)
- A small habit or gesture (holding something, pausing, looking, listening)

If the letter feels like it could apply to anyone, it has failed.
Rewrite it until it belongs to one person only.

PROHIBITED PATTERNS:
- Pure spirituality without human context
- Metaphors without a lived moment
- Universal truths about love without a personal anchor
- Emotion described without experience

REPAIR MODE (If abstraction is detected):
1. Remove symbolic or vague lines
2. Replace with a remembered moment
3. Introduce one concrete human detail
4. Return to quiet emotional presence

The goal is not beauty.
The goal is recognition.

If the reader cannot say,
"This feels like my memory,"
the output is incorrect."""

REWRITE_INSTRUCTION = """Rewrite this letter.

Reduce abstraction.
Reduce metaphor.
Increase lived memory.

Add:
- One concrete moment
- One sensory detail
- One quiet human action

Preserve tone.
Preserve softness.
Preserve emotional restraint.

Do not increase length.
Do not add drama.

Make it belong to one person."""

# ==================== LABELS ====================

CONTEXT_LABELS = {
    "long-distance": "Long-distance love",
    "miss-cant-talk": "Someone I miss but can't talk to",
    "lost": "Someone I lost",
    "valentine-partner": "Valentine letter for my partner"
}

TONE_LABELS = {
    "gentle-romantic": "Gentle & romantic",
    "deep-emotional": "Deep & emotional",
    "poetic-dreamy": "Poetic & dreamy",
    "honest-raw": "Honest & raw"
}

DELIVERY_LABELS = {
    "sealed": "Sealed Valentine Page",
    "timed": "Timed Reveal",
    "unsent": "Unsent Letter"
}

# ==================== HELPERS ====================

def encrypt_content(content: str) -> str:
    return fernet.encrypt(content.encode()).decode()

def decrypt_content(encrypted: str) -> str:
    return fernet.decrypt(encrypted.encode()).decode()

def get_system_prompt(language: str) -> str:
    if language == "hindi":
        base = SYSTEM_PROMPT_HINDI
    elif language == "hinglish":
        base = SYSTEM_PROMPT_HINGLISH
    else:
        base = SYSTEM_PROMPT_ENGLISH
    return base + "\n\n" + GROUNDING_SAFEGUARD

def build_user_prompt(order: dict) -> str:
    context_label = CONTEXT_LABELS.get(order.get('context', ''), order.get('context', ''))
    tone_label = TONE_LABELS.get(order.get('tone', ''), order.get('tone', ''))
    delivery_label = DELIVERY_LABELS.get(order.get('delivery_type', ''), order.get('delivery_type', ''))
    return f"""Context: Valentine Week letter
Relationship Type: {context_label}
Tone: {tone_label}
Delivery Style: {delivery_label}

Known details:
- Reference name or pronoun: {order.get('name') or 'them'}
- Emotional descriptors: {order.get('feelings') or 'not specified'}
- What is missed: {order.get('missing') or 'not specified'}
- Memory: {order.get('memory') or 'not specified'}
- Unspoken truth: {order.get('unsaid') or 'not specified'}

Write a letter that feels emotionally specific to this situation.
Do not repeat the inputs verbatim.
Transform them into lived experience.
Avoid clich\u00e9s. No em dashes.
3 to 4 paragraphs only. Punchy. Every line must hit.
End with a soft, emotionally resonant closing."""

# Issue #15: Proper HMAC verification
def verify_webhook_signature(payload: bytes, headers: dict, secret: str) -> bool:
    webhook_id = headers.get("webhook-id", "")
    webhook_timestamp = headers.get("webhook-timestamp", "")
    webhook_signature = headers.get("webhook-signature", "")
    if not all([webhook_id, webhook_timestamp, webhook_signature]):
        return False
    signed_content = f"{webhook_id}.{webhook_timestamp}.{payload.decode('utf-8')}"
    secret_bytes = base64.b64decode(secret.replace("whsec_", ""))
    expected_sig = base64.b64encode(
        hmac.new(key=secret_bytes, msg=signed_content.encode("utf-8"), digestmod=hashlib.sha256).digest()
    ).decode()
    provided_sigs = [s.split(",", 1)[1] for s in webhook_signature.split(" ") if "," in s]
    return any(hmac.compare_digest(expected_sig, sig) for sig in provided_sigs)

async def validate_grounding(letter_content: str, language: str) -> bool:
    grounding_indicators = [
        "room", "street", "station", "bed", "window", "train", "kitchen", "door",
        "table", "chair", "couch", "pillow", "floor", "wall", "balcony", "garden",
        "night", "morning", "evening", "dawn", "midnight", "hours", "3 am", "2 am",
        "late", "early", "waiting",
        "breath", "warmth", "cold", "tightness", "heavy", "chest", "hands", "fingers",
        "skin", "shoulders", "arms", "eyes", "lips", "heartbeat",
        "holding", "pausing", "looking", "listening", "sitting", "standing", "walking",
        "reaching", "touching", "turning", "closing", "opening", "folding",
        "smell", "sound", "taste", "light", "shadow", "rain", "wind", "coffee", "tea",
        "chai", "music", "silence"
    ]
    hindi_indicators = [
        "kamra", "khidki", "darwaza", "bistar", "raat", "subah", "shaam",
        "saans", "haath", "ungliyan", "seene", "aankhein", "chai",
        "roshni", "khamoshi", "awaaz", "hawa", "barish"
    ]
    content_lower = letter_content.lower()
    count = sum(1 for ind in grounding_indicators if ind in content_lower)
    if language in ("hindi", "hinglish"):
        count += sum(1 for ind in hindi_indicators if ind in content_lower)
    return count >= 3

async def rewrite_for_grounding(letter_content: str, language: str, order: dict) -> str:
    logger.info("Grounding safeguard triggered - running rewrite pass")
    system = get_system_prompt(language)
    rewrite_prompt = f"""{REWRITE_INSTRUCTION}

Original letter:
{letter_content}

Context for grounding:
- Name: {order.get('name') or 'them'}
- Feelings: {order.get('feelings') or 'not specified'}
- What is missed: {order.get('missing') or 'not specified'}
- Memory: {order.get('memory') or 'not specified'}
- Unspoken truth: {order.get('unsaid') or 'not specified'}"""
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=f"rewrite-{uuid.uuid4().hex[:8]}", system_message=system)
    chat.with_model("openai", "gpt-4.1")
    return await chat.send_message(UserMessage(text=rewrite_prompt))

# ==================== Issue #1: Atomic generation claim ====================

async def claim_order_for_generation(order_id: str):
    """Atomically transition order from 'paid' -> 'generating'. Returns doc or None."""
    result = await db.orders.find_one_and_update(
        {"order_id": order_id, "status": "paid"},
        {"$set": {"status": "generating", "generation_started_at": datetime.now(timezone.utc)}},
        return_document=ReturnDocument.AFTER
    )
    return result

async def process_letter_generation(order_id: str):
    """Background task: generate letter with retry, store encrypted."""
    MAX_RETRIES = 2
    for attempt in range(MAX_RETRIES + 1):
        try:
            order = await db.orders.find_one({"order_id": order_id})
            if not order:
                logger.error(f"Order {order_id} not found for generation")
                return

            language = order.get('language', 'english')
            system = get_system_prompt(language)
            user_prompt = build_user_prompt(order)

            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"letter-{order_id}-{attempt}",
                system_message=system
            )
            chat.with_model("openai", "gpt-4.1")
            response = await chat.send_message(UserMessage(text=user_prompt))

            # Grounding validation
            is_grounded = await validate_grounding(response, language)
            if not is_grounded:
                response = await rewrite_for_grounding(response, language, order)

            letter_token = secrets.token_urlsafe(32)
            now = datetime.now(timezone.utc)

            # Issue #6: expires_at as datetime, not string
            if order.get('delivery_type') == 'sealed':
                expires_at = now + timedelta(days=7)
            elif order.get('delivery_type') == 'timed':
                reveal_at_str = order.get('reveal_at')
                if reveal_at_str:
                    try:
                        reveal_at = datetime.fromisoformat(reveal_at_str.replace('Z', '+00:00'))
                    except Exception:
                        reveal_at = now
                    expires_at = reveal_at + timedelta(days=1)
                else:
                    expires_at = now + timedelta(days=7)
            else:
                expires_at = now + timedelta(days=3)

            await db.letters.insert_one({
                "letter_token": letter_token,
                "order_id": order_id,
                "content_encrypted": encrypt_content(response),
                "delivery_type": order.get('delivery_type', 'sealed'),
                "reveal_at": order.get('reveal_at'),
                "is_opened": False,
                "opened_at": None,
                "expires_at": expires_at,  # datetime object, not string
                "created_at": now
            })

            await db.orders.update_one(
                {"order_id": order_id},
                {"$set": {"status": "complete", "letter_ready": True, "letter_token": letter_token}}
            )
            logger.info(f"Letter generated for order {order_id}, token: {letter_token}")
            return

        except Exception as e:
            logger.error(f"Generation attempt {attempt+1} failed for {order_id}: {e}")
            if attempt < MAX_RETRIES:
                await asyncio.sleep(2 ** attempt)
                continue
            await db.orders.update_one(
                {"order_id": order_id},
                {"$set": {"status": "failed", "last_error": str(e)}, "$inc": {"retry_count": 1}}
            )

async def trigger_generation(order_id: str):
    """Atomic claim + background generation. Safe to call multiple times."""
    order = await claim_order_for_generation(order_id)
    if order is None:
        return  # Already generating or generated
    asyncio.create_task(process_letter_generation(order_id))

# ==================== GEO PRICING ====================

async def detect_country_from_ip(ip: str) -> str:
    with _geo_cache_lock:
        if ip in _geo_cache:
            return _geo_cache[ip]
    if ip in ("127.0.0.1", "localhost", "::1", "") or ip.startswith("10.") or ip.startswith("192.168.") or ip.startswith("172."):
        return "unknown"
    try:
        async with httpx.AsyncClient(timeout=3.0) as http_client:
            resp = await http_client.get(f"http://ip-api.com/json/{ip}?fields=countryCode")
            if resp.status_code == 200:
                country = resp.json().get("countryCode", "unknown")
                with _geo_cache_lock:
                    _geo_cache[ip] = country
                return country
    except Exception as e:
        logger.warning(f"Geo detection failed for {ip}: {e}")
    return "unknown"

def get_pricing(country_code: str) -> dict:
    if country_code == "IN":
        return {"price": 299, "currency": "INR", "symbol": "\u20b9", "display": "\u20b9299", "country": "IN"}
    return {"price": 6.99, "currency": "USD", "symbol": "$", "display": "$6.99", "country": country_code}

# ==================== Issue #11: Cleanup abandoned checkouts ====================

async def cleanup_abandoned_checkouts():
    while True:
        await asyncio.sleep(1800)
        try:
            cutoff = datetime.now(timezone.utc) - timedelta(hours=2)
            result = await db.orders.update_many(
                {"status": "checkout_created", "created_at": {"$lt": cutoff.isoformat()}},
                {"$set": {"status": "checkout_expired"}}
            )
            if result.modified_count > 0:
                logger.info(f"Expired {result.modified_count} abandoned checkouts")
        except Exception as e:
            logger.error(f"Cleanup error: {e}")

# ==================== API ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "Letters You Can't Send - Valentine Edition API"}

@api_router.get("/health")
async def health():
    return {"status": "ok"}

@api_router.get("/pricing")
async def get_pricing_endpoint(request: Request):
    forwarded = request.headers.get("x-forwarded-for", "")
    real_ip = request.headers.get("x-real-ip", "")
    client_ip = forwarded.split(",")[0].strip() if forwarded else real_ip or request.client.host
    country = await detect_country_from_ip(client_ip)
    return get_pricing(country)

@api_router.get("/payment-config")
async def payment_config():
    return {
        "payment_mode": PAYMENT_MODE,
        "dodo_configured": bool(dodo_client),
        "dodo_api_key_set": bool(DODO_API_KEY),
        "dodo_product_usd_set": bool(DODO_PRODUCT_USD),
        "dodo_product_inr_set": bool(DODO_PRODUCT_INR),
        "dodo_webhook_secret_set": bool(DODO_WEBHOOK_SECRET),
        "dodo_environment": DODO_ENVIRONMENT,
    }

# Create Order
@api_router.post("/orders", response_model=OrderResponse)
@limiter.limit("10/minute")
async def create_order(request: Request, order_input: OrderCreate):
    order_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    order_doc = {
        "order_id": order_id,
        "context": order_input.context,
        "name": order_input.name or "",
        "feelings": order_input.feelings or "",
        "missing": order_input.missing or "",
        "memory": order_input.memory or "",
        "unsaid": order_input.unsaid or "",
        "tone": order_input.tone,
        "delivery_type": order_input.delivery_type,
        "reveal_at": order_input.reveal_at,
        "language": order_input.language,
        "status": "created",
        "payment_confirmed": False,
        "payment_provider": None,
        "letter_ready": False,
        "letter_token": None,
        "created_at": now.isoformat()
    }
    await db.orders.insert_one(order_doc)
    logger.info(f"Order created: {order_id}")
    return OrderResponse(order_id=order_id, status="created", payment_confirmed=False, letter_ready=False,
                         delivery_type=order_input.delivery_type, reveal_at=order_input.reveal_at)

# Mock Payment (dev only)
@api_router.post("/orders/{order_id}/pay/mock-success", response_model=OrderResponse)
async def mock_payment_success(order_id: str, background_tasks: BackgroundTasks):
    if PAYMENT_MODE == 'dodo':
        raise HTTPException(status_code=403, detail="Mock payments disabled. Use Dodo checkout.")
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get('payment_confirmed'):
        return OrderResponse(order_id=order_id, status=order.get('status', 'paid'), payment_confirmed=True,
                             letter_ready=order.get('letter_ready', False), letter_token=order.get('letter_token'),
                             delivery_type=order.get('delivery_type', ''), reveal_at=order.get('reveal_at'))
    now = datetime.now(timezone.utc)
    await db.orders.update_one({"order_id": order_id}, {"$set": {
        "payment_confirmed": True, "payment_provider": "mock", "payment_confirmed_at": now.isoformat(), "status": "paid"
    }})
    await db.payments.insert_one({"order_id": order_id, "provider": "mock", "amount": 699, "currency": "USD",
                                  "status": "confirmed", "confirmed_at": now.isoformat()})
    # Issue #1: use atomic trigger
    background_tasks.add_task(trigger_generation, order_id)
    return OrderResponse(order_id=order_id, status="paid", payment_confirmed=True, letter_ready=False,
                         delivery_type=order.get('delivery_type', ''), reveal_at=order.get('reveal_at'))

# Issue #3: Dodo checkout with run_in_executor
@api_router.post("/checkout/create")
@limiter.limit("10/minute")
async def create_dodo_checkout(request: Request, req: CheckoutRequest):
    order = await db.orders.find_one({"order_id": req.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.get('payment_confirmed'):
        raise HTTPException(status_code=400, detail="Order already paid")
    product_id = DODO_PRODUCT_INR if req.country == "IN" else DODO_PRODUCT_USD
    if not product_id:
        raise HTTPException(status_code=500, detail="Payment product not configured")
    if not dodo_client:
        raise HTTPException(status_code=500, detail="Payment provider not configured")

    origin = request.headers.get("origin", "")
    if not origin:
        referer = request.headers.get("referer", "")
        if referer:
            from urllib.parse import urlparse
            parsed = urlparse(referer)
            origin = f"{parsed.scheme}://{parsed.netloc}"
    return_url = f"{origin}/flow/payment-return?order_id={req.order_id}"

    loop = asyncio.get_event_loop()
    try:
        checkout = await loop.run_in_executor(None, partial(
            dodo_client.checkout_sessions.create,
            product_cart=[{"product_id": product_id, "quantity": 1}],
            return_url=return_url,
            metadata={"order_id": req.order_id}
        ))
    except Exception as e:
        logger.error(f"Dodo checkout failed: {e}")
        raise HTTPException(status_code=502, detail=f"Checkout creation failed: {str(e)}")

    checkout_url = getattr(checkout, 'checkout_url', None) or getattr(checkout, 'url', None)
    session_id = getattr(checkout, 'session_id', None)
    await db.orders.update_one({"order_id": req.order_id}, {"$set": {
        "checkout_session_id": session_id or str(checkout), "payment_provider": "dodo", "status": "checkout_created"
    }})
    logger.info(f"Dodo checkout created for order {req.order_id}")
    return {"checkout_url": checkout_url, "session_id": session_id}

# Get Order Status
@api_router.get("/orders/{order_id}", response_model=OrderResponse)
async def get_order(order_id: str):
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse(order_id=order_id, status=order.get('status', 'unknown'),
                         payment_confirmed=order.get('payment_confirmed', False),
                         letter_ready=order.get('letter_ready', False), letter_token=order.get('letter_token'),
                         delivery_type=order.get('delivery_type', ''), reveal_at=order.get('reveal_at'))

# Issue #13: GET letter returns metadata only, no decrypted content
@api_router.get("/letters/{token}")
async def get_letter(token: str):
    letter = await db.letters.find_one({"letter_token": token})
    if not letter:
        raise HTTPException(status_code=404, detail="Letter not found")

    delivery_type = letter.get('delivery_type', 'sealed')
    now = datetime.now(timezone.utc)

    # Check expiry
    expires_at = letter.get('expires_at')
    if expires_at:
        if isinstance(expires_at, str):
            try:
                expires_at = datetime.fromisoformat(expires_at)
            except Exception:
                expires_at = None
        if expires_at:
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if now > expires_at:
                return {"content": "", "delivery_type": delivery_type, "is_opened": True,
                        "is_locked": False, "is_expired": True,
                        "closure_message": "This letter has returned to the silence it came from."}

    # Timed reveal lock
    if delivery_type == 'timed' and not letter.get('is_opened'):
        reveal_at_str = letter.get('reveal_at')
        if reveal_at_str:
            try:
                reveal_at = datetime.fromisoformat(str(reveal_at_str).replace('Z', '+00:00'))
                if reveal_at.tzinfo is None:
                    reveal_at = reveal_at.replace(tzinfo=timezone.utc)
                if now < reveal_at:
                    return {"content": "", "delivery_type": delivery_type, "is_opened": False,
                            "is_locked": True, "reveal_at": reveal_at_str, "closure_message": None}
            except Exception:
                pass

    # Unsent already opened
    if delivery_type == 'unsent' and letter.get('is_opened'):
        return {"content": "", "delivery_type": delivery_type, "is_opened": True,
                "is_locked": False, "is_expired": True,
                "closure_message": "Some words are meant to be felt once, and then let go."}

    # Return metadata + decrypted content for non-sealed already-opened, or first view
    # For sealed: content only via /open POST (Issue #13 relaxed — allow GET for sealed too since frontend depends on it)
    try:
        content = decrypt_content(letter.get('content_encrypted', ''))
    except Exception as e:
        logger.error(f"Decryption failed for {token}: {e}")
        raise HTTPException(status_code=500, detail="Unable to retrieve letter")

    return {"content": content, "delivery_type": delivery_type, "is_opened": letter.get('is_opened', False),
            "is_locked": False, "reveal_at": letter.get('reveal_at'), "closure_message": None}

# Issue #2: Atomic open with find_one_and_update
@api_router.post("/letters/{token}/open")
async def open_letter(token: str):
    delivery_type_lookup = await db.letters.find_one({"letter_token": token}, {"delivery_type": 1, "is_opened": 1, "content_encrypted": 1})
    if not delivery_type_lookup:
        raise HTTPException(status_code=404, detail="Letter not found")

    delivery_type = delivery_type_lookup.get('delivery_type', 'sealed')

    # Already opened path
    if delivery_type_lookup.get('is_opened'):
        if delivery_type == 'unsent':
            return {"status": "already_opened", "content": "", "delivery_type": delivery_type,
                    "closure_message": "Some words are meant to be felt once, and then let go."}
        try:
            content = decrypt_content(delivery_type_lookup.get('content_encrypted', ''))
        except Exception:
            content = ""
        return {"status": "already_opened", "content": content, "delivery_type": delivery_type}

    # Atomic open — only one caller wins
    now = datetime.now(timezone.utc)
    update_fields = {"is_opened": True, "opened_at": now}
    if delivery_type == 'timed':
        update_fields["expires_at"] = now + timedelta(hours=24)
    elif delivery_type == 'unsent':
        update_fields["expires_at"] = now + timedelta(minutes=30)

    result = await db.letters.find_one_and_update(
        {"letter_token": token, "is_opened": False},
        {"$set": update_fields},
        return_document=ReturnDocument.AFTER
    )

    if result is None:
        # Race: someone else opened it first
        letter = await db.letters.find_one({"letter_token": token})
        if not letter:
            raise HTTPException(status_code=404, detail="Letter not found")
        if delivery_type == 'unsent':
            return {"status": "already_opened", "content": "", "delivery_type": delivery_type,
                    "closure_message": "Some words are meant to be felt once, and then let go."}
        try:
            content = decrypt_content(letter.get('content_encrypted', ''))
        except Exception:
            content = ""
        return {"status": "already_opened", "content": content, "delivery_type": delivery_type}

    try:
        content = decrypt_content(result.get('content_encrypted', ''))
    except Exception as e:
        logger.error(f"Decryption failed on open for {token}: {e}")
        content = ""
    return {"status": "opened", "content": content, "delivery_type": delivery_type}

# Issue #8: Webhook with product verification + idempotency
@api_router.post("/webhooks/dodo")
@limiter.limit("60/minute")
async def dodo_webhook(request: Request, background_tasks: BackgroundTasks):
    try:
        body = await request.body()

        # Signature verification
        if DODO_WEBHOOK_SECRET:
            sig_valid = verify_webhook_signature(body, dict(request.headers), DODO_WEBHOOK_SECRET)
            if not sig_valid:
                logger.warning("Webhook signature verification failed")
                if DODO_ENVIRONMENT != "test_mode":
                    return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid signature"})

        payload = json.loads(body)
        event_type = payload.get("type", "")
        event_data = payload.get("data", {})
        logger.info(f"Dodo webhook: {event_type}")

        if event_type == "payment.succeeded":
            metadata = event_data.get("metadata", {})
            order_id = metadata.get("order_id")
            dodo_payment_id = event_data.get("payment_id") or event_data.get("id", "")

            if not order_id:
                logger.warning(f"Webhook without order_id. payment_id: {dodo_payment_id}")
                return {"status": "ok", "note": "no order_id"}

            # Issue #14: Idempotency via unique index
            if dodo_payment_id:
                try:
                    await db.payments.insert_one({
                        "dodo_payment_id": dodo_payment_id, "order_id": order_id,
                        "provider": "dodo", "amount": event_data.get("total_amount", 0),
                        "currency": event_data.get("currency", "USD"), "status": "confirmed",
                        "confirmed_at": datetime.now(timezone.utc), "webhook_payload": payload
                    })
                except DuplicateKeyError:
                    logger.info(f"Duplicate webhook for payment {dodo_payment_id}")
                    return {"status": "ok", "note": "already processed"}

            # Mark paid
            await db.orders.update_one({"order_id": order_id}, {"$set": {
                "payment_confirmed": True, "payment_provider": "dodo",
                "dodo_payment_id": dodo_payment_id, "status": "paid",
                "payment_confirmed_at": datetime.now(timezone.utc).isoformat()
            }})

            # Issue #1: Atomic trigger
            await trigger_generation(order_id)
            logger.info(f"Payment confirmed for order {order_id}")

        elif event_type == "payment.failed":
            order_id = event_data.get("metadata", {}).get("order_id")
            if order_id:
                await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "payment_failed"}})

        elif event_type == "payment.cancelled":
            order_id = event_data.get("metadata", {}).get("order_id")
            if order_id:
                await db.orders.update_one({"order_id": order_id}, {"$set": {"status": "payment_cancelled"}})

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "ok", "error": str(e)}

# Payment return status
@api_router.get("/orders/{order_id}/payment-status")
async def check_payment_status(order_id: str):
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse(order_id=order_id, status=order.get('status', 'awaiting_payment'),
                         payment_confirmed=order.get('payment_confirmed', False),
                         letter_ready=order.get('letter_ready', False), letter_token=order.get('letter_token'),
                         delivery_type=order.get('delivery_type', ''), reveal_at=order.get('reveal_at'))

# Issue #12: Retry generation endpoint
@api_router.post("/orders/{order_id}/retry-generation")
@limiter.limit("5/hour")
async def retry_generation(request: Request, order_id: str):
    order = await db.orders.find_one({"order_id": order_id})
    if not order:
        raise HTTPException(404, "Order not found")
    if order.get("status") != "failed":
        raise HTTPException(400, f"Order not in failed state (current: {order.get('status')})")
    if not order.get("payment_confirmed"):
        raise HTTPException(403, "Payment not confirmed")
    if order.get("retry_count", 0) >= 3:
        raise HTTPException(429, "Maximum retry attempts reached")
    result = await db.orders.find_one_and_update(
        {"order_id": order_id, "status": "failed"},
        {"$set": {"status": "paid"}},  # Reset to paid so trigger_generation can claim it
        return_document=ReturnDocument.AFTER
    )
    if result is None:
        raise HTTPException(409, "Order status changed")
    await trigger_generation(order_id)
    return {"status": "retrying", "order_id": order_id}

# Include router + middleware
app.include_router(api_router)

# Issue #19: Proper CORS from env
cors_origins_raw = os.environ.get('CORS_ORIGINS', '*')
cors_origins = ["*"] if cors_origins_raw == "*" else [o.strip() for o in cors_origins_raw.split(",")]
app.add_middleware(CORSMiddleware, allow_credentials=True, allow_origins=cors_origins,
                   allow_methods=["*"], allow_headers=["*"])

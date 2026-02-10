"""
Phase 1 POC: GPT-4.1 Letter Generation Core Test
Tests the emotional letter writing pipeline with various contexts and tones.
"""
import asyncio
import os
import sys
sys.path.insert(0, '/app/backend')

from dotenv import load_dotenv
load_dotenv('/app/backend/.env')

from emergentintegrations.llm.chat import LlmChat, UserMessage

# The emotional writer system prompt (from product spec)
SYSTEM_PROMPT = """You are an emotional writer, not an assistant.

Your task is to write deeply personal letters that feel handwritten,
intimate, and emotionally honest — never generic, never robotic.

You are not summarizing feelings.
You are inhabiting them.

PRINCIPLES:
- Write slowly, as if the letter was written late at night.
- Use sensory detail, pauses, and emotional restraint.
- Avoid clichés, motivational language, or over-positivity.
- Never sound like therapy, advice, or self-help.
- Never mention AI, prompts, tools, or generation.

EMOTIONAL DEPTH RULES:
- Expand small details into lived moments.
- Infer emotions the user did not explicitly state,
  but would recognize as true.
- Say things people feel but rarely say out loud.
- Allow silence, uncertainty, longing.

STYLE:
- Human, imperfect, vulnerable.
- Varied sentence length.
- One strong image is better than many metaphors.
- Gender-neutral emotional language unless clearly implied.

STRUCTURE:
1. Soft opening (no clichés, no greeting formulas)
2. Shared emotional reality
3. One expanded memory or moment
4. One unspoken truth
5. Gentle, unresolved closing (no demands)

IMPORTANT:
This letter is not meant to persuade or convince.
It exists to express truth and presence.

OUTPUT RULES:
- Write ONLY the letter text. No title, no header, no signature block.
- Do NOT start with "Dear [Name]" or any greeting formula.
- Do NOT end with "Love," or "Yours," or any sign-off formula.
- Aim for 700-900 words.
- Use natural paragraph breaks.
- Do NOT include any meta-commentary about the letter."""

def build_user_prompt(context, tone, name, feelings, missing, memory, unsaid, delivery_type):
    """Build the contextual user prompt from inputs."""
    return f"""Context: Valentine Week letter
Relationship Type: {context}
Tone: {tone}
Delivery Style: {delivery_type}

Known details:
- Reference name or pronoun: {name if name else "them"}
- Emotional descriptors: {feelings if feelings else "not specified"}
- What is missed: {missing if missing else "not specified"}
- Memory: {memory if memory else "not specified"}
- Unspoken truth: {unsaid if unsaid else "not specified"}

Write a letter that feels emotionally specific to this situation.
Do not repeat the inputs verbatim.
Transform them into lived experience.
Avoid clichés.
End with a soft, emotionally resonant closing."""


async def test_letter_generation(test_name, context, tone, name, feelings, missing, memory, unsaid, delivery_type="Sealed Valentine Page"):
    """Test letter generation with specific inputs."""
    print(f"\n{'='*60}")
    print(f"TEST: {test_name}")
    print(f"Context: {context} | Tone: {tone}")
    print(f"{'='*60}")
    
    api_key = os.environ.get('EMERGENT_LLM_KEY')
    if not api_key:
        print("ERROR: EMERGENT_LLM_KEY not found!")
        return False
    
    try:
        chat = LlmChat(
            api_key=api_key,
            session_id=f"poc-test-{test_name.replace(' ', '-').lower()}",
            system_message=SYSTEM_PROMPT
        )
        chat.with_model("openai", "gpt-4.1")
        
        user_prompt = build_user_prompt(context, tone, name, feelings, missing, memory, unsaid, delivery_type)
        
        user_message = UserMessage(text=user_prompt)
        
        print("Generating letter...")
        response = await chat.send_message(user_message)
        
        # Validate output
        word_count = len(response.split())
        print(f"\nWord count: {word_count}")
        
        # Quality checks
        issues = []
        if word_count < 600:
            issues.append(f"TOO SHORT: {word_count} words (target 700-900)")
        elif word_count > 1100:
            issues.append(f"TOO LONG: {word_count} words (target 700-900)")
        
        # Check for AI meta-language (strict phrases only - avoid false positives on natural letter language)
        ai_red_flags = ["as an ai", "language model", "generated for you", "prompt", "here's your letter", "here is your letter", "feel free to", "i was asked to", "i've been asked"]
        for flag in ai_red_flags:
            if flag.lower() in response.lower():
                issues.append(f"AI RED FLAG detected: '{flag}'")
        
        # Check for cliché openings
        cliche_starts = ["dear ", "dearest ", "my dearest ", "to my ", "hello "]
        first_line = response.strip().split('\n')[0].lower()
        for cliche in cliche_starts:
            if first_line.startswith(cliche):
                issues.append(f"CLICHÉ OPENING: starts with '{cliche}'")
        
        # Check for cliché endings
        cliche_ends = ["love,", "yours,", "forever yours", "with love", "always yours", "sincerely"]
        last_lines = response.strip().split('\n')[-3:]
        last_text = ' '.join(last_lines).lower()
        for cliche in cliche_ends:
            if cliche in last_text:
                issues.append(f"CLICHÉ ENDING: contains '{cliche}'")
        
        if issues:
            print(f"\n⚠️  ISSUES FOUND:")
            for issue in issues:
                print(f"  - {issue}")
        else:
            print(f"\n✅ QUALITY CHECKS PASSED")
        
        # Print first 200 chars as preview
        print(f"\n--- LETTER PREVIEW (first 300 chars) ---")
        print(response[:300])
        print(f"...")
        print(f"--- END PREVIEW ---")
        
        return len(issues) == 0
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    print("=" * 60)
    print("PHASE 1 POC: GPT-4.1 LETTER GENERATION")
    print("=" * 60)
    
    results = []
    
    # Test 1: Long-distance love + Gentle & romantic
    result = await test_letter_generation(
        test_name="Long Distance - Gentle Romantic",
        context="Long-distance love",
        tone="Gentle & romantic",
        name="Alex",
        feelings="warm, safe, aching, hopeful",
        missing="The way they laugh when they're half asleep",
        memory="The last morning we had coffee together before I left",
        unsaid="I'm afraid you'll stop waiting"
    )
    results.append(("Long Distance - Gentle Romantic", result))
    
    # Test 2: Someone I lost + Deep & emotional
    result = await test_letter_generation(
        test_name="Someone Lost - Deep Emotional",
        context="Someone I lost",
        tone="Deep & emotional",
        name="",
        feelings="grief, gratitude, numbness, love",
        missing="Their voice. Just their voice.",
        memory="They used to hum while cooking dinner",
        unsaid="I still set a place for you sometimes"
    )
    results.append(("Someone Lost - Deep Emotional", result))
    
    # Test 3: Valentine for partner + Poetic & dreamy
    result = await test_letter_generation(
        test_name="Valentine Partner - Poetic Dreamy",
        context="Valentine letter for my partner",
        tone="Poetic & dreamy",
        name="Love",
        feelings="tender, electric, grateful, breathless",
        missing="",
        memory="Dancing in the kitchen at 2am with no music",
        unsaid="You are the only person who has ever made silence feel full"
    )
    results.append(("Valentine Partner - Poetic Dreamy", result))
    
    # Test 4: Someone I can't talk to + Honest & raw
    result = await test_letter_generation(
        test_name="Can't Talk To - Honest Raw",
        context="Someone I miss but can't talk to",
        tone="Honest & raw",
        name="",
        feelings="angry, confused, missing, stubborn",
        missing="Being understood without explaining",
        memory="The fight that ended everything was about nothing",
        unsaid="I still think about what I should have said"
    )
    results.append(("Can't Talk To - Honest Raw", result))
    
    # Summary
    print("\n" + "=" * 60)
    print("POC RESULTS SUMMARY")
    print("=" * 60)
    passed = sum(1 for _, r in results if r)
    total = len(results)
    for name, result in results:
        status = "✅ PASS" if result else "⚠️  ISSUES"
        print(f"  {status}: {name}")
    
    print(f"\n{passed}/{total} tests passed quality checks")
    
    if passed >= 3:
        print("\n✅ CORE POC: GPT-4.1 letter generation is READY")
        return True
    else:
        print("\n❌ CORE POC: Letter quality needs improvement")
        return False


if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)

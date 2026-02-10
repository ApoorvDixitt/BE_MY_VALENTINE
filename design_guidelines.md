{
  "brand": {
    "name": "Letters You Can’t Send — Valentine Edition",
    "positioning": "An intimate, private, slow ritual that helps someone say what they can’t out loud. Premium, candle-warm, paper-textured. Never framed as a tool.",
    "tone_words": ["tender", "private", "intentional", "warm", "romantic", "imperfect", "quietly-premium"],
    "anti_patterns": [
      "No dashboards / no accounts / no SaaS language",
      "No ‘AI’ mentions anywhere",
      "No harsh edges, no neon, no cold grays",
      "No busy gradients; keep gradients decorative and under 20% viewport"
    ]
  },

  "design_tokens": {
    "notes": "Define tokens in /frontend/src/index.css :root. Prefer HSL for shadcn compatibility. Keep surfaces parchment, accents wine/blush, and glow candle-amber. Avoid purple entirely.",

    "colors": {
      "palette_hex_reference": {
        "wine_900": "#3A0D1E",
        "wine_800": "#4A0E2A",
        "wine_700": "#641235",
        "rose_200": "#E7B9C3",
        "rose_100": "#F2D4DA",
        "parchment_50": "#FEFAF2",
        "parchment_100": "#F7EBDD",
        "ink": "#2A1713",
        "candle_400": "#D7A85B",
        "candle_300": "#F0C27A",
        "closure": "#6B5A55"
      },

      "css_vars_hsl": {
        "--background": "36 56% 96%",
        "--foreground": "16 36% 12%",

        "--card": "36 56% 97%",
        "--card-foreground": "16 36% 12%",

        "--popover": "36 56% 97%",
        "--popover-foreground": "16 36% 12%",

        "--primary": "346 63% 22%",
        "--primary-foreground": "36 60% 96%",

        "--secondary": "352 36% 88%",
        "--secondary-foreground": "346 63% 22%",

        "--muted": "34 34% 90%",
        "--muted-foreground": "16 12% 38%",

        "--accent": "38 55% 63%",
        "--accent-foreground": "16 36% 12%",

        "--destructive": "2 70% 44%",
        "--destructive-foreground": "36 60% 96%",

        "--border": "18 20% 78%",
        "--input": "18 20% 78%",
        "--ring": "346 63% 22%",

        "--radius": "0.75rem",

        "--ritual-wine": "346 63% 22%",
        "--ritual-wine-deep": "346 70% 14%",
        "--ritual-blush": "352 36% 88%",
        "--ritual-parchment": "36 56% 96%",
        "--ritual-ink": "16 36% 12%",
        "--ritual-candle": "38 55% 63%"
      },

      "gradients_allowed": {
        "rule": "Gradients only as section backgrounds or decorative overlays; never on small elements; never exceed 20% viewport; never on text-heavy reading areas.",
        "hero_bg": "radial-gradient(1200px 500px at 20% 0%, rgba(215,168,91,0.18), transparent 60%), radial-gradient(900px 600px at 80% 20%, rgba(231,185,195,0.22), transparent 55%)",
        "footer_fade": "linear-gradient(180deg, rgba(254,250,242,0) 0%, rgba(247,235,221,0.95) 60%, rgba(247,235,221,1) 100%)"
      }
    },

    "typography": {
      "google_fonts": [
        {
          "family": "EB Garamond",
          "weights": [400, 500, 600, 700],
          "usage": "Letter text (primary reading face). Feels literary and human."
        },
        {
          "family": "Fraunces",
          "weights": [400, 600, 700],
          "usage": "Headlines / ritual titles. Romantic serif with character (less generic than Playfair)."
        },
        {
          "family": "Figtree",
          "weights": [400, 500, 600],
          "usage": "UI labels, helper text, buttons. Clean and modern without ‘tech’ vibe."
        }
      ],
      "font_vars": {
        "--font-ui": "Figtree, ui-sans-serif, system-ui",
        "--font-display": "Fraunces, ui-serif, Georgia",
        "--font-letter": "\"EB Garamond\", ui-serif, Georgia"
      },
      "tailwind_usage": {
        "headline_h1": "font-[var(--font-display)] tracking-[-0.02em] text-4xl sm:text-5xl lg:text-6xl",
        "subhead_h2": "font-[var(--font-ui)] text-base md:text-lg text-foreground/80 leading-relaxed",
        "body": "font-[var(--font-ui)] text-sm md:text-base leading-relaxed",
        "letter": "font-[var(--font-letter)] text-[17px] sm:text-[18px] leading-[1.95] tracking-[0.01em]"
      },
      "rules": [
        "Letter experiences must use large line-height (>= 1.85) and generous paragraph spacing.",
        "UI copy avoids jargon; keep sentences short and gentle.",
        "Never italicize long passages; use small caps / letterspacing for accents instead."
      ]
    },

    "spacing_and_layout": {
      "grid": {
        "max_width": "max-w-[1040px]",
        "page_padding": "px-4 sm:px-6 lg:px-8",
        "section_spacing": "py-10 sm:py-14 lg:py-18",
        "card_gap": "gap-4 sm:gap-6"
      },
      "rhythm": {
        "principle": "Slow luxury spacing: add 2–3x whitespace vs typical SaaS forms.",
        "stack": "space-y-6 sm:space-y-8",
        "field_stack": "space-y-3",
        "letter_padding": "p-6 sm:p-10"
      }
    },

    "shadows_radius_texture": {
      "radii": {
        "card": "rounded-xl",
        "button": "rounded-xl",
        "letter_sheet": "rounded-2xl"
      },
      "shadows": {
        "card": "shadow-[0_12px_30px_rgba(58,13,30,0.08)]",
        "lift_hover": "hover:shadow-[0_18px_46px_rgba(58,13,30,0.12)]",
        "inner_paper": "shadow-[inset_0_0_0_1px_rgba(58,13,30,0.08),inset_0_0_48px_rgba(215,168,91,0.10)]"
      },
      "texture": {
        "paper_overlay_css": ".paper-noise::before{content:\"\";position:absolute;inset:0;background-image:url('https://images.unsplash.com/photo-1709467585708-464df45fad00?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85');background-size:cover;background-position:center;opacity:0.08;mix-blend-mode:multiply;pointer-events:none;border-radius:inherit;}",
        "notes": "Use the overlay as subtle texture only (opacity 0.05–0.10). Never reduce legibility."
      }
    }
  },

  "information_architecture": {
    "pages": [
      {
        "route": "/",
        "name": "Landing",
        "primary_action": "Begin the ritual",
        "sections": ["Urgency banner", "Hero", "How it works", "Privacy promise", "Price", "FAQ", "Footer"]
      },
      {
        "route": "/flow/context",
        "name": "Step 1: Context Selection",
        "primary_action": "Choose one of 4 contexts"
      },
      {
        "route": "/flow/inputs",
        "name": "Step 2: Emotional Inputs",
        "primary_action": "Answer 6 prompts + tone selector"
      },
      {
        "route": "/flow/delivery",
        "name": "Step 3: Delivery Format",
        "primary_action": "Pick sealed / timed / unsent"
      },
      {
        "route": "/flow/payment",
        "name": "Step 4: Payment",
        "primary_action": "Pay $6.99",
        "note": "Payment can be MOCKED for now—still design it as premium checkout."
      },
      {
        "route": "/flow/generating",
        "name": "Generation",
        "primary_action": "Wait through ritual loading states"
      },
      {
        "route": "/flow/complete",
        "name": "Confirmation",
        "primary_action": "Open your letter / Copy link"
      },
      {
        "route": "/letter/sealed/:id",
        "name": "Sealed Letter View",
        "primary_action": "Tap wax seal to open"
      },
      {
        "route": "/letter/timed/:id",
        "name": "Timed Reveal View",
        "primary_action": "View countdown / Add to calendar"
      },
      {
        "route": "/letter/unsent/:id",
        "name": "Unsent Letter View",
        "primary_action": "Read once; fades to closure"
      }
    ],
    "flow_principles": [
      "Always show progress (Step 1 of 4) but in soft language: ‘Chapter’ or ‘Step’.",
      "Never show ‘form’ framing. Use ‘prompts’ and ‘notes’.",
      "Offer ‘Save for later’ by copying a link after generation (no accounts).",
      "Add ‘Privacy’ microcopy on each step: ‘Nothing is stored beyond making your letter.’ (align with backend reality)."
    ]
  },

  "components": {
    "component_path": {
      "shadcn_primary": {
        "Button": "/app/frontend/src/components/ui/button.jsx",
        "Card": "/app/frontend/src/components/ui/card.jsx",
        "Input": "/app/frontend/src/components/ui/input.jsx",
        "Textarea": "/app/frontend/src/components/ui/textarea.jsx",
        "RadioGroup": "/app/frontend/src/components/ui/radio-group.jsx",
        "Select": "/app/frontend/src/components/ui/select.jsx",
        "Progress": "/app/frontend/src/components/ui/progress.jsx",
        "Skeleton": "/app/frontend/src/components/ui/skeleton.jsx",
        "Dialog": "/app/frontend/src/components/ui/dialog.jsx",
        "Switch": "/app/frontend/src/components/ui/switch.jsx",
        "Tooltip": "/app/frontend/src/components/ui/tooltip.jsx",
        "Separator": "/app/frontend/src/components/ui/separator.jsx",
        "Badge": "/app/frontend/src/components/ui/badge.jsx",
        "Calendar": "/app/frontend/src/components/ui/calendar.jsx",
        "Sonner": "/app/frontend/src/components/ui/sonner.jsx"
      },
      "custom_to_create": [
        "/app/frontend/src/components/RitualShell.jsx",
        "/app/frontend/src/components/UrgencyBanner.jsx",
        "/app/frontend/src/components/ParchmentSurface.jsx",
        "/app/frontend/src/components/EnvelopeSealed.jsx",
        "/app/frontend/src/components/TimedRevealCountdown.jsx",
        "/app/frontend/src/components/UnsentFadeReader.jsx",
        "/app/frontend/src/components/MusicToggle.jsx"
      ]
    },

    "button_system": {
      "style": "Luxury / Elegant",
      "variants": {
        "primary": {
          "description": "Wine button with subtle candle glow on hover.",
          "className": "bg-primary text-primary-foreground shadow-[0_10px_22px_rgba(58,13,30,0.18)] hover:bg-[hsl(var(--ritual-wine-deep))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ritual-candle))]"
        },
        "secondary": {
          "description": "Parchment surface with wine border; reads as ‘stationery’.",
          "className": "bg-[hsl(var(--ritual-parchment))] text-foreground border border-[hsl(var(--border))] hover:border-[hsl(var(--ritual-wine))] hover:bg-[hsl(var(--ritual-parchment))]/80"
        },
        "ghost": {
          "description": "Text-only, for ‘Not now’ actions.",
          "className": "bg-transparent text-foreground/80 hover:text-foreground hover:bg-foreground/5"
        }
      },
      "sizes": {
        "md": "h-11 px-5",
        "lg": "h-12 px-6 text-[15px]"
      },
      "micro_interactions": [
        "Use transition-colors + shadow transitions only (never transition: all).",
        "Press: active:translate-y-[1px] active:shadow-none",
        "Hover: subtle lift on primary only: hover:-translate-y-[1px] (apply transition-transform on that element specifically)."
      ]
    },

    "cards": {
      "context_card": {
        "pattern": "Large tappable Card with a single emotion-led title, 1–2 line description, and a small ‘seal’ indicator.",
        "className": "relative overflow-hidden rounded-xl bg-card paper-noise shadow-[0_12px_30px_rgba(58,13,30,0.08)] border border-[hsl(var(--border))]"
      }
    },

    "forms_as_ritual": {
      "principles": [
        "Prompt each input with a short poetic question + a one-line ‘why we ask’ helper.",
        "Use Textarea for most prompts; keep Input only for short fields.",
        "Autosave in localStorage between steps; show ‘Saved to this device’ (no accounts).",
        "Tone selector uses RadioGroup with 5 options: ‘Tender’, ‘Honest’, ‘Longing’, ‘Grateful’, ‘Closure’."
      ],
      "field_styles": {
        "textarea": "min-h-[120px] bg-[hsl(var(--ritual-parchment))] shadow-[inset_0_0_0_1px_rgba(58,13,30,0.10)] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ritual-candle))]",
        "label": "font-[var(--font-ui)] text-sm text-foreground/80",
        "helper": "text-xs text-foreground/60 leading-relaxed"
      }
    }
  },

  "motion_and_microinteractions": {
    "library": {
      "recommend": "framer-motion",
      "install": "npm i framer-motion",
      "usage_notes": [
        "Use for step transitions, envelope opening, timed reveal shimmer, and unsent fade.",
        "Respect prefers-reduced-motion (reduce durations, remove parallax)."
      ]
    },
    "principles": {
      "tempo": "Slow by default. 260–420ms for most transitions. 700–1200ms for ritual moments (envelope open, sealing).",
      "easing": "Use easeOut for entrances; easeInOut for state changes."
    },
    "patterns": {
      "step_transition": {
        "enter": "opacity: 0 -> 1, y: 8 -> 0",
        "exit": "opacity: 1 -> 0, y: 0 -> -8",
        "duration_ms": 320
      },
      "hover_glow": {
        "target": "Primary CTA + selected cards",
        "css": "hover:shadow-[0_0_0_1px_rgba(215,168,91,0.40),0_14px_36px_rgba(58,13,30,0.18)]"
      }
    }
  },

  "letter_experiences": {
    "shared": {
      "letter_surface": {
        "className": "relative paper-noise bg-[hsl(var(--ritual-parchment))] rounded-2xl shadow-[inset_0_0_0_1px_rgba(58,13,30,0.08),0_18px_46px_rgba(58,13,30,0.10)]",
        "inner": "p-6 sm:p-10",
        "top_rule": "Add a subtle top border like stationery: border-t border-[rgba(58,13,30,0.10)]"
      },
      "letter_typography": "font-[var(--font-letter)] text-[17px] sm:text-[18px] leading-[1.95] tracking-[0.01em] text-[hsl(var(--ritual-ink))]",
      "paragraph_spacing": "space-y-5",
      "selection_color": "::selection { background: rgba(231,185,195,0.65); }"
    },

    "sealed_envelope": {
      "interaction": "User taps a wax seal to open. Flap rotates up, letter slides out, then expands into full parchment.",
      "implementation_notes": [
        "Build EnvelopeSealed.jsx with layered divs + pseudo-elements; use perspective and rotateX for flap.",
        "Keep animation under 1200ms and allow skip via ‘Open instantly’ text button."
      ],
      "data_testids": {
        "open_button": "sealed-letter-open-button",
        "skip_button": "sealed-letter-skip-animation-button"
      }
    },

    "timed_reveal": {
      "interaction": "Shows a locked letter with a candle-warm countdown. When time hits, unlock animation reveals parchment.",
      "use_shadcn": ["Calendar", "Dialog", "Button"],
      "notes": [
        "Allow ‘Add reminder’ via Calendar in a Dialog (not a native HTML calendar).",
        "Show timezone clearly in helper text."
      ],
      "data_testids": {
        "countdown": "timed-reveal-countdown",
        "unlock_state": "timed-reveal-unlocked-state"
      }
    },

    "unsent_fade": {
      "interaction": "User reads; on ‘Close’ or after a timer, letter gently fades and blurs into a closure message.",
      "notes": [
        "Use a progress indicator (subtle) to signal ‘This will fade’ without feeling threatening.",
        "Closure message uses muted ink color and more whitespace."
      ],
      "data_testids": {
        "reader": "unsent-letter-reader",
        "closure": "unsent-letter-closure-message"
      }
    }
  },

  "loading_and_ritual_states": {
    "generation_screen": {
      "copy_sequence": [
        "Warming the ink…",
        "Folding the page…",
        "Sealing what’s true…",
        "Placing it somewhere safe…"
      ],
      "visuals": [
        "Use shadcn Progress with a soft candle glow",
        "Use Skeleton blocks that resemble lines of writing",
        "Add a subtle animated grain overlay (opacity <= 0.06)"
      ],
      "data_testids": {
        "progress": "generation-progress",
        "status": "generation-status-text"
      }
    }
  },

  "music": {
    "behavior": {
      "default": "off",
      "control": "A small floating toggle in top-right on Landing + throughout flow (non-intrusive).",
      "copy": "Music"
    },
    "implementation": {
      "component": "MusicToggle.jsx",
      "use_shadcn": ["Switch", "Tooltip"],
      "notes": [
        "Preload audio only after user interaction (browser autoplay rules).",
        "Volume low; add fade-in/out (300–500ms) when toggled."
      ]
    },
    "data_testids": {
      "toggle": "music-toggle-switch"
    }
  },

  "urgency_banner": {
    "style": {
      "placement": "Sticky at top on landing only; collapses into a subtle badge on scroll.",
      "copy_examples": [
        "Valentine’s Edition — available this week",
        "A letter, made slowly — before the day passes"
      ],
      "className": "bg-[hsl(var(--ritual-wine))] text-[hsl(var(--primary-foreground))]"
    },
    "data_testids": {
      "banner": "valentine-urgency-banner"
    }
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast: ink on parchment must be readable; avoid low-contrast blush text.",
      "Focus states: always visible; ring uses candle color.",
      "prefers-reduced-motion: disable envelope 3D and long fades; provide instant open.",
      "Touch targets: min 44px; cards fully tappable."
    ]
  },

  "testing_attributes": {
    "rule": "All interactive and key informational elements MUST include data-testid in kebab-case.",
    "minimum_testids": [
      "landing-begin-ritual-button",
      "context-option-card-<id>",
      "inputs-next-button",
      "delivery-option-card-<id>",
      "payment-pay-button",
      "generation-progress",
      "letter-copy-link-button",
      "letter-open-button"
    ]
  },

  "image_urls": {
    "paper_textures": [
      {
        "url": "https://images.unsplash.com/photo-1709467585708-464df45fad00?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "usage": "Primary subtle paper grain overlay (apply with low opacity 0.06–0.10)."
      },
      {
        "url": "https://images.unsplash.com/photo-1712677731884-4d1e59134089?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "usage": "Secondary texture for section dividers / variation backgrounds (even lower opacity)."
      }
    ],
    "warm_light": [
      {
        "url": "https://images.unsplash.com/photo-1542317049-c1998da755f1?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85",
        "usage": "Very subtle blurred hero background layer (opacity ~0.12, blur-xl)."
      }
    ],
    "fallbacks": {
      "note": "If external images are blocked, replace with CSS noise and solid parchment backgrounds."
    }
  },

  "instructions_to_main_agent": [
    "Update /frontend/src/App.css to remove default CRA centered dark header styles; avoid setting .App { text-align:center }.",
    "Update /frontend/src/index.css :root tokens to the ritual palette; keep background parchment by default.",
    "Add Google Fonts import in index.html (or via CSS @import) for Fraunces, EB Garamond, Figtree; apply via CSS variables.",
    "Use shadcn components from /frontend/src/components/ui (no raw HTML dropdown/calendar/toast).",
    "Payment screen is MOCKED for now (explicitly label in code comments + UI microcopy like ‘Secure checkout’ without implying actual charge).",
    "Implement three letter views with framer-motion. Provide skip/instant-open controls for reduced motion.",
    "Every button/input/card option must include data-testid (kebab-case) per rules.",
    "No AI mentions in UI copy, routes, headings, or empty states."
  ],

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}

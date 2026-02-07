# Kotodama Extension UI/UX Rework (v2)

**Status:** Draft
**Date:** 2026-01-29

## 1. Design Philosophy

The new UI will move away from the "utility tool" look to a "premium, native-feeling assistant". It should feel like a natural extension of the Twitter/X interface but with a distinct, high-end "glassmorphism" aesthetic.

**Key visual pillars:**
- **Glassmorphism:** Heavy use of `backdrop-filter: blur()`, semi-transparent backgrounds, and subtle white borders.
- **Fluidity:** Spring-based animations (using `framer-motion`) for opening, closing, and resizing.
- **Minimalism:** Hide complexity until needed.
- **Dark Mode First:** Designed primarily for dark mode (matching common "crypto/tech" Twitter aesthetics) but fully supporting light mode.

## 2. User Experience Flow

### 2.1. The Entry Point (The "Orb")
Instead of a standard square button, we'll use a floating "Orb" or "Pill".
- **Idle State:** A small, pulsing glow or icon in the bottom-right or near the compose box.
- **Hover State:** Expands slightly to show "Ask Kotodama".
- **Context Awareness:** If the user text cursor is in a reply box, the Orb automatically drifts near the active focus area.

### 2.2. The Main Panel (The "Command Center")
When activated, the panel opens with a "pop" animation.

**Structure:**
1.  **Header (Sticky):**
    -   **Context Indicator:** "Replying to @username" (with avatar).
    -   **Model Toggle:** Switch between "Fast" (GPT-3.5/4o-mini) and "Smart" (GPT-4o/Claude).
    -   **Settings:** Gear icon for deeper config.

2.  **Input Area (Center Stage):**
    -   Large, auto-expanding textarea.
    -   Placeholder changes based on context (e.g., "Draft a reply...", "Write a thread about...").

3.  **Controls (The "Cockpit"):**
    -   **Brand Voice:** Horizontal scroll of pills (e.g., "Professional", "Shitpost", "Helpful"). Active one highlighted with a neon glow.
    -   **Length:** Simple slider: Short --- Medium --- Long.
    -   **Advanced:** Toggle for "Thread Mode".

4.  **Action Bar:**
    -   **Primary Button:** "Generate" (Gradient background, glowing shadow).

### 2.3. The Results View
After generation, the Input Area slides up, revealing the Results.
-   **Carousel:** Displays 2-3 variations instead of just one.
-   **Actions per card:** "Insert", "Copy", "Regenerate This".
-   **Global Actions:** "Try Again (New settings)".

## 3. Component Architecture

We will restart the `src/panel` components to follow this structure:

```
src/panel/
├── components/
│   ├── Layout/
│   │   ├── GlassContainer.tsx    # Base glassmorphism wrapper
│   │   ├── PanelHeader.tsx     # Context & Settings
│   │   └── TabBar.tsx              # For potential multiple tabs
│   ├── Input/
│   │   ├── AutoTextarea.tsx      # Growing input
│   │   ├── VoiceSelector.tsx     # Pill list
│   │   └── LengthSlider.tsx      # visual slider
│   ├── Output/
│   │   ├── ResultCard.tsx        # Single generation option
│   │   └── ResultCarousel.tsx    # Swipable view
│   └── Shared/
│       ├── Button.tsx            # Premium styled buttons
│       └── Tooltip.tsx
├── hooks/
│   └── useAnimation.ts           # Shared spring configs
├── pages/
│   └── Home.tsx                  # Main view
├── styles/
│   └── theme.css                 # CSS Variables for glass effects
└── App.tsx
```

## 4. Technical Requirements

-   **Tailwind CSS:** Use `v3` or `v4` with custom config for `backdrop-blur`, gradients, and animations.
-   **Framer Motion:** For all UI transitions (entry, exit, layout changes).
-   **Lucide React:** For consistent, clean icons.
-   **Radix UI:** For accessible primitives (Dialogs, Tooltips, Sliders) if needed, otherwise custom lightweight versions.

## 5. Implementation Phases

1.  **Setup:** Install dependencies (`framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`).
2.  **Base Components:** Build the `GlassContainer`, `Button`, and `Input` systems.
3.  **Main Layout:** Reconstruct `App.tsx` and main views.
4.  **Logic Integration:** Re-hook existing `content-script` messaging and API calls.
5.  **Polish:** Add micro-interactions (hover states, click ripples).

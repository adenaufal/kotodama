# Kotodama Extension UI/UX Theme Guide

## Design Philosophy
**"静寂の中の力"** (Seijaku no naka no chikara) - *Power within stillness*

The interface should embody:
- **Ma (間)**: Thoughtful use of negative space - not cluttered
- **Shibui (渋い)**: Subtle elegance, understated beauty
- **Iki (粋)**: Sophisticated simplicity with a modern edge

---

## Color System

### Primary Palette
```
Deep Indigo (Main):    #2D3250 - Primary UI elements, text
Sakura Pink (Accent):  #E85C8F - CTAs, highlights, active states
Gold Amber (Spirit):   #F4A261 - Success states, magical moments
```

### Neutral Palette
```
Background Dark:   #1A1D2E - Panel background
Background Light:  #F8F9FC - Light mode alternative
Surface:           #363B52 - Cards, elevated surfaces
Border:            #424863 - Subtle dividers
Text Primary:      #E8E9F0 - Main text
Text Secondary:    #9BA0B5 - Helper text, labels
```

### Semantic Colors
```
Success:   #4CAF50
Warning:   #FF9800
Error:     #F44336
Info:      #2196F3
```

---

## Typography

### Font Family
```css
Primary: 'Inter', 'Noto Sans JP', -apple-system, sans-serif
Monospace: 'JetBrains Mono', 'Consolas', monospace (for code/API keys)
```

### Type Scale
```css
Heading Large:  24px / 600 weight / -0.02em tracking
Heading Medium: 18px / 600 weight / -0.01em tracking
Body:           14px / 400 weight / normal tracking
Body Small:     12px / 400 weight / normal tracking
Caption:        11px / 400 weight / 0.01em tracking
Label:          13px / 500 weight / 0.02em tracking (uppercase)
```

---

## Layout & Spacing

### Spacing Scale (8px base)
```
xs:  4px
sm:  8px
md:  16px
lg:  24px
xl:  32px
2xl: 48px
```

### Panel Dimensions
```
Width: 380px (comfortable for reading/editing)
Max Height: 600px (scrollable content area)
Border Radius: 12px (panel), 8px (cards), 6px (buttons)
```

---

## Component Designs

### 1. Floating Button (Trigger)
```
Appearance:
- Circle: 48px diameter
- Background: Deep Indigo (#2D3250) with subtle shadow
- Icon: White sparkle, 24px
- Hover: Lift slightly (2px), add sakura pink glow
- Position: Fixed, bottom-right of compose box area
- Shadow: 0 4px 12px rgba(45, 50, 80, 0.3)

States:
- Idle: Gentle pulse animation (1.5s)
- Active: Sakura pink border glow
- Processing: Rotating sparkle animation
```

### 2. Side Panel Structure
```
┌─────────────────────────────────┐
│  HEADER                         │ 56px height
├─────────────────────────────────┤
│                                 │
│  CONTENT AREA                   │ Scrollable
│  (Contextual based on mode)     │
│                                 │
├─────────────────────────────────┤
│  ACTION BAR                     │ 72px height
└─────────────────────────────────┘
```

### 3. Header Design
```
Elements:
- Kotodama logo (32px) + wordmark
- Mode indicator badge ("Compose" / "Reply")
- Settings gear icon (right)
- Close icon (right)

Background: #1A1D2E
Border bottom: 1px solid #424863
Padding: 16px
```

### 4. Content Area - Compose Mode

**A. Brand Voice Section** (Collapsible)
```
Card style:
- Background: #363B52
- Padding: 16px
- Border radius: 8px
- Margin bottom: 16px

Contents:
┌─────────────────────────────┐
│ 🎭 Brand Voice              │ Label + icon
│ ───────────────────────     │ Divider
│ ☑ Use saved brand voice     │ Checkbox
│ "Tech Professional"          │ Current selection (if any)
│                             │
│ [Quick adjust tone: ▼]      │ Dropdown
│  • More casual              │
│  • More formal              │
│  • Add humor                │
└─────────────────────────────┘
```

**B. Prompt Input**
```
Large textarea:
- Background: #1A1D2E
- Border: 1px solid #424863
- Focus: Sakura pink border
- Padding: 16px
- Border radius: 8px
- Placeholder: "What do you want to tweet about? ✨"
- Min height: 120px
- Font: 14px Inter

Character hint (bottom right):
- "~280 chars recommended"
- Color: #9BA0B5
```

**C. Thread Options** (When enabled)
```
Toggle switch:
☐ Generate as thread

When enabled, show:
┌─────────────────────────────┐
│ Thread length: [3 ▼] tweets │ Dropdown: 2-10
│ ☑ Add numbering (1/3)       │ Checkbox
└─────────────────────────────┘
```

### 5. Content Area - Reply Mode

**A. Target Analysis Card**
```
Card with user info:
┌─────────────────────────────────┐
│ 👤 @username                    │
│ ─────────────────────           │
│ Analyzing recent tweets...      │ Loading state
│ ▓▓▓▓▓▓▓░░░ 70%                  │ Progress bar
│                                 │
│ OR after analysis:              │
│                                 │
│ Personality: Casual, humorous   │
│ Topics: Tech, startups, AI      │
│ Tone: Friendly, engaging        │
│                                 │
│ [Use saved profile ▼]           │ If profile exists
└─────────────────────────────────┘

Colors:
- Progress bar: Sakura pink fill
- Background: #363B52
```

**B. Context Preview**
```
Show tweet being replied to:
┌─────────────────────────────────┐
│ "Original tweet text here..."   │
│                                 │
│ 🔄 12  ❤️ 45  👁️ 1.2K          │ Engagement metrics
└─────────────────────────────────┘

Style:
- Background: #1A1D2E
- Border left: 3px solid #E85C8F
- Padding: 12px
- Font size: 13px
- Italicized text
```

### 6. Generated Output Area
```
After generation:

┌─────────────────────────────────┐
│ ✨ Generated Tweet               │ Header
│ ───────────────────────         │
│                                 │
│ [Generated tweet text here      │ Editable textarea
│  with proper formatting and     │
│  line breaks preserved...]      │
│                                 │
│ 245 / 280 characters            │ Character count
│                                 │
│ ┌─────────────┐ ┌────────────┐ │ Action buttons
│ │ 🔄 Regenerate│ │ ✏️ Refine  │ │
│ └─────────────┘ └────────────┘ │
└─────────────────────────────────┘

Colors:
- Background: #363B52
- Character count: 
  * Green when <250
  * Amber when 250-280
  * Red when >280
```

**Refine Options** (Dropdown from Refine button)
```
• Make more casual
• Make more formal  
• Add humor
• Shorten it
• Make it longer
• Add emojis
• Remove emojis
```

### 7. Action Bar (Bottom)
```
Fixed at bottom:
┌─────────────────────────────────┐
│                                 │
│  [Cancel]    [Insert to X →]   │
│   Ghost      Primary CTA        │
└─────────────────────────────────┘

Primary Button:
- Background: Sakura pink (#E85C8F)
- Text: White
- Padding: 12px 24px
- Border radius: 6px
- Hover: Lighten 10%
- Disabled: #424863, cursor not-allowed

Cancel Button:
- Background: Transparent
- Text: #9BA0B5
- Border: 1px solid #424863
- Hover: Border color to #E85C8F
```

---

## Animations & Transitions

### Micro-interactions
```css
/* Panel slide-in */
.panel-enter {
  animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Button hover lift */
button:hover {
  transform: translateY(-1px);
  transition: transform 0.2s ease;
}

/* Sparkle pulse (floating button) */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Loading shimmer */
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

/* Success ripple */
@keyframes ripple {
  to {
    transform: scale(1.5);
    opacity: 0;
  }
}
```

### Loading States
```
Skeleton screens with shimmer effect:
- Background: linear-gradient(90deg, #363B52 0%, #424863 50%, #363B52 100%)
- Animation: shimmer 2s infinite
```

---

## Special States

### 1. First-Time Setup
```
Empty state card:
┌─────────────────────────────────┐
│         ✨                      │
│   Welcome to Kotodama!          │
│                                 │
│   Let's set up your brand voice │
│   to get started.               │
│                                 │
│   [Set up now →]                │
└─────────────────────────────────┘

Center-aligned, gentle fade-in animation
```

### 2. API Key Missing
```
Warning banner at top:
┌─────────────────────────────────┐
│ ⚠️ API key not configured        │
│ [Go to settings →]              │
└─────────────────────────────────┘

Background: rgba(255, 152, 0, 0.1)
Border: 1px solid #FF9800
```

### 3. Generation Success
```
Brief toast notification:
┌─────────────────────┐
│ ✨ Tweet generated! │
└─────────────────────┘

Position: Top center
Duration: 2s
Background: #4CAF50
Slide down + fade out
```

### 4. Error State
```
In-panel error message:
┌─────────────────────────────────┐
│ ❌ Generation failed            │
│                                 │
│ Error: API rate limit exceeded  │
│                                 │
│ [Try again]  [Check settings]   │
└─────────────────────────────────┘

Background: rgba(244, 67, 54, 0.1)
Border: 1px solid #F44336
```

---

## Settings Page Design

```
Full-page overlay with tabs:

┌─────────────────────────────────┐
│ ⚙️ Kotodama Settings            │ Header
├─────────────────────────────────┤
│ [API] [Brand Voice] [Advanced]  │ Tabs
├─────────────────────────────────┤
│                                 │
│ API CONFIGURATION               │ Section
│ ─────────────────               │
│                                 │
│ AI Provider: [OpenAI ▼]         │
│                                 │
│ API Key:                        │
│ [••••••••••••••••••]  [Show]   │
│                                 │
│ ☑ Save API key locally          │
│                                 │
│ ─────────────────               │
│                                 │
│ BRAND VOICE                     │
│ ─────────────────               │
│                                 │
│ Profile name:                   │
│ [Tech Professional       ]      │
│                                 │
│ Description:                    │
│ [Large textarea...       ]      │
│                                 │
│ Example tweets:                 │
│ [+ Add example tweet]           │
│                                 │
│ ─────────────────               │
│                                 │
│          [Cancel]  [Save]       │
└─────────────────────────────────┘
```

---

## Dark/Light Mode

**Default: Dark mode** (matches Twitter/X dark theme)

Light mode adjustments:
```
Background:    #FFFFFF → #F8F9FC
Surface:       #363B52 → #FFFFFF
Text Primary:  #E8E9F0 → #1A1D2E
Border:        #424863 → #E0E3EB
```

---

## Responsive Behavior

### Panel width adjustments:
```
< 1440px viewport: 360px panel width
< 1280px viewport: 340px panel width
Mobile: Full-screen modal instead of side panel
```

---

## Accessibility

```css
/* Focus states */
*:focus-visible {
  outline: 2px solid #E85C8F;
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  /* Increase border widths and contrast ratios */
}
```

### ARIA labels:
- All interactive elements have proper labels
- Loading states announce to screen readers
- Error messages are announced
- Success confirmations are announced

---

## Design Tokens Summary

```javascript
// For developers to implement
const tokens = {
  colors: {
    primary: '#2D3250',
    accent: '#E85C8F',
    spirit: '#F4A261',
    bgDark: '#1A1D2E',
    surface: '#363B52',
    border: '#424863',
    textPrimary: '#E8E9F0',
    textSecondary: '#9BA0B5',
  },
  
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  
  typography: {
    fontFamily: 'Inter, Noto Sans JP, -apple-system, sans-serif',
    sizes: {
      h1: '24px',
      h2: '18px',
      body: '14px',
      small: '12px',
      caption: '11px',
    },
  },
  
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  
  shadows: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 12px rgba(45, 50, 80, 0.3)',
    lg: '0 8px 24px rgba(45, 50, 80, 0.4)',
  },
};
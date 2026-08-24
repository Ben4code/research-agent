# Calcite Design System Style Guide

This style guide defines the visual identity and color tokens for the **Calcite** design system based on the extracted color palette. It contains exact color values, Tailwind CSS and CSS custom properties integration snippets, accessibility guidelines, and design best practices.

---

## 🎨 Color Palette Overview

| Swatch | Color Name | HEX | RGB | HSL | OKLCH |
| :--- | :--- | :--- | :--- | :--- | :--- |
| <span style="display:inline-block;width:32px;height:32px;border-radius:6px;background-color:#DDDCDB;border:1px solid #c8c7c6;"></span> | **Calcite Light** (Light Neutral) | `#DDDCDB` | `rgb(221, 220, 219)` | `hsl(40, 5%, 86%)` | `oklch(87.32% 0.005 273.78)` |
| <span style="display:inline-block;width:32px;height:32px;border-radius:6px;background-color:#FD7B41;"></span> | **Calcite Orange** (Primary Accent / Brand) | `#FD7B41` | `rgb(253, 123, 65)` | `hsl(17, 98%, 62%)` | `oklch(71.93% 0.198 42.15)` |
| <span style="display:inline-block;width:32px;height:32px;border-radius:6px;background-color:#EDBF9B;"></span> | **Calcite Peach** (Secondary Soft Accent) | `#EDBF9B` | `rgb(237, 191, 155)` | `hsl(26, 68%, 77%)` | `oklch(80.59% 0.093 62.48)` |
| <span style="display:inline-block;width:32px;height:32px;border-radius:6px;background-color:#3C4044;"></span> | **Calcite Charcoal** (Dark Neutral) | `#3C4044` | `rgb(60, 64, 68)` | `hsl(210, 6%, 25%)` | `oklch(28.79% 0.012 254.5)` |

---

## ⚙️ Code Integration Guidelines

### 1. Tailwind CSS v4.0 `@theme` Inline Rules
Since this project uses Tailwind CSS v4.0 in [`globals.css`](file:///Users/nnaemekaobioha/Desktop/app_ideas/research/research-agent/apps/web/src/app/globals.css), add these configurations under the `@theme` directive:

```css
@theme inline {
  /* Add Calcite Theme Colors */
  --color-calcite-light: #dddcdb;
  --color-calcite-orange: #fd7b41;
  --color-calcite-peach: #edbf9b;
  --color-calcite-charcoal: #3c4044;
  
  /* You can also map them to standard utility tokens */
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-brand-soft: var(--brand-soft);
}
```

### 2. Custom CSS Properties (`:root` / `.dark`)
You can map these colors in OKLCH coordinates (standard for Tailwind v4 and modern CSS setups) to drive `shadcn/ui` states:

```css
:root {
  /* Core Calcite Colors in OKLCH */
  --calcite-light: oklch(87.32% 0.005 273.78);
  --calcite-orange: oklch(71.93% 0.198 42.15);
  --calcite-peach: oklch(80.59% 0.093 62.48);
  --calcite-charcoal: oklch(28.79% 0.012 254.5);

  /* Mapping to Functional Variables (Light Mode) */
  --background: oklch(1 0 0);               /* White background */
  --foreground: var(--calcite-charcoal);    /* Charcoal body text */
  --card: oklch(0.98 0.002 270);            /* Soft clean white/gray */
  --card-foreground: var(--calcite-charcoal);
  --popover: oklch(1 0 0);
  --popover-foreground: var(--calcite-charcoal);
  
  --primary: var(--calcite-orange);         /* Orange primary brand color */
  --primary-foreground: oklch(1 0 0);       /* White text on primary button */
  
  --secondary: var(--calcite-peach);        /* Peach secondary background */
  --secondary-foreground: var(--calcite-charcoal);
  
  --muted: var(--calcite-light);            /* Light grey for muted panels */
  --muted-foreground: oklch(0.45 0.01 250);
  
  --border: var(--calcite-light);           /* Soft borders */
  --input: var(--calcite-light);
  --ring: var(--calcite-orange);
}

.dark {
  /* Mapping to Functional Variables (Dark Mode) */
  --background: var(--calcite-charcoal);    /* Dark charcoal background */
  --foreground: var(--calcite-light);       /* Soft white text */
  --card: oklch(0.24 0.01 254);             /* Slightly lighter charcoal for cards */
  --card-foreground: var(--calcite-light);
  
  --primary: var(--calcite-orange);
  --primary-foreground: var(--calcite-charcoal); /* Charcoal text on Orange buttons */
  
  --secondary: oklch(0.34 0.015 254);
  --secondary-foreground: var(--calcite-light);
  
  --muted: oklch(0.22 0.01 254);
  --muted-foreground: var(--calcite-light);
  
  --border: oklch(0.35 0.01 254 / 50%);
  --input: oklch(0.35 0.01 254 / 50%);
  --ring: var(--calcite-orange);
}
```

### 3. Legacy Tailwind CSS v3 (JavaScript Configuration)
If configuring an app using standard Javascript configs:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        calcite: {
          light: '#DDDCDB',
          orange: '#FD7B41',
          peach: '#EDBF9B',
          charcoal: '#3C4044',
        }
      }
    }
  }
}
```

---

## ♿ Accessibility & Contrast Matrix
Ensuring readability is key. The table below lists the WCAG 2.1 contrast ratios for common color pairings, along with design recommendations:

| Text Color | Background Color | Contrast Ratio | WCAG Compliance | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Charcoal** (`#3C4044`) | **Light Gray** (`#DDDCDB`) | **7.63:1** | AAA (Passes all text) | **Excellent**. Use for main content, sidebars, and forms. |
| **Charcoal** (`#3C4044`) | **Peach** (`#EDBF9B`) | **6.24:1** | AA (Passes all text) | **Good**. Use for highlighting text cards, badges, and alerts. |
| **Charcoal** (`#3C4044`) | **Orange** (`#FD7B41`) | **4.02:1** | AA Large (Large text only) | **Caution**. Only use for large headings ($\ge$ 18pt bold) or icons. |
| **White** (`#FFFFFF`) | **Charcoal** (`#3C4044`) | **10.45:1** | AAA (Passes all text) | **Excellent**. Standard dark-mode body text or high-contrast buttons. |
| **White** (`#FFFFFF`) | **Orange** (`#FD7B41`) | **2.60:1** | Fail | **Avoid**. Do not place white text directly on the brand orange. |
| **Black** (`#000000`) | **Orange** (`#FD7B41`) | **8.09:1** | AAA (Passes all text) | **Excellent**. Use black text (or very dark charcoal) on orange backgrounds. |

---

## 🛠️ Color Token Roles & Usage Guidelines

### 🌅 Primary Accent: Calcite Orange (`#FD7B41`)
The vibrant center of the palette.
- **Roles**: High-priority interactive elements, brand presence.
- **Use Cases**:
  - Primary action buttons (`bg-calcite-orange text-calcite-charcoal` or `text-black`).
  - Active navigation state links/borders.
  - Accent stripes, progress indicators, or focus rings.
- **Pro-Tip**: Since white-on-orange text fails contrast, style your primary buttons with a dark text label (`text-calcite-charcoal` or `#000000`) instead of white.

### 🍑 Secondary Accent: Calcite Peach (`#EDBF9B`)
A warm, soft tone that bridges the primary orange and light neutrals.
- **Roles**: Secondary status, visual framing, card backgrounds.
- **Use Cases**:
  - Soft card overlays or containers.
  - Hover states on light components.
  - Secondary badges or active tag filters.
  - Secondary buttons when paired with dark text (`text-calcite-charcoal`).

### 🌑 Dark Neutral: Calcite Charcoal (`#3C4044`)
The primary structural anchor of the design.
- **Roles**: Typography, dark-mode canvas, high-emphasis borders.
- **Use Cases**:
  - Main body text in light mode.
  - Dark-mode background canvas.
  - Headers, icons, and primary UI controls.
  - High-definition borders/dividers.

### 🌫️ Light Neutral: Calcite Light (`#DDDCDB`)
The backing sheet of the design system.
- **Roles**: Canvas backing, subtle borders, muted areas.
- **Use Cases**:
  - Light-mode background canvas.
  - Disabled input fields or button states.
  - Sub-dividers or thin horizontal rules (`border-calcite-light`).
  - Muted secondary text in dark-mode context.

---

## 🎨 Design Examples

### Buttons
```html
<!-- Primary Button -->
<button class="bg-[#FD7B41] text-[#3C4044] font-semibold px-4 py-2 rounded-md hover:opacity-90 transition">
  Submit Research
</button>

<!-- Secondary Button -->
<button class="bg-[#EDBF9B] text-[#3C4044] font-medium px-4 py-2 rounded-md hover:brightness-95 transition">
  Save Draft
</button>

<!-- Outline Button -->
<button class="border border-[#3C4044] text-[#3C4044] px-4 py-2 rounded-md hover:bg-[#DDDCDB] transition">
  Cancel Action
</button>
```

### Cards
```html
<!-- Light Mode Highlight Card -->
<div class="bg-[#DDDCDB] border-l-4 border-[#FD7B41] p-4 rounded-r-md">
  <h4 class="text-[#3C4044] font-bold">Research Progress</h4>
  <p class="text-[#3C4044]/90 text-sm">We are executing workflows to assemble your report...</p>
</div>
```

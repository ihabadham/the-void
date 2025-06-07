### **The Void: Branding & UI Design Guide**

**1. Core Identity & Philosophy**

- **Product Name:** The Void
- **Tagline:** `/dev/null > applications`
- **Core Principles:**
  - **Stark Clarity:** The interface must be ruthlessly efficient, displaying only what is necessary. No fluff, no corporate cheerfulness.
  - **Serious Utility:** While the branding is sarcastic, the tool itself is a serious, high-performance instrument for managing the chaos of the job hunt.
  - **Embrace the Grind:** The design acknowledges the absurd, high-volume nature of modern job applications. It is a companion in the digital abyss, not a motivational coach.

**2. Color Palette (Terminal Dark Theme)**

The aesthetic is inspired by a classic terminal interface, emphasizing a pure black background with a vibrant, digital accent.

- **Background Primary (The Void):** `pure-black` - The literal void.
  - `#000000`
- **Background Secondary (Containers/Cards):** `off-black` - A subtle lift to create depth against the pure black.
  - `#1A1A1A`
- **Accent Primary:** `terminal-green` - A vibrant green for primary actions, active states, and highlighting success.
  - `#00F57A`
- **Text Primary:** `light-gray` - For all body copy. Avoids the harshness of pure white on a black background.
  - `#CCCCCC`
- **Text Secondary:** `medium-gray` - For metadata, inactive labels, and placeholder text.
  - `#777777`
- **Borders & Dividers:** `dark-gray` - Barely-visible lines to structure the void.
  - `#333333`
- **Functional Colors:**
  - **Success/Offer:** `terminal-green` - `#00F57A`
  - **Warning/Pending:** `amber` - `#FFBF00`
  - **Error/Rejected:** `desaturated-red` - `#C23B22`
  - **Info/Interview:** `electric-cyan` - `#00D8FF`

**3. Typography**

A dual-font system balances readability with a distinct terminal aesthetic.

- **Header Font Family:** `Fira Code` (or another monospaced font like `JetBrains Mono`). Used for all headings (H1, H2, H3) and key data points to reinforce the technical theme.
- **Body Font Family:** `Inter`. A clean, highly readable sans-serif for all paragraph text, descriptions, and longer form content.
- **Font Hierarchy:**
  - **H1 (Page Title):** 32px, Medium (500), `Fira Code`
  - **H2 (Section Title):** 24px, Medium (500), `Fira Code`
  - **H3 (Card Title):** 20px, Medium (500), `Fira Code`
  - **Body Text:** 16px, Regular (400), `Inter`
  - **Labels & Metadata:** 14px, Regular (400), `Inter`, `Text Secondary` color.
  - **Button Text:** 16px, Medium (500), `Inter`

**4. Layout & Spacing**

- **Base Unit:** `8px`. All spacing and sizing are multiples of this.
- **Grid System:** A standard 12-column grid.
- **Padding:** `16px` or `24px` for containers.
- **Gaps:** `16px` between major UI elements.
- **Corner Radius (Border Radius):** `4px`. A sharp, modern radius. Avoid large, soft curves.

**5. Iconography**

- **Style:** Minimalist, sharp, **outline** icons.
- **Recommended Library:** `Phosphor Icons`.
- **Size:** `20px` or `24px`.
- **Color:** `Text Secondary` by default, changing to `Text Primary` or an accent color on hover/active states.

**6. Component Design System (AI Directives)**

- **Buttons:**
  - **Primary:** Solid `terminal-green` background, `pure-black` text for high contrast.
  - **Secondary:** `dark-gray` outline, `light-gray` text. On hover, background becomes `off-black`.
  - **States:** Define clear `hover`, `active`, and `disabled` (50% opacity) states.
- **Cards (for Applications):**
  - **Background:** `Background Secondary` (`#1A1A1A`).
  - **Border:** 1px solid `Borders & Dividers` (`#333333`).
  - **Shadow:** None. The contrast between `#000000` and `#1A1A1A` is sufficient.
- **Tags/Badges (for Status):**
  - Use the **Functional Colors** for the background.
  - Text should be `pure-black` for readability.
  - Pill-shaped with a `12px` border-radius.
- **Input Fields & Forms:**
  - **Background:** `pure-black`.
  - **Border:** 1px solid `Borders & Dividers`.
  - **On Focus:** Border color changes to `terminal-green`. A blinking block cursor (`|`) should appear.
  - **Labels:** Use `Labels & Metadata` style, placed above the input field.

**7. Tone & Voice (Microcopy)**

- **Voice:** Dry, sarcastic, technical, and direct.
- **Examples:**
  - **Empty State:** "The Void is empty. Cast an application into the abyss to begin."
  - **Success Message:** "Application successfully piped to /dev/null." or "Record committed."
  - **Confirmation Prompt:** "Are you sure you want to delete this? It will be lost to the void, forever."
  - **Button Text:** "Log Application," "Update Status," "Link CV." (The actions are direct, the context is sarcastic).

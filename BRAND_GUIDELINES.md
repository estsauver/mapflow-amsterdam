# Brand Guidelines

*Inspired by W.E.B. Du Bois's 1900 Paris Exposition Data Visualizations*

---

## Overview

This design system draws inspiration from the pioneering data visualizations created by W.E.B. Du Bois and his team at Atlanta University for the 1900 Paris Exposition. These hand-drawn infographics combined bold geometric forms, a distinctive color palette, and clarity of communication that was decades ahead of its time.

The aesthetic also references U.S. government publications and the U.S. Graphics Company style—clean, authoritative, and timeless.

---

## Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Carmine** | `#C41E3A` | rgb(196, 30, 58) | Primary accent, call-to-action, emphasis |
| **Gold** | `#DAA520` | rgb(218, 165, 32) | Secondary accent, highlights, data viz |
| **Prussian Blue** | `#1E3A5F` | rgb(30, 58, 95) | Tertiary accent, water, depth |
| **Emerald** | `#2E8B57` | rgb(46, 139, 87) | Success states, growth, nature |

### Neutral Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Ink Black** | `#1A1A1A` | rgb(26, 26, 26) | Primary text, strong borders |
| **Charcoal** | `#4A4A4A` | rgb(74, 74, 74) | Secondary text, subtle elements |
| **Parchment** | `#E8DCC8` | rgb(232, 220, 200) | Primary background |
| **Cream** | `#F5F0E6` | rgb(245, 240, 230) | Light background variant |
| **Warm White** | `#FAF8F5` | rgb(250, 248, 245) | Lightest background |

### Extended Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Sepia** | `#8B4513` | Historical elements, earth tones |
| **Steel Blue** | `#4682B4` | Water, subtle accents |
| **Tan** | `#D2B48C` | Borders, separators |
| **Burgundy** | `#800020` | Dark accent variant |

---

## Typography

### Primary Typeface

**Headings**: Use condensed, geometric sans-serif fonts that evoke early 20th century typography.

Recommended fonts (in order of preference):
1. **DIN Condensed** - Clean, authoritative
2. **Bebas Neue** - Free alternative with similar character
3. **Oswald** - Google Fonts, condensed and readable
4. **Inter** (current) - Modern fallback

### Typography Hierarchy

```
MAIN TITLE          - All caps, bold, 32-48px, tracking +0.1em
Section Heading     - All caps, medium, 20-24px, tracking +0.05em
Body Text           - Sentence case, regular, 16px, tracking normal
Caption             - Sentence case, 12-14px, muted color
Data Labels         - All caps, 10-12px, tracking +0.05em
```

### Text Styling Guidelines

- Use ALL CAPS for titles and section headers
- Favor generous letter-spacing in headings
- Maintain strong contrast between text and background
- Use bilingual labels where appropriate (a Du Bois hallmark)

---

## Design Principles

### 1. Bold Geometry
- Use strong, simple geometric shapes
- Favor circles, rectangles, and clean angles
- Avoid gradients—use flat, solid colors
- Sharp, clean edges over soft shadows

### 2. Data-Forward
- Let the data be the hero
- Minimize decorative elements
- Every visual element should serve a purpose
- Use color to encode information, not decoration

### 3. Hand-Crafted Feel
- Embrace slight imperfections
- Consider textured backgrounds (like aged paper)
- Typography can have a "printed" quality
- Borders and lines can be slightly thicker than modern minimalism

### 4. Strong Contrast
- High contrast between foreground and background
- Bold color blocks
- Black borders to define regions
- Clear visual hierarchy

---

## Mapbox Style Configuration

### Map Color Scheme

```javascript
const duboisMapColors = {
  // Land
  landBase: '#E8DCC8',        // Parchment
  landAlt: '#D2B48C',         // Tan

  // Water
  water: '#1E3A5F',           // Prussian Blue
  waterLabel: '#4682B4',      // Steel Blue

  // Roads
  roadMajor: '#1A1A1A',       // Ink Black
  roadMinor: '#8B4513',       // Sepia
  roadHighway: '#C41E3A',     // Carmine

  // Buildings
  building: '#DAA520',        // Gold
  buildingOutline: '#1A1A1A', // Ink Black

  // Parks/Nature
  park: '#2E8B57',            // Emerald
  parkLabel: '#1A1A1A',       // Ink Black

  // Labels
  labelPrimary: '#1A1A1A',    // Ink Black
  labelSecondary: '#4A4A4A',  // Charcoal

  // POI
  poi: '#C41E3A',             // Carmine
  poiLabel: '#1A1A1A',        // Ink Black
}
```

### Recommended Mapbox Layers

**Background**: Parchment (#E8DCC8)
**Water**: Prussian Blue (#1E3A5F) with subtle opacity
**Land Use**:
- Parks: Emerald (#2E8B57) at 60% opacity
- Industrial: Tan (#D2B48C) at 40% opacity

**Buildings**:
- Fill: Gold (#DAA520) at 80% opacity
- Outline: Ink Black (#1A1A1A) at 1px

**Roads**:
- Highways: Carmine (#C41E3A) at 2-4px
- Major roads: Ink Black (#1A1A1A) at 1-2px
- Minor roads: Sepia (#8B4513) at 0.5-1px

---

## UI Components

### Buttons

```css
/* Primary Button */
.btn-primary {
  background-color: #C41E3A;  /* Carmine */
  color: #FAF8F5;             /* Warm White */
  border: 2px solid #1A1A1A;  /* Ink Black */
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

/* Secondary Button */
.btn-secondary {
  background-color: #E8DCC8;  /* Parchment */
  color: #1A1A1A;             /* Ink Black */
  border: 2px solid #1A1A1A;  /* Ink Black */
  text-transform: uppercase;
}
```

### Cards & Panels

- Background: Cream (#F5F0E6) or Parchment (#E8DCC8)
- Border: 2px solid Ink Black (#1A1A1A)
- No border-radius (sharp corners) or very subtle (2-4px)
- Box shadow: subtle, warm-toned

### Color Bar (U.S. Graphics Style)

A signature element—horizontal bar of color swatches used as a header decoration:

```
[Carmine][Carmine][Burgundy][Prussian][Steel][Prussian][Emerald][Emerald][Gold][Gold][Sepia][Sepia]
```

---

## CSS Variables

```css
:root {
  /* Primary */
  --dubois-carmine: #C41E3A;
  --dubois-gold: #DAA520;
  --dubois-prussian: #1E3A5F;
  --dubois-emerald: #2E8B57;

  /* Neutrals */
  --dubois-ink: #1A1A1A;
  --dubois-charcoal: #4A4A4A;
  --dubois-parchment: #E8DCC8;
  --dubois-cream: #F5F0E6;
  --dubois-warm-white: #FAF8F5;

  /* Extended */
  --dubois-sepia: #8B4513;
  --dubois-steel: #4682B4;
  --dubois-tan: #D2B48C;
  --dubois-burgundy: #800020;

  /* Semantic */
  --color-primary: var(--dubois-carmine);
  --color-secondary: var(--dubois-gold);
  --color-background: var(--dubois-parchment);
  --color-surface: var(--dubois-cream);
  --color-text-primary: var(--dubois-ink);
  --color-text-secondary: var(--dubois-charcoal);
}
```

---

## Inspiration Notes

The W.E.B. Du Bois visualizations were remarkable for:

1. **Bold use of color** - Limited palette used with maximum impact
2. **Innovative chart types** - Spirals, nested circles, tree diagrams
3. **Political clarity** - Data visualization as advocacy
4. **Craftsmanship** - Hand-drawn with care and precision
5. **Bilingual presentation** - English and French text throughout

When designing, ask: "Would this feel at home in the 1900 Paris Exposition?"

---

## Examples of Application

### Navigation Header
- Parchment background
- Color bar beneath the header
- All-caps typography
- Black borders on navigation items

### Map Overlay Panels
- Cream background with subtle paper texture
- 2px black border
- Bold, condensed headings
- Data displayed in Du Bois chart style when possible

### Data Visualization
- Use the primary color palette
- Favor flat colors over gradients
- Bold black outlines
- Clear, simple legends

---

*"The problem of the twentieth century is the problem of the color-line."*
— W.E.B. Du Bois, 1900

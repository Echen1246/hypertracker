# HyperTracker Design System

## Inspiration
Clean, minimalist design inspired by Hyperliquid's professional trading interface.

## Color Palette

```css
--color-bg: #000000           /* Pure black background */
--color-bg-secondary: #0a0a0a /* Subtle elevation */
--color-border: #1a1a1a       /* Minimal borders */
--color-border-hover: #2a2a2a /* Hover state */
--color-text: #ffffff         /* White text */
--color-text-secondary: #999  /* Gray secondary */
--color-text-muted: #666      /* Muted labels */
--color-success: #00ff00      /* Bright green */
--color-danger: #ff4466       /* Red */
--color-primary: #00ffff      /* Cyan accent */
```

## Typography

- **Font**: Inter
- **Size**: 11px - 14px (compact, data-dense)
- **Weight**: 400-600 (mostly 500)
- **Letter Spacing**: 0.5px (uppercase labels)

## Layout Principles

1. **No Cards/Boxes**: Data is presented in clean tables with subtle borders
2. **Minimal Padding**: Compact, information-dense layout
3. **Flat Design**: No shadows, gradients, or depth effects
4. **Table-First**: Positions displayed as rows, not cards
5. **Sticky Headers**: Column headers stay visible when scrolling
6. **Subtle Hover**: Background changes only, no transforms or shadows

## Components

### Sidebar
- 200px width
- Border-right separator
- Active state: left border accent + background
- No gaps between items

### Header
- Minimal height (50px)
- Simple logo and status indicator
- No background effects

### Positions Table
- Grid-based columns
- Sticky header row
- Hover: subtle background change
- Color coding: GREEN for longs/profits, RED for shorts/losses

### Copy Trading Panel
- Bottom-fixed panel
- Compact toggle switch
- Minimal form inputs
- Flat button style

## No-Nos

❌ Box shadows  
❌ Border radius > 2px  
❌ Gradients  
❌ Animations (except subtle transitions)  
❌ Emojis or icons  
❌ Large padding/margins  
❌ Cards or "bubbly" elements  

## Yes-Yes

✅ Clean lines  
✅ Data density  
✅ Monospace numbers  
✅ Subtle hover states  
✅ Clear hierarchy  
✅ Functional layout  


# Font Files

This directory contains the custom font files for the RevTrust application.

## Required Font Files

### Inter (for headings)
This font is loaded from Google Fonts and doesn't require local files.

### Switzer (for body text)
Place these files in this directory:
- `Switzer-Regular.woff2` (Regular - 400 weight)
- `Switzer-Medium.woff2` (Medium - 500 weight)
- `Switzer-Semibold.woff2` (Semi Bold - 600 weight)

**Download from:** https://www.fontshare.com/fonts/switzer (Free for personal and commercial use)

### Inter Tight (for metrics/buttons)
This font is loaded from Google Fonts and doesn't require local files.

## Font Usage

- **Inter**: Page titles (H1), section headers (H2-H3), navigation labels
- **Switzer**: Paragraphs, form labels, table content, helper text
- **Inter Tight**: Metrics, buttons, badges, tags, small pills, cards with limited space

## Installation

1. Download the font files from the sources above
2. Convert to .woff2 format if needed (use https://cloudconvert.com/woff2-converter)
3. Place the files in this directory
4. Restart your Next.js development server

## Fallback Fonts

If the custom fonts are not available, the application will fall back to:
- **Söhne** → system-ui, sans-serif
- **Switzer** → system-ui, sans-serif
- **Inter Tight** → system-ui, sans-serif

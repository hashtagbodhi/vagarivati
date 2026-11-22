# Vagari Vati

A no-scroll-first, dark, goth-accented storefront redesign for Vagari Vati. Static site: plain HTML, CSS and JavaScript, no build tools beyond one Python script.

## Open it

Open `index.html` in a browser. Everything loads from the folders next to it.

## Structure

| Path | What it is |
|---|---|
| `src/body.html` | Page markup (home, product, story, policies, account, bag, menu, reader) |
| `src/styles.css` | All styles, with the design tokens at the top |
| `src/app.js` | Routing, wall and filters, product page, bag, story reader, languages, currencies, account prototype, interface sounds |
| `src/_wordmark.svg`, `src/_mono.svg` | Logo parts inlined at build time |
| `src/_privacy.html` | Privacy policy text from the store |
| `data.js` | The 38 products: names, descriptions, sizes, variant ids, prices in 8 currencies, photo lists |
| `src/copy.json` | The product descriptions as written |
| `build.py` | Assembles `index.html` and `artifact.html` from `src/` |
| `cut2/` | Product cutouts (background removed, colour lifted) used on the wall, bag and account |
| `img/` | Product photographs |
| `media/` | Films, pattern swatches (`sw/`), cloth close-ups (`cl/`), icons (`ic/`) |

## Rebuild after editing `src/`

```bash
python3 build.py
```

This rewrites `index.html` (open locally) and `artifact.html` (the same page as a fragment, for publishing as an artifact).

## Typefaces

- UnifrakturMaguntia: headings only, never buttons or labels
- Host Grotesk: everything else

Both load from Google Fonts.

## Checkout

The bag hands off to the live store. The checkout link is built as `https://vagarivati.com/cart/<variantId>:<quantity>,...` from the variant ids in `data.js`.

## Known prototype limits

- The account page is a design only: any valid email "signs in" and shows example orders.
- Languages translate the interface; product descriptions, pattern stories and policies stay in English.
- Shipping, Returns and Terms text are drafts and need the brand's confirmation.
- The TikTok icon links to tiktok.com until the real handle is supplied.

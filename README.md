# Fraction Feast

A cheerful 4th-grade fractions food-truck game designed for iPad and desktop browsers.

## Fraction stops

- Pizza Pier — build fractions by choosing equal pieces and filling the requested amount.
- Candy Canyon — recognize fractions from visual trays.
- Bakery Boulevard — match equivalent fractions visually.
- Pancake Peak — compare fractions using equal-length bars.
- Taco Town — order three fractions from smallest to largest.
- Cookie Cafe — add fractions with like denominators.
- Waffle Works — subtract fractions with like denominators.
- Party Catering — build mixed numbers from whole and fractional pieces.
- Royal Banquet — mixed review of all skills.

Progress, coins, completed rushes, and truck upgrades are saved in localStorage when the browser allows it.

## Test it

You can double-click `index.html` and the game should render and play. Browser security rules do not allow service workers on `file://`, so PWA/offline installation requires serving the folder over HTTP or HTTPS.

For local PWA testing:

```bash
cd fraction-feast
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Install on iPad

Deploy the folder to any HTTPS static host (GitHub Pages works well), open it in Safari, then use Share -> Add to Home Screen. The app includes an Apple touch icon, standard 192/512 icons, a 512 maskable icon, a web manifest, safe-area support, generated Web Audio music, and an offline service worker.

## Updating

When changing cached files, bump the cache name near the top of `sw.js` so an installed copy refreshes cleanly.

## Welcome screen navigation
The app now opens on the illustrated Fraction Feast welcome screen. The painted controls are live buttons:
- **Random Level** starts one of the nine stops at random.
- **Map** opens the level-selection map.
- **My Collection** opens the treasure collection/shop, where earned coins can be spent on truck upgrades.
- The painted speaker toggles the generated background music.

The welcome artwork is cached by the service worker for offline iPad/PWA use.

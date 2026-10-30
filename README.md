# Weight Tracker

A private iPhone web app for logging your weight, weekly measurements and an estimated body fat percentage. Your data stays on your phone.

## Install on your iPhone

1. Open the app link in Safari.
2. Tap Share, then Add to Home Screen.
3. Open the app from the new icon and do your logging there. Safari tabs and the installed app keep separate data.

Removing the home-screen icon deletes the app's data, so export a backup from Settings first.

## Development

```bash
npm install
npm run dev        # local development server
npm test           # unit tests
npm run test:e2e   # browser tests (first run: npx playwright install webkit chromium)
npm run build      # production build in dist/
```

Pushing to `main` runs the unit tests and deploys to GitHub Pages.

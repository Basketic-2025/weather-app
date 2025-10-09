# Weather for F1

A responsive weather dashboard built with React, Vite, and Tailwind CSS. It targets race-weekend planning by giving quick insight into current conditions, hourly temperature trends, and a seven day outlook for any city.

## Features
- City search with debounced suggestions and recent history persisted in `localStorage`.
- Optional geolocation lookup to centre the forecast on the user's current position.
- Metric/imperial unit toggle and light/dark themes with preferences saved between sessions.
- Local caching of responses with offline fallback messaging when cached data is shown.
- Fallback to Open‑Meteo when an OpenWeather One Call API key is not configured.
- Error boundary with friendly crash output and skeleton loading states for perceived performance.

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. (Optional) Copy `.env.example` to `.env` and add an OpenWeather API key:
   ```dotenv
   VITE_OPENWEATHER_API_KEY=your-key-here
   ```
   Without a key the app will still work via Open‑Meteo, but city geocoding falls back to Nominatim.
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

Additional scripts:
- `npm run build` – generate a production build in `dist/`
- `npm run preview` – serve the production build locally

## Architecture Overview
- `src/App.jsx` orchestrates state, caching, theme/unit persistence, and data fetching (with lazy loading for the hourly chart).
- `src/main.jsx` mounts the React tree and enables a reduced-effects "perf" mode when needed.
- Components under `src/components/` render the toolbar, search, current conditions, hourly chart, daily grid, and highlight cards. They are memoized to reduce unnecessary renders.
- `src/lib/api.js` wraps Axios clients for OpenWeather, Open‑Meteo, and Nominatim; `src/lib/normalize.js` and `src/lib/utils.js` shape the API responses into a consistent format and provide formatting helpers.
- Styling relies on Tailwind CSS with some custom utility classes defined in `src/styles.css` and design tokens extended via `tailwind.config.js`.

## Environment & Data
- Requires Node 18+ to match the Vite toolchain.
- Uses `localStorage` keys prefixed with `weather-` for caching recent searches and API responses (15 minute freshness window).
- API traffic stays client-side; ensure API keys are scoped appropriately before deploying.

## Deployment Notes
- Run `npm run build` and host the contents of `dist/` on any static host (Netlify, Vercel, GitHub Pages, etc.).
- Remember to configure the OpenWeather key and allowed origins if deploying publicly.

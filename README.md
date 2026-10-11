# ATMOS — AI Weather Intelligence Platform

> *"Feel the Weather. Predict the Moment."*

ATMOS is a production-quality, cinematic AI-powered atmospheric intelligence platform. Designed as a high-end combination of an interactive climate dashboard, live radar visualizer, and deterministic AI meteorological co-pilot.

---

## 🌟 Key Features

1. **Immersive Atmospheric Experience**:
   - Dynamic cinematic backdrops that automatically adapt to real-time conditions (Clear skies, clouds, rain precipitation particles, snow flurries, fog, nocturnal starlight).
   - Glassmorphism design system tailored with dark navy surfaces, electric cyan highlights, and warm solar accents.

2. **Live Open-Meteo Integration**:
   - Zero-fabrication telemetry: Real-time temperature, apparent ("feels-like") temperature, WMO meteorological classification, relative humidity, wind velocity and compass heading, surface barometric pressure, UV index, cloud cover, and optical visibility.
   - Intelligent client caching strategy (10-minute TTL) with duplicate request suppression.

3. **Smart City Geocoding & GPS Uplink**:
   - Real-time global geocoding search with debounced keystrokes and keyboard arrow navigation (`↑`, `↓`, `Enter`, `Escape`).
   - Reverse-geocoded browser GPS location access (requested strictly on user trigger, never on initial load).
   - Local storage persistence for pinned favorite cities and recent searches.

4. **Hourly Forecast Timeline**:
   - Smooth horizontal scroll timeline displaying the next 36 hours.
   - Current hour highlighted with live precipitation probability (%) and localized wind speeds.

5. **7-Day Synoptic Trajectory**:
   - Detailed week outlook with visual min/max thermal gradient spectrums.
   - Interactive expandable day drawers displaying solar milestones (sunrise/sunset), peak gusts, UV exposure indexes, and daylight duration.

6. **24-Hour Microclimate Analytics**:
   - Interactive Recharts data dashboard with switchable layers:
     - Ambient Temperature vs. Biometeorological Apparent Temperature (dual gradient area).
     - Hourly Precipitation Probability (%) bar charts.
     - Wind Speed Dynamics (km/h).
     - Relative Humidity Saturation trends.

7. **Interactive Geospatial Radar Map**:
   - Leaflet (`react-leaflet`) dark-mode radar surface with custom live telemetry pulsing pin.
   - Switchable tile layers: Dark Atmospheric Radar, Voyager Terrain, and Standard Topographic.

8. **Solar Arc & Daylight Tracker**:
   - Mathematical SVG celestial trajectory tracking real-time solar elevation between sunrise and sunset.
   - Remaining daylight countdown and nocturnal phase indicators.

9. **AI Weather Intelligence Co-Pilot**:
   - Conversational assistant grounded exclusively in real ECMWF / Open-Meteo numerical telemetry.
   - Answers specific lifestyle questions: rain time windows, outdoor workout viability, apparel advisories, and diurnal temperature spreads.
   - Answers critical foresight prompts like *"Will it rain in the next 3 hours?"* and *"What dangerous weather is expected tomorrow?"* with explicit supporting probabilities, accumulation estimates, and safety precautions.
   - Transparently labeled telemetry reasoning engine that never hallucinates false measurements.

10. **Meteorological Hazards & Alerts**:
    - Direct integration with NOAA / National Weather Service feeds for US locations.
    - Global WMO meteorological threshold engine for gale-force winds, excessive rain runoff, severe convective thunderstorms, and extreme heat waves.
11. **Autonomous AI Weather Prediction & Hazard Intelligence Dashboard**:
    - **Smart Rain Alerts**: Computes precipitation start windows, duration, peak probability, hourly intensity, and accumulation.
    - **Multi-Hazard Predictive Engine**: Detects extreme heat, cold waves, gale-force winds, convective thunderstorms, and excessive rainfall.
    - **Scientific Transparency**: Every prediction displays detailed rationale, anticipated impacts, actionable precautions, and forecast limitation notes.
    - **Browser Push Alerts**: Optional opt-in desktop/mobile notifications before anticipated rainfall and severe weather threats with intelligent deduplication.

12. **AI-Powered Outfit Recommendation & Daily Planner**:
    - **Weather-Grounded Wardrobe Engine**: Analyzes real-time temperature, apparent ("feels-like") temperature, humidity, wind velocity, UV radiation, and hourly rain probability.
    - **Smart Combinations**: Tailors combinations of T-shirts, shirts, jeans, trousers, hoodies, knit sweaters, jackets, down parkas, and storm raincoats.
    - **AI Personalization & Styles**: Lets users toggle styles (**Casual**, **College / Campus**, **Formal / Office**, **Sportswear / Active**, **Traditional / Ethnic**) and select color palette preferences (**Neutral**, **Earthy**, **Dark**, **Vibrant**).
    - **Daily 4-Slot Planner**: Provides individual forecast-backed outfit recommendations for **Current Real-Time**, **Morning Transit (07:00–11:30)**, **Midday Peak (12:00–17:00)**, and **Evening/Night (17:30–22:30)** with proactive diurnal weather shift notifications.
    - **Essential Weather Accessories**: Suggests windproof umbrellas, UV400 sunglasses, scarves, beanies, or rain shell sleeves.
    - **Comfort Score & Rationale**: Each card displays a 0-100 comfort rating, suitable textile weaves (merino wool, linen, slub cotton), and meteorological justification.
    - **Interactive Assistant Queries**: Directly answers queries like *"What should I wear to college today?"*, *"Suggest an outfit for rainy weather"*, *"What should I wear tomorrow morning?"*, and *"Suggest a formal outfit for today's weather"*.

13. **Automatic Location-Based Day & Night Theme**:
    - **Solar-Grounded Dynamic Switching**: Computes the exact solar state (sunrise and sunset) for the selected city's IANA timezone.
    - **🌞 Day Theme**: Crisp, sunlight-inspired sky-blue and white atmospheric gradient with high-contrast text, clear frosted panels, and daylight solar status.
    - **🌙 Night Theme**: Deep navy-blue, midnight blue, and subtle indigo gradients with lunar accents, soft glowing borders, and starlight reflections.
    - **Zero-Flicker Transitions**: Smooth CSS variable-driven transitions (`0.8s background`, `0.5s text/panels`) across all components including the navbar, dashboard, charts, AI Assistant, outfit recommendations, alerts, and modal dialogs.
    - **Smart Telemetry Indicator**: Live indicator in the navbar displaying solar phase, countdown to next sunrise/sunset, and local city solar time.


---

## 🛠️ Technology Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom CSS Glassmorphism Design Tokens
- **Icons**: Lucide React
- **Visualizations**: Recharts
- **Maps**: Leaflet + React-Leaflet
- **Data Provider**: Open-Meteo Forecast & Geocoding APIs (No API key required)
- **Persistence**: Browser `localStorage` (Preferences, Favorites, Recents)

---

## 🚀 Getting Started

### 1. Installation
Clone the repository or navigate to the workspace directory:
```bash
npm install
```

### 2. Development Server
Run the local Vite server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

### 3. Production Build
Verify type-safety and bundle the production assets:
```bash
npm run build
npm run preview
```

---

## ⚙️ Configuration & Environment Variables

ATMOS works completely out-of-the-box without requiring third-party API keys because Open-Meteo provides free, high-resolution scientific meteorological data.

If you wish to configure a custom backend LLM for the AI Assistant, you can create a `.env` file in the root directory:
```env
# Optional external AI configuration
VITE_AI_PROVIDER=custom
VITE_AI_ENDPOINT=https://api.your-backend.com/v1/chat
```
When omitted, ATMOS automatically operates its verifiable, deterministic reasoning engine grounded in actual live forecast data.

---

## 📄 License & Attribution

Weather data is provided by [Open-Meteo](https://open-meteo.com) under the Creative Commons Attribution 4.0 International License (CC BY 4.0).

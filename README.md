# SurplusRoute — AI-Driven Geospatial Food Rescue Grid

![React](https://img.shields.io/badge/Frontend-React_%7C_Vite_%7C_Tailwind_v4-0f172a?style=flat-square&logo=react&logoColor=10b981)
![Node.js](https://img.shields.io/badge/Backend-Node.js_%7C_Express-0f172a?style=flat-square&logo=node.js&logoColor=10b981)
![MongoDB](https://img.shields.io/badge/Database-MongoDB_Atlas_2dsphere-0f172a?style=flat-square&logo=mongodb&logoColor=10b981)
![Gemini AI](https://img.shields.io/badge/AI_Engine-Google_Gemini_Vision-0f172a?style=flat-square&logo=google&logoColor=10b981)
![Deployment](https://img.shields.io/badge/Deployed-Vercel_%26_Render-0f172a?style=flat-square&logo=vercel&logoColor=10b981)

**SurplusRoute** is a full-stack, real-time food redistribution platform built to eliminate the last-mile coordination gap between commercial kitchens and local hunger-relief organizations. By pairing **Google Gemini multimodal vision triage** with **MongoDB `2dsphere` geospatial dispatch**, SurplusRoute turns a single smartphone photo of surplus food into an automated, safety-verified, location-matched rescue mission in under five minutes.

---

## Table of Contents

1. [Problem Statement & Solution](#1-problem-statement--solution)
2. [System Architecture](#2-system-architecture)
3. [Detailed Feature Breakdown](#3-detailed-feature-breakdown)
4. [Tech Stack](#4-tech-stack)
5. [Project Structure](#5-project-structure)
6. [REST API Reference](#6-rest-api-reference)
7. [Local Development Setup](#7-local-development-setup)
8. [Production Deployment](#8-production-deployment)

---

## 1. Problem Statement & Solution

### The Bottleneck in Urban Food Rescue
Every evening, banquet halls, university hostels, restaurants, and corporate events discard large volumes of untouched, safe-to-eat surplus meals. Traditional donation workflows fail because:
* **Manual Friction:** Kitchen staff closing up at night do not have time to weigh trays, write itemized inventories, and call multiple charities.
* **Safety Ambiguity:** NGOs hesitate to dispatch volunteers without knowing the condition, packaging, or perishability of the food.
* **Slow Radius Matching:** Broadcasts in unindexed chat groups reach volunteers too far away, causing cooked food to spoil before pickup.

### How SurplusRoute Solves It
1. **Zero-Typing AI Intake:** Donors snap one photo. Google Gemini inspects the image, identifies dishes, estimates total weight in kilograms, assigns dietary tags, and classifies freshness (`Fresh`, `Needs Immediate Pickup`, or `Unsafe`).
2. **Automated Safety Gating:** Batches flagged as `Unsafe` are automatically rejected before ever entering the NGO dispatch feed.
3. **Hyper-Local Geospatial Broadcast:** Verified batches are indexed as GeoJSON `Point` coordinates and surfaced exclusively to NGOs operating within a configurable **5 km to 50 km** radius.
4. **One-Click Claim & Navigation:** NGOs claim batches directly from a live dark-mode map, unlocking donor contact details and turn-by-turn Google Maps routing.

---

## 2. System Architecture

```text
┌───────────────────────────┐         HTTPS / JWT          ┌──────────────────────────────────┐
│   React + Vite Client     │ ───────────────────────────► │      Express.js REST API         │
│   (Vercel Edge Network)   │ ◄─────────────────────────── │        (Render Web Service)      │
│                           │                              │                                  │
│ • Auth & Live Telemetry   │                              │ • Multer Multipart Ingestion     │
│ • Donor Upload Hub        │                              │ • Role-Based JWT Middleware      │
│ • NGO Dispatch & Leaflet  │                              │ • Geospatial Query Engine        │
└───────────────────────────┘                              └─────────┬───────────────┬────────┘
                                                                     │               │
                                          ┌──────────────────────────┘               └──────────────────────────┐
                                          ▼                                                                     ▼
                        ┌──────────────────────────────────┐                                  ┌──────────────────────────────────┐
                        │   AI & Media Processing Layer    │                                  │      MongoDB Atlas Cluster       │
                        │                                  │                                  │                                  │
                        │ • Cloudinary CDN (Image Hosting) │                                  │ • Users Collection (Donor / NGO) │
                        │ • Google Gemini Vision API       │                                  │ • Donations Collection           │
                        │   └─ Structured JSON Triage      │                                  │ • 2dsphere Geospatial Index      │
                        └──────────────────────────────────┘                                  └──────────────────────────────────┘
```

---

## 3. Detailed Feature Breakdown

### Multimodal AI Food Triage (Google Gemini)
* **Automated Visual Inspection:** When a donor submits an image via `multipart/form-data`, the backend streams the asset to **Cloudinary** for persistent CDN delivery and sends the visual payload to **Google Gemini** for structured telemetry extraction.
* **Structured Metadata Extraction:** Without manual form entry, Gemini returns:
  * **Food Identification:** Recognized dish names and container types (e.g., *Paneer Pulao & Dal Makhani in sealed foil trays*).
  * **Weight Estimation (`weightKg`):** Volumetric portion estimation converted into total kilograms.
  * **Urgency & Freshness Classification:** Categorizes batches into `Fresh` (standard pickup window), `Needs Immediate Pickup` (high-perishability items flagged for priority dispatch), or `Unsafe` (automatically blocked from publication).
  * **Dietary & Handling Tags:** Automatically tags vegetarian/non-vegetarian status, allergen indicators, and storage notes.

### Geospatial NGO Radar (`2dsphere` Indexing)
* **GeoJSON Storage:** Both Donor pickup points and NGO headquarters are stored using standard GeoJSON `Point` schemas (`[longitude, latitude]`) backed by MongoDB `2dsphere` indexes.
* **Dynamic Radius Filtering:** NGOs can adjust their active operational radar between **5 km and 50 km** in real time. The backend executes spherical distance queries (`$nearSphere` / `$geoWithin`) to return only reachable donations sorted by proximity.
* **Browser GPS Capture:** During registration, partners can lock in their exact dispatch coordinates with a single click using the browser Geolocation API.

### Interactive Dark-Mode Dispatch Map (`react-leaflet`)
* **Dual-View NGO Workspace:** Dispatchers can toggle seamlessly between a structured **Card Feed** and a full-bleed **Live Map** view.
* **Visual Radar Overlay:** Renders a translucent emerald radius circle centered on the NGO's coordinates so dispatchers immediately see which listings fall inside their fleet's range.
* **Urgency-Coded Markers & Popups:**
  * **Emerald Pins:** `Fresh` surplus batches ready for standard pickup.
  * **Amber Pins:** `Needs Immediate Pickup` batches requiring rapid dispatch.
  * **Interactive Popups:** Displays food summary, estimated weight, distance, a one-click **Claim Rescue** trigger, and a direct **Open in Google Maps** navigation link.

### End-to-End Chain of Custody & Privacy Controls
Every donation moves through a strict three-stage state machine:
1. **`Available`:** Verified by Gemini and visible on the geospatial radar to nearby NGOs.
2. **`Claimed`:** Locked to a single NGO to prevent duplicate volunteer trips. Once claimed, the donor's direct phone number and street address are revealed to the assigned NGO.
3. **`PickedUp`:** Confirmed upon collection at the donor's kitchen, finalizing the audit trail and committing the batch's weight to the network's permanent impact metrics.

### Live Network Impact Telemetry
* **Real-Time Aggregation Banner:** Embedded across the Landing Page, Donor Hub, and NGO Dispatch dashboards.
* **Environmental & Social Conversion:**
  * **Food Diverted (`kg`):** Cumulative weight of verified rescues.
  * **Meals Served:** Calculated using a standardized **400g (`0.4 kg`) per meal** nutritional benchmark.
  * **$\text{CO}_2\text{e}$ Emissions Prevented (`kg`):** Calculated at **2.5 kg $\text{CO}_2\text{e}$ saved per kilogram** of food diverted from landfill methane decomposition.

### Interactive Landing Experience & Judge Demo Mode
* **Glassmorphic Dark-Mode UI:** Built with Tailwind CSS v4 (`slate-950` canvas, frosted `backdrop-blur` cards, and a hardware-accelerated cursor-tracking emerald/teal spotlight).
* **Interactive 3-Step Workflow Preview:** Visitors can click through *01. Gemini Vision Inspection*, *02. 2dsphere Geospatial Matching*, and *03. One-Click Claim & Route* with live sample telemetry.
* **One-Click Judge Demo Autofill:** Includes instant credential autofill buttons for both **Donor Login** and **NGO Login** so evaluators can test the complete two-sided marketplace in seconds.

---

## 4. Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite | Fast SPA bundling, client-side routing (`react-router-dom`), and state management |
| **Styling & UI** | Tailwind CSS v4 + Lucide Icons | Responsive dark-mode glassmorphic interface and consistent iconography |
| **Geospatial Mapping** | Leaflet + `react-leaflet` | Interactive map rendering, radius overlays, custom markers, and route popups |
| **HTTP Client** | Axios | Centralized API client with automatic JWT Bearer token request interceptors |
| **Backend Runtime** | Node.js + Express.js | RESTful API architecture, role-based access control, and error handling |
| **Authentication** | JSON Web Tokens (JWT) + `bcryptjs` | Stateless session management and salted password hashing |
| **File Ingestion** | Multer + Cloudinary SDK | Multipart image parsing and cloud CDN storage |
| **Database** | MongoDB Atlas + Mongoose | Document modeling, aggregation pipelines, and `2dsphere` geospatial queries |
| **Multimodal AI** | Google Gemini API (`@google/generative-ai`) | Vision-based food classification, weight estimation, and safety triage |
| **Hosting** | Vercel (Client) & Render (API) | Continuous deployment from GitHub with HTTPS endpoints |

---

## 5. Project Structure

```text
SurplusRoute/
├── client/                          # React + Vite Frontend (Deployed on Vercel)
│   ├── public/                      # Static public assets
│   ├── src/
│   │   ├── api/
│   │   │   └── axios.js             # Axios instance with VITE_API_URL & JWT interceptor
│   │   ├── components/
│   │   │   ├── BrandLogo.jsx        # Unified SurplusRoute pin mark & role badge
│   │   │   ├── DonationMap.jsx      # Interactive Leaflet radar map & claim popups
│   │   │   └── ImpactBanner.jsx     # Live kg, meals & CO2e telemetry banner
│   │   ├── pages/
│   │   │   ├── AuthPage.jsx         # Split-screen landing, workflow stepper & auth
│   │   │   ├── DonorDashboard.jsx   # AI image upload, batch tracker & donor history
│   │   │   └── NgoDashboard.jsx     # Radius slider, card feed, live map & claim queue
│   │   ├── App.jsx                  # Route definitions & role-based protection
│   │   ├── index.css                # Tailwind v4 imports & dark color-scheme lock
│   │   └── main.jsx                 # React DOM entry point
# 📈 FTNSE — NSE Index Analytics & Quant Dashboard

[![Next.js](https://img.shields.io/badge/Next.js-16.3.4-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**FTNSE** is an enterprise-grade quantitative market analytics web application and CLI suite engineered to deliver high-precision insights, drawdown metrics, 52-week position tracking, and 5-year Year-over-Year (YoY) performance breakdowns for major Indian Stock Exchange (NSE) indices.

---

## 📋 Table of Contents

- [Overview & Value Proposition](#-overview--value-proposition)
- [Covered NSE Benchmark Indices](#-covered-nse-benchmark-indices)
- [Key Features & Capabilities](#-key-features--capabilities)
- [Analytics & Mathematical Engine](#-analytics--mathematical-engine)
- [Technology Architecture](#-technology-architecture)
- [Project Directory Structure](#-project-directory-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development Server](#development-server)
  - [CLI Terminal Analytics](#cli-terminal-analytics)
  - [Production Build](#production-build)
- [Data Models & Types](#-data-models--types)
- [Performance & Revalidation Strategy](#-performance--revalidation-strategy)
- [License](#-license)

---

## 🌟 Overview & Value Proposition

Traditional market interfaces provide basic percentage gains without historical contextual reference or drawdown severity metrics. **FTNSE** solves this by analyzing current index levels relative to integer point-divisors, 52-week extremes, all-time highs (ATH), and multi-year historical milestones.

Designed with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4**, the application couples server-side cached data fetching with interactive client-side visualizers, vector SVG trend graphs, and standalone Node.js CLI reporting capabilities.

---

## 🏛️ Covered NSE Benchmark Indices

FTNSE monitors four core market-capitalization tiers of the National Stock Exchange of India:

| Index Name | Yahoo Ticker | Market Segment | Description |
| :--- | :--- | :--- | :--- |
| **NIFTY 50** | `^NSEI` | Large-Cap | Top 50 liquid, blue-chip Indian companies |
| **NIFTY Next 50** | `^NSMIDCP` | Large/Mid-Cap | 50 companies ranking directly below NIFTY 50 |
| **NIFTY Midcap 150** | `NIFTYMIDCAP150.NS` | Mid-Cap | 150 mid-sized growth equity Universe |
| **NIFTY Smallcap 250** | `NIFTYSMLCAP250.NS` | Small-Cap | 250 emerging small-cap market enterprises |

---

## ✨ Key Features & Capabilities

- 📉 **Dual Drawdown Analytics**: Simultaneously measures drawdowns relative to 52-Week Highs and All-Time Highs (ATH) using point-difference models.
- 🎯 **52-Week Position Meter**: Dynamic gauge computing the exact percentage position (0% = 52W Low, 100% = 52W High) of current prices within their 52-week trading bounds.
- 📊 **5-Year YoY Performance Breakdown**: Automatically samples trading history back 5 years into yearly node windows ($Y_1$ through $Y_5$) to deliver year-over-year growth trajectories.
- 📈 **Interactive SVG Area Charting**: Zero-dependency, dynamic SVG vector charting engine with year-marker node highlights, gradient fills, and custom tooltip badges.
- 📱 **Responsive & Mobile-Optimized Dashboard**: Features a fixed glassmorphism mobile sticky control bar and tap-to-scroll detail triggers for seamless mobile viewing.
- 🖥️ **CLI Terminal Report Generator**: Embedded Node.js engine (`docs/index.js`) for generating formatted terminal reports without starting a browser server.

---

## 🧮 Analytics & Mathematical Engine

The core analytical pipeline residing in [`lib/nse.ts`](file:///d:/software_projects/web_development/experiment/ftnse/lib/nse.ts) processes price quotes and daily time-series data using point-based divisor normalizations.

### 1. Integer Divisor Point Model
Percentage metrics are evaluated against a hundredth-part integer divisor representing 1% of index base values:
$$\text{Divisor}(P) = \max\left(1, \left\lfloor \frac{P}{100} \right\rfloor\right)$$

### 2. Drawdown Metrics (52W High & All-Time High)
Given current rounded market price $P_{\text{curr}}$ and peak price $P_{\text{peak}}$:
$$\Delta_{\text{peak}} = | P_{\text{curr}} - P_{\text{peak}} |$$

$$\text{Drawdown}_{\%} = \frac{P_{\text{curr}} - P_{\text{peak}}}{\text{Divisor}(P_{\text{peak}})}$$

### 3. 52-Week Range Spread & Relative Placement
Let $H_{52}$ be the 52-week rounded high and $L_{52}$ be the 52-week rounded low:
$$\text{Spread}_{52} = H_{52} - L_{52}$$

$$\text{Range}_{\%} = \frac{\text{Spread}_{52}}{\text{Divisor}(H_{52})}$$

$$\text{Position}_{\%} = \min\left(100, \max\left(0, \frac{P_{\text{curr}} - L_{52}}{\text{Spread}_{52}} \times 100\right)\right)$$

### 4. 5-Year Trailing Node Sampling & YoY Growth
The algorithm searches historical daily quotes back to $T - y$ years (for $y \in \{0, 1, 2, 3, 4, 5\}$) with a maximum date matching tolerance of 30 days:

$$\Delta_{Y} = P_{\text{end}} - P_{\text{start}}$$

$$\text{YoY Growth}_{\%} = \frac{P_{\text{end}} - P_{\text{start}}}{\text{Divisor}(P_{\text{start}})}$$

---

## 🏗️ Technology Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Yahoo Finance API        │
                                  │  (Quotes & Historical Charts) │
                                  └──────────────┬────────────────┘
                                                 │
                                                 ▼
                                  ┌───────────────────────────────┐
                                  │   Analytics Engine            │
                                  │   - lib/nse.ts                │
                                  │   - docs/index.js             │
                                  └───────┬───────────────┬───────┘
                                          │               │
                  ┌───────────────────────┘               └────────────────────────┐
                  ▼                                                                ▼
┌───────────────────────────────────┐                            ┌───────────────────────────────────┐
│ Next.js 16 Server Component       │                            │ Standalone Node.js CLI            │
│ (app/page.tsx - ISR 900s Cache)   │                            │ (docs/index.js)                   │
└─────────────────┬─────────────────┘                            └───────────────────────────────────┘
                  │
                  ▼
┌───────────────────────────────────┐
│ Client Visualizer                 │
│ (components/DashboardClient.tsx)  │
│ - Lucide Icons & SVG Vector Chart │
│ - Mobile Sticky Controls          │
│ - YoY Matrix & Comparison Table   │
└───────────────────────────────────┘
```

### Core Technologies

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Market Data**: [`yahoo-finance2`](https://github.com/gadicc/node-yahoo-finance2)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## 📂 Project Directory Structure

```
ftnse/
├── app/
│   ├── favicon.ico             # Application Favicon
│   ├── globals.css             # Tailwind v4 Directives & Theme Root
│   ├── icon.svg                # Dynamic SVG Application Icon
│   ├── layout.tsx              # Root HTML Layout with Geist Font Setup
│   ├── manifest.ts             # Web App Manifest Definition
│   └── page.tsx                # Next.js Server Page & ISR Data Pre-fetcher
├── components/
│   └── DashboardClient.tsx     # Client Dashboard, SVG Chart & Interactive UI
├── docs/
│   └── index.js                # Standalone Terminal Analytical CLI Script
├── lib/
│   └── nse.ts                  # Core Financial Math & Data Fetching Service
├── public/                     # Static Assets & Public Files
├── AGENTS.md                   # Workspace Agent Rules & Next.js Guidelines
├── next.config.ts              # Next.js Server & Build Configuration
├── package.json                # Project Manifest & NPM Dependencies
├── tsconfig.json               # TypeScript Compiler Configuration
└── README.md                   # Technical Project Documentation
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js installed on your machine:
- **Node.js**: `v18.17.0` or higher
- **Package Manager**: `npm`, `pnpm`, `yarn`, or `bun`

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ChauhanJaved/nse.git
   cd nse
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

### Development Server

Start the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the interactive dashboard.

### CLI Terminal Analytics

You can run the standalone terminal market analytics generator directly without launching the Next.js server:
```bash
node docs/index.js
```

### Production Build

To test and execute a production build locally:
```bash
npm run build
npm run start
```

---

## 📐 Data Models & Types

All data returned by [`lib/nse.ts`](file:///d:/software_projects/web_development/experiment/ftnse/lib/nse.ts) adheres to the `IndexDataResult` interface:

```typescript
export interface IndexDataResult {
  name: string;                   // Index full display name (e.g., "NIFTY 50")
  ticker: string;                 // Yahoo Finance ticker (e.g., "^NSEI")
  shortName: string;              // Short display label
  description: string;            // Index coverage description
  current: number;                // Exact market price float
  currentRound: number;           // Rounded market price integer
  highAllTime: number;            // All-Time High price float
  highATRound: number;            // Rounded All-Time High price
  high52: number;                 // 52-Week High price
  high52Round: number;            // Rounded 52-Week High
  low52: number;                  // 52-Week Low price
  low52Round: number;             // Rounded 52-Week Low
  diff52: number;                 // Absolute point difference from 52W High
  percent52: number;              // Drawdown % from 52W High
  percent52Str: string;           // Formatted drawdown string (e.g., "-2.45%")
  range52: number;                // 52-Week Price Range Spread
  range52Percent: number;         // 52-Week Range Spread as % of 52W High
  range52Str: string;             // Formatted 52-Week Range Spread string
  rangePositionPercent: number;   // Position (0-100%) within 52-Week range
  diffAT: number;                 // Absolute point difference from ATH
  percentAT: number;              // Drawdown % from ATH
  percentATStr: string;           // Formatted ATH drawdown string
  p5PriceRound: number | null;    // Index price 5 years ago
  diff5Y: number;                 // 5-Year total point change
  percent5Y: number;              // 5-Year cumulative growth %
  percent5YStr: string;           // Formatted 5-Year growth string
  yearlyBreakdown: YearlyBreakdownItem[]; // Trailing 5-Year YoY breakdown items
  historical5Y: HistoricalPoint[]; // Sampled historical time-series for SVG rendering
  error?: string;                 // Error message if data retrieval fails
}
```

---

## ⚡ Performance & Revalidation Strategy

- **Incremental Static Revalidation (ISR)**: Market index quotes are statically pre-rendered and automatically revalidated every 15 minutes (`revalidate = 900` in [`app/page.tsx`](file:///d:/software_projects/web_development/experiment/ftnse/app/page.tsx)).
- **Sampled Vector Charts**: Historical daily charts (containing thousands of data points) are algorithmically downsampled to ~80 clean data points to maximize SVG rendering performance while maintaining fidelity.
- **Zero Third-Party Charting Bloat**: Built without heavy charting libraries (e.g. Chart.js, Recharts), keeping JS bundle size minimal and optimized.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).


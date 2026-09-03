"use client";

import React, { useState, useRef } from "react";
import { IndexDataResult } from "@/lib/nse";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Layers,
  ChevronDown,
  Sparkles,
  ArrowDown
} from "lucide-react";

interface Props {
  data: IndexDataResult[];
  lastUpdated: string;
}

export default function DashboardClient({ data, lastUpdated }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<"overview" | "breakdown" | "compare">("overview");

  const detailSectionRef = useRef<HTMLDivElement>(null);

  const currentData = data[selectedIndex] || data[0];

  const formatCurrency = (val: number) => {
    return "₹" + Math.round(val).toLocaleString("en-IN");
  };

  const getPercentColor = (val: number) => {
    if (val > 0) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    if (val < 0) return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    return "text-slate-400 bg-slate-500/10 border-slate-500/20";
  };

  const getPercentTextColor = (val: number) => {
    if (val > 0) return "text-emerald-400";
    if (val < 0) return "text-rose-400";
    return "text-slate-400";
  };

  const handleCardClick = (index: number) => {
    setSelectedIndex(index);
    // On mobile viewports (< 1024px), smoothly scroll down to the detail section so user sees the change immediately
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => {
        detailSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    }
  };

  // Helper for generating SVG Area Chart paths for 5Y Historical Data with Year Markers
  const renderAreaChart = (historical: IndexDataResult["historical5Y"]) => {
    if (!historical || historical.length < 2) {
      return (
        <div className="h-64 flex items-center justify-center text-slate-500">
          No historical chart points available
        </div>
      );
    }

    const width = 800;
    const height = 280;
    const padding = 30;

    const prices = historical.map(h => h.close);
    const minPrice = Math.min(...prices) * 0.97;
    const maxPrice = Math.max(...prices) * 1.03;

    const points = historical.map((h, i) => {
      const x = padding + (i / (historical.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((h.close - minPrice) / (maxPrice - minPrice)) * (height - 2 * padding);
      return { x, y, date: h.date, close: h.close };
    });

    const pathD = points.reduce((acc, pt, i) => {
      return i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
    }, "");

    const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    const isPositiveOverall = prices[prices.length - 1] >= prices[0];
    const strokeColor = isPositiveOverall ? "#10B981" : "#F43F5E";
    const gradientId = `chartGradient-${currentData.ticker.replace(/[^a-zA-Z0-9]/g, "")}`;

    // Compute exact 6 year marker nodes (5Y Ago -> Current)
    const lastDate = new Date(historical[historical.length - 1].date);
    const yearMarkers: Array<{
      x: number;
      y: number;
      yearsAgo: number;
      label: string;
      calendarYear: number;
      dateStr: string;
      price: number;
    }> = [];

    for (let y = 5; y >= 0; y--) {
      const targetDate = new Date(lastDate);
      targetDate.setFullYear(targetDate.getFullYear() - y);

      let minDiff = Infinity;
      let closestIdx = 0;

      historical.forEach((h, idx) => {
        const diff = Math.abs(new Date(h.date).getTime() - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = idx;
        }
      });

      const pt = points[closestIdx];
      if (pt) {
        const label = y === 0 ? "Current" : `${y}Y Ago`;
        const calYear = new Date(historical[closestIdx].date).getFullYear();
        yearMarkers.push({
          x: pt.x,
          y: pt.y,
          yearsAgo: y,
          label,
          calendarYear: calYear,
          dateStr: historical[closestIdx].date,
          price: historical[closestIdx].close
        });
      }
    }

    return (
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Background grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeDasharray="3 3" opacity="0.3" />

          {/* Vertical Year Grid Lines & Top Labels */}
          {yearMarkers.map((m, idx) => (
            <g key={`year-grid-${idx}`}>
              <line
                x1={m.x}
                y1={padding - 5}
                x2={m.x}
                y2={height - padding}
                stroke="#475569"
                strokeDasharray="4 4"
                strokeWidth="1.2"
                opacity="0.5"
              />
              <text
                x={m.x}
                y={padding - 12}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="10"
                fontWeight="600"
              >
                {m.label}
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Main Trend Line */}
          <path d={pathD} fill="none" stroke={strokeColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Year Marker Dots & Price Badges on the Curve Line */}
          {yearMarkers.map((m, idx) => {
            const isLast = idx === yearMarkers.length - 1;
            const textYOffset = m.y < padding + 40 ? 18 : -10;

            return (
              <g key={`year-marker-${idx}`} className="group">
                {/* Year Circle Node */}
                <circle
                  cx={m.x}
                  cy={m.y}
                  r={isLast ? "6" : "4.5"}
                  fill="#0F172A"
                  stroke={isLast ? strokeColor : "#38BDF8"}
                  strokeWidth={isLast ? "3" : "2"}
                  className={isLast ? "animate-pulse" : ""}
                />

                {/* Price text label above/below node */}
                <text
                  x={m.x}
                  y={m.y + textYOffset}
                  textAnchor="middle"
                  fill="#F1F5F9"
                  fontSize="10"
                  fontWeight="700"
                  className="pointer-events-none drop-shadow-md"
                >
                  ₹{Math.round(m.price).toLocaleString("en-IN")}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Year Timeline X-Axis Footer Bar */}
        <div className="grid grid-cols-6 text-center text-xs text-slate-400 mt-4 border-t border-slate-800/80 pt-3">
          {yearMarkers.map((m, idx) => (
            <div key={`year-footer-${idx}`} className="space-y-0.5">
              <div className="font-bold text-white text-xs sm:text-sm">{m.label}</div>
              <div className="text-[11px] text-blue-400 font-semibold">{m.calendarYear}</div>
              <div className="text-[10px] text-slate-400 font-mono">
                ₹{Math.round(m.price).toLocaleString("en-IN")}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 font-sans pb-24 lg:pb-16">
      {/* Top Glassmorphism Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#0B1120]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                NSE Indexes Analytics
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                <span>Live Data • Updated: {lastUpdated}</span>
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex bg-slate-900/90 border border-slate-800 rounded-lg p-1 text-xs text-slate-400">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  activeTab === "overview" ? "bg-blue-600 text-white shadow-sm" : "hover:text-slate-200"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("breakdown")}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  activeTab === "breakdown" ? "bg-blue-600 text-white shadow-sm" : "hover:text-slate-200"
                }`}
              >
                5Y Breakdown
              </button>
              <button
                onClick={() => setActiveTab("compare")}
                className={`px-3 py-1.5 rounded-md transition-all font-medium ${
                  activeTab === "compare" ? "bg-blue-600 text-white shadow-sm" : "hover:text-slate-200"
                }`}
              >
                Compare All
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Index Selector Cards Grid */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Select Index to View Analytics</span>
            </h2>
            <span className="text-[11px] text-blue-400 lg:hidden font-medium">
              Tap card to view charts ↓
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.map((idx, index) => {
              const isSelected = selectedIndex === index;

              return (
                <div
                  key={idx.ticker}
                  onClick={() => handleCardClick(index)}
                  className={`cursor-pointer group relative rounded-2xl p-4 transition-all duration-200 border active:scale-[0.98] ${
                    isSelected
                      ? "bg-slate-900/90 border-blue-500/90 shadow-xl shadow-blue-500/15 ring-2 ring-blue-500/50"
                      : "bg-[#0E1626]/70 border-slate-800/80 hover:border-slate-700 hover:bg-[#121B2E]"
                  }`}
                >
                  {/* Active Indicator Badge (crucial for mobile visibility) */}
                  {isSelected && (
                    <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>ACTIVE</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {idx.shortName}
                      </span>
                      <h3 className="text-base font-bold text-white mt-1 group-hover:text-blue-400 transition-colors">
                        {idx.name}
                      </h3>
                    </div>
                    <div
                      className={`text-xs px-2 py-1 rounded-md font-semibold border ${getPercentColor(
                        idx.percent52
                      )}`}
                    >
                      {idx.percent52Str}
                    </div>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-xl font-extrabold text-white tracking-tight">
                      {formatCurrency(idx.current)}
                    </span>
                    <span className="text-xs text-slate-400">
                      ATH: <span className="font-semibold text-slate-300">{formatCurrency(idx.highAllTime)}</span>
                    </span>
                  </div>

                  {/* Mini 52W Range Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>52W L: {formatCurrency(idx.low52)}</span>
                      <span>52W H: {formatCurrency(idx.high52)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden relative">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-400"
                        style={{ width: `${idx.rangePositionPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Index Detailed Workspace */}
        <div ref={detailSectionRef} className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart & Drawdown Visualizer (2 Columns on Large Screens) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Details of Active Index */}
            <div className="bg-[#0E1626] border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-white tracking-tight">{currentData.name}</h2>
                    <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {currentData.ticker}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">{currentData.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-400">Current Market Price</div>
                    <div className="text-2xl font-black text-white">{formatCurrency(currentData.current)}</div>
                  </div>
                </div>
              </div>

              {/* KPI Cards Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block font-medium">52W High Drawdown</span>
                  <span className={`text-base font-bold ${getPercentTextColor(currentData.percent52)}`}>
                    {currentData.percent52Str}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Diff: ₹{currentData.diff52.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block font-medium">ATH Drawdown</span>
                  <span className={`text-base font-bold ${getPercentTextColor(currentData.percentAT)}`}>
                    {currentData.percentATStr}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Diff: ₹{currentData.diffAT.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block font-medium">52-Week Range Spread</span>
                  <span className="text-base font-bold text-amber-400">{currentData.range52Str}</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Spread: ₹{currentData.range52.toLocaleString()}
                  </span>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
                  <span className="text-[11px] text-slate-400 block font-medium">5-Year Cumulative</span>
                  <span className={`text-base font-bold ${getPercentTextColor(currentData.percent5Y)}`}>
                    {currentData.percent5YStr}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {currentData.p5PriceRound ? `From ₹${currentData.p5PriceRound.toLocaleString()}` : "N/A"}
                  </span>
                </div>
              </div>

              {/* Chart Section */}
              <div className="mt-6 pt-4 border-t border-slate-800/80">
                {renderAreaChart(currentData.historical5Y)}
              </div>
            </div>

            {/* 5-Year YoY Breakdown Cards */}
            <div className="bg-[#0E1626] border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-bold text-white">Year-over-Year (YoY) Performance Breakdown</h3>
                </div>
                <span className="text-xs text-slate-400">Trailing 5-Year Nodes</span>
              </div>

              <div className="space-y-3">
                {currentData.yearlyBreakdown.map(item => (
                  <div
                    key={item.year}
                    className="bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center">
                        Y{item.year}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{item.label}</div>
                        <div className="text-xs text-slate-400">
                          ₹{item.startRound.toLocaleString()} → ₹{item.endRound.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Value Change</div>
                        <div className="text-xs font-semibold text-slate-300">
                          {item.diffY >= 0 ? "+" : ""}₹{item.diffY.toLocaleString()}
                        </div>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-lg text-xs font-bold border ${getPercentColor(
                          item.percentY
                        )}`}
                      >
                        {item.percentYStr}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Drawdown Analysis & Market Position Gauges */}
          <div className="space-y-6">
            {/* Drawdown & Peak Distance Card */}
            <div className="bg-[#0E1626] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
                <TrendingDown className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-bold text-white">Drawdown Analysis</h3>
              </div>

              {/* 52W High Drawdown Visual Gauge */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Distance from 52W High</span>
                  <span className="font-bold text-rose-400">{currentData.percent52Str}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-rose-500 to-amber-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.abs(currentData.percent52) * 4)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Current: {formatCurrency(currentData.current)}</span>
                  <span>52W Peak: {formatCurrency(currentData.high52)}</span>
                </div>
              </div>

              {/* ATH Drawdown Visual Gauge */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">Distance from All-Time High</span>
                  <span className="font-bold text-rose-400">{currentData.percentATStr}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-rose-600 via-amber-500 to-blue-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.abs(currentData.percentAT) * 4)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Current: {formatCurrency(currentData.current)}</span>
                  <span>ATH Peak: {formatCurrency(currentData.highAllTime)}</span>
                </div>
              </div>

              {/* 52W Range Progress Meter */}
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">52W Low - High Position</span>
                  <span className="font-bold text-emerald-400">
                    {Math.round(currentData.rangePositionPercent)}% of Range
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden relative">
                  <div
                    className="bg-gradient-to-r from-amber-500 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${currentData.rangePositionPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Low: {formatCurrency(currentData.low52)}</span>
                  <span>High: {formatCurrency(currentData.high52)}</span>
                </div>
              </div>
            </div>

            {/* Quick Index Comparison Summary Table */}
            <div className="bg-[#0E1626] border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-lg font-bold text-white">Index Snapshot</h3>
                </div>
              </div>

              <div className="space-y-3">
                {data.map((idx, i) => (
                  <div
                    key={idx.ticker}
                    onClick={() => handleCardClick(i)}
                    className={`cursor-pointer flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      selectedIndex === i
                        ? "bg-slate-900 border-blue-500/60 ring-1 ring-blue-500/40"
                        : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-900"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{idx.name}</div>
                      <div className="text-[11px] text-slate-400">{formatCurrency(idx.current)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold ${getPercentTextColor(idx.percent52)}`}>
                        {idx.percent52Str}
                      </div>
                      <div className="text-[10px] text-slate-500">52W Drawdown</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full Comparison Table Section */}
        <div className="bg-[#0E1626] border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">Full Index Metrics Comparison Matrix</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Comprehensive overview across all 4 Nifty indexes computed from `docs/index.js` analytics engine.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Index Name</th>
                  <th className="py-3 px-4 font-semibold">Current Price</th>
                  <th className="py-3 px-4 font-semibold">52W High</th>
                  <th className="py-3 px-4 font-semibold">52W Low</th>
                  <th className="py-3 px-4 font-semibold">52W Drawdown</th>
                  <th className="py-3 px-4 font-semibold">ATH Peak</th>
                  <th className="py-3 px-4 font-semibold">ATH Drawdown</th>
                  <th className="py-3 px-4 font-semibold">5Y Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.map((idx, i) => (
                  <tr
                    key={idx.ticker}
                    onClick={() => handleCardClick(i)}
                    className={`cursor-pointer transition-colors ${
                      selectedIndex === i ? "bg-slate-800/60" : "hover:bg-slate-900/50"
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{idx.name}</div>
                      <div className="text-[10px] font-normal text-slate-500">{idx.ticker}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-white">
                      {formatCurrency(idx.current)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{formatCurrency(idx.high52)}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">{formatCurrency(idx.low52)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPercentColor(idx.percent52)}`}>
                        {idx.percent52Str}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">{formatCurrency(idx.highAllTime)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPercentColor(idx.percentAT)}`}>
                        {idx.percentATStr}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${getPercentColor(idx.percent5Y)}`}>
                        {idx.percent5YStr}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Floating Mobile Sticky Footer Bar */}
      <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-[#0B1120]/95 backdrop-blur-lg border border-blue-500/40 rounded-2xl p-3 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
            {currentData.shortName}
          </div>
          <div>
            <div className="text-xs font-bold text-white">{currentData.name}</div>
            <div className="text-[11px] text-slate-400 font-mono">
              {formatCurrency(currentData.current)} •{" "}
              <span className={getPercentTextColor(currentData.percent52)}>{currentData.percent52Str}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleCardClick(selectedIndex)}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all active:scale-95"
        >
          <span>View Charts</span>
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

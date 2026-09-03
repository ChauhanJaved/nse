import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export interface TargetIndex {
  name: string;
  ticker: string;
  shortName: string;
  description: string;
}

export const TARGETS: TargetIndex[] = [
  { name: "NIFTY 50", ticker: "^NSEI", shortName: "Nifty 50", description: "Top 50 Large-Cap companies" },
  { name: "NIFTY Next 50", ticker: "^NSMIDCP", shortName: "Next 50", description: "Top 50 companies after NIFTY 50" },
  { name: "NIFTY Midcap 150", ticker: "NIFTYMIDCAP150.NS", shortName: "Midcap 150", description: "150 Mid-Cap companies" },
  { name: "NIFTY SMLCAP 250", ticker: "NIFTYSMLCAP250.NS", shortName: "Smallcap 250", description: "250 Small-Cap companies" }
];

export interface YearlyBreakdownItem {
  year: number;
  label: string;
  startRound: number;
  endRound: number;
  diffY: number;
  percentY: number;
  percentYStr: string;
}

export interface HistoricalPoint {
  date: string;
  close: number;
  high?: number;
  low?: number;
}

export interface IndexDataResult {
  name: string;
  ticker: string;
  shortName: string;
  description: string;
  current: number;
  currentRound: number;
  highAllTime: number;
  highATRound: number;
  high52: number;
  high52Round: number;
  low52: number;
  low52Round: number;
  diff52: number;
  percent52: number;
  percent52Str: string;
  range52: number;
  range52Percent: number;
  range52Str: string;
  rangePositionPercent: number; // 0 to 100% position within 52W range
  diffAT: number;
  percentAT: number;
  percentATStr: string;
  p5PriceRound: number | null;
  diff5Y: number;
  percent5Y: number;
  percent5YStr: string;
  yearlyBreakdown: YearlyBreakdownItem[];
  historical5Y: HistoricalPoint[];
  error?: string;
}

export async function fetchSingleIndexData(target: TargetIndex): Promise<IndexDataResult> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    const [quote, chartResult] = await Promise.all([
      yahooFinance.quote(target.ticker),
      yahooFinance.chart(target.ticker, { period1: "1970-01-01", interval: "1d" })
    ]);

    if (!quote || quote.regularMarketPrice === undefined) {
      throw new Error(`Missing price data for ${target.name}`);
    }

    const current = quote.regularMarketPrice;
    const currentRound = Math.round(current);

    let high52 = current;
    let low52 = current;
    let highAllTime = current;

    const rawQuotes = chartResult?.quotes || [];
    const validQuotes = rawQuotes.filter(q => q.close !== null && q.close !== undefined);

    for (const q of rawQuotes) {
      if (q.high !== null && q.high !== undefined) {
        if (q.high > highAllTime) highAllTime = q.high;
      }
      if (q.date && new Date(q.date) >= startDate) {
        if (q.high !== null && q.high !== undefined && q.high > high52) high52 = q.high;
        if (q.low !== null && q.low !== undefined && q.low < low52) low52 = q.low;
      }
    }

    // 52-week High Calculations
    const high52Round = Math.round(high52);
    const diff52 = Math.abs(currentRound - high52Round);
    const divisor52 = Math.floor(high52Round / 100) || 1;
    const percent52 = (currentRound - high52Round) / divisor52;
    const percent52Str = (percent52 > 0 ? "+" : "") + percent52.toFixed(2) + "%";

    // 52-week Low & Range
    const low52Round = Math.round(low52);
    const range52 = high52Round - low52Round;
    const range52Percent = range52 / divisor52;
    const range52Str = range52Percent.toFixed(2) + "%";

    // Position within 52W Range (0% = at 52W low, 100% = at 52W high)
    const rangePositionPercent = range52 > 0
      ? Math.min(100, Math.max(0, ((currentRound - low52Round) / range52) * 100))
      : 50;

    // All-time High Calculations
    const highATRound = Math.round(highAllTime);
    const diffAT = Math.abs(currentRound - highATRound);
    const divisorAT = Math.floor(highATRound / 100) || 1;
    const percentAT = (currentRound - highATRound) / divisorAT;
    const percentATStr = (percentAT > 0 ? "+" : "") + percentAT.toFixed(2) + "%";

    // 5-Year Yearly Breakdown
    const yearlyPrices: Array<{ yearsAgo: number; priceRound: number; date: Date }> = [];
    if (validQuotes.length > 0) {
      const lastQuote = validQuotes[validQuotes.length - 1];
      const lastDate = new Date(lastQuote.date);

      for (let y = 0; y <= 5; y++) {
        if (y === 0) {
          yearlyPrices.push({
            yearsAgo: 0,
            priceRound: currentRound,
            date: lastDate
          });
        } else {
          const targetDate = new Date(lastDate);
          targetDate.setFullYear(targetDate.getFullYear() - y);

          let minDiff = Infinity;
          let closestQuote: typeof validQuotes[0] | null = null;
          for (const q of validQuotes) {
            const diff = Math.abs(new Date(q.date).getTime() - targetDate.getTime());
            if (diff < minDiff) {
              minDiff = diff;
              closestQuote = q;
            }
          }

          if (closestQuote && minDiff < 30 * 24 * 60 * 60 * 1000) {
            yearlyPrices.push({
              yearsAgo: y,
              priceRound: Math.round(closestQuote.close!),
              date: new Date(closestQuote.date)
            });
          }
        }
      }
    }

    const p5 = yearlyPrices.find(p => p.yearsAgo === 5);
    let percent5YStr = "N/A";
    let p5PriceRound: number | null = null;
    let diff5Y = 0;
    let percent5Y = 0;

    if (p5) {
      p5PriceRound = p5.priceRound;
      diff5Y = currentRound - p5PriceRound;
      const divisor5Y = Math.floor(p5PriceRound / 100) || 1;
      percent5Y = diff5Y / divisor5Y;
      percent5YStr = (percent5Y > 0 ? "+" : "") + percent5Y.toFixed(2) + "%";
    }

    const yearlyBreakdown: YearlyBreakdownItem[] = [];
    for (let y = 1; y <= 5; y++) {
      const startNode = yearlyPrices.find(p => p.yearsAgo === y);
      const endNode = yearlyPrices.find(p => p.yearsAgo === y - 1);

      if (startNode && endNode) {
        const startRound = startNode.priceRound;
        const endRound = endNode.priceRound;
        const diffY = endRound - startRound;
        const divisorY = Math.floor(startRound / 100) || 1;
        const percentY = diffY / divisorY;
        const percentYStr = (percentY > 0 ? "+" : "") + percentY.toFixed(2) + "%";
        const labelEnd = y - 1 === 0 ? "Last Close" : `${y - 1}Y Ago`;
        const label = `Year ${y} (${y}Y Ago → ${labelEnd})`;

        yearlyBreakdown.push({
          year: y,
          label,
          startRound,
          endRound,
          diffY,
          percentY,
          percentYStr
        });
      }
    }

    // Historical sampling for chart (last 5 years, sampled weekly/monthly)
    const fiveYearsAgoDate = new Date();
    fiveYearsAgoDate.setFullYear(fiveYearsAgoDate.getFullYear() - 5);

    const historical5Y: HistoricalPoint[] = validQuotes
      .filter(q => new Date(q.date) >= fiveYearsAgoDate)
      .filter((_, idx, arr) => idx % Math.max(1, Math.floor(arr.length / 80)) === 0 || idx === arr.length - 1)
      .map(q => ({
        date: new Date(q.date).toISOString().split("T")[0],
        close: Math.round(q.close!),
        high: q.high ? Math.round(q.high) : undefined,
        low: q.low ? Math.round(q.low) : undefined
      }));

    return {
      name: target.name,
      ticker: target.ticker,
      shortName: target.shortName,
      description: target.description,
      current,
      currentRound,
      highAllTime,
      highATRound,
      high52,
      high52Round,
      low52,
      low52Round,
      diff52,
      percent52,
      percent52Str,
      range52,
      range52Percent,
      range52Str,
      rangePositionPercent,
      diffAT,
      percentAT,
      percentATStr,
      p5PriceRound,
      diff5Y,
      percent5Y,
      percent5YStr,
      yearlyBreakdown,
      historical5Y
    };

  } catch (err: any) {
    return {
      name: target.name,
      ticker: target.ticker,
      shortName: target.shortName,
      description: target.description,
      current: 0,
      currentRound: 0,
      highAllTime: 0,
      highATRound: 0,
      high52: 0,
      high52Round: 0,
      low52: 0,
      low52Round: 0,
      diff52: 0,
      percent52: 0,
      percent52Str: "0.00%",
      range52: 0,
      range52Percent: 0,
      range52Str: "0.00%",
      rangePositionPercent: 50,
      diffAT: 0,
      percentAT: 0,
      percentATStr: "0.00%",
      p5PriceRound: null,
      diff5Y: 0,
      percent5Y: 0,
      percent5YStr: "0.00%",
      yearlyBreakdown: [],
      historical5Y: [],
      error: err.message || "Failed to fetch index data"
    };
  }
}

export async function fetchAllIndexesData(): Promise<IndexDataResult[]> {
  const results = await Promise.all(TARGETS.map(fetchSingleIndexData));
  return results;
}

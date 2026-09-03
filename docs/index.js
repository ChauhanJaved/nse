const YahooFinance = require("yahoo-finance2").default;
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const targets = [
    { name: "NIFTY 50", ticker: "^NSEI" },
    { name: "NIFTY Next 50", ticker: "^NSMIDCP" },
    { name: "NIFTY Midcap 150", ticker: "NIFTYMIDCAP150.NS" },
    { name: "NIFTY SMLCAP 250", ticker: "NIFTYSMLCAP250.NS" }
];

const formatVal = (val) => Math.round(val).toLocaleString("en-US");

async function main() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);

    const promises = targets.map(async (target) => {
        try {
            const [quote, chartResult] = await Promise.all([
                yahooFinance.quote(target.ticker),
                yahooFinance.chart(target.ticker, { period1: "1970-01-01", interval: "1d" })
            ]);

            if (!quote) {
                return { error: `Error: Could not retrieve quote for ${target.name} (${target.ticker})` };
            }

            const current = quote.regularMarketPrice;
            if (current === undefined) {
                return { error: `Error: Missing current price data for ${target.name} (${target.ticker})` };
            }

            // Calculate 52-week high/low and all-time high from historical chart quotes
            let high52 = current;
            let low52 = current;
            let highAllTime = current;

            if (chartResult && chartResult.quotes) {
                for (const q of chartResult.quotes) {
                    // All-time high
                    if (q.high !== null && q.high !== undefined) {
                        if (q.high > highAllTime) {
                            highAllTime = q.high;
                        }
                    }
                    // 52-week high & low
                    if (q.date >= startDate) {
                        if (q.high !== null && q.high !== undefined && q.high > high52) {
                            high52 = q.high;
                        }
                        if (q.low !== null && q.low !== undefined && q.low < low52) {
                            low52 = q.low;
                        }
                    }
                }
            }

            const currentRound = Math.round(current);

            // 52-week high calculations
            const high52Round = Math.round(high52);
            const diff52 = Math.abs(currentRound - high52Round);
            const divisor52 = Math.floor(high52Round / 100);
            const percent52 = divisor52 === 0 ? 0 : ((currentRound - high52Round) / divisor52);
            const percent52Str = (percent52 > 0 ? "+" : "") + percent52.toFixed(2) + "%";

            // 52-week low
            const low52Round = Math.round(low52);

            // 52-week range calculation
            const range52 = high52Round - low52Round;
            const range52Percent = divisor52 === 0 ? 0 : (range52 / divisor52);
            const range52Str = range52Percent.toFixed(2) + "%";

            // All-time high calculations
            const highATRound = Math.round(highAllTime);
            const diffAT = Math.abs(currentRound - highATRound);
            const divisorAT = Math.floor(highATRound / 100);
            const percentAT = divisorAT === 0 ? 0 : ((currentRound - highATRound) / divisorAT);
            const percentATStr = (percentAT > 0 ? "+" : "") + percentAT.toFixed(2) + "%";

            // 5-year growth calculation & yearly breakdown relative to last closing date
            const yearlyPrices = [];
            if (chartResult && chartResult.quotes && chartResult.quotes.length > 0) {
                const validQuotes = chartResult.quotes.filter(q => q.close !== null && q.close !== undefined);
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
                            let closestQuote = null;
                            for (const q of validQuotes) {
                                const diff = Math.abs(new Date(q.date) - targetDate);
                                if (diff < minDiff) {
                                    minDiff = diff;
                                    closestQuote = q;
                                }
                            }
                            // Max 30 days tolerance to avoid matching quotes if history is insufficient
                            if (closestQuote && minDiff < 30 * 24 * 60 * 60 * 1000) {
                                yearlyPrices.push({
                                    yearsAgo: y,
                                    priceRound: Math.round(closestQuote.close),
                                    date: new Date(closestQuote.date)
                                });
                            }
                        }
                    }
                }
            }

            const p0 = yearlyPrices.find(p => p.yearsAgo === 0);
            const p5 = yearlyPrices.find(p => p.yearsAgo === 5);

            let percent5YStr = "N/A";
            let price5YRound = 0;
            let diff5Y = 0;
            let divisor5Y = 0;

            if (p5) {
                price5YRound = p5.priceRound;
                diff5Y = currentRound - price5YRound;
                divisor5Y = Math.floor(price5YRound / 100);
                const percent5Y = divisor5Y === 0 ? 0 : (diff5Y / divisor5Y);
                percent5YStr = (percent5Y > 0 ? "+" : "") + percent5Y.toFixed(2) + "%";
            }

            const yearlyBreakdownLines = [];
            for (let y = 1; y <= 5; y++) {
                const startNode = yearlyPrices.find(p => p.yearsAgo === y);
                const endNode = yearlyPrices.find(p => p.yearsAgo === y - 1);

                if (startNode && endNode) {
                    const startRound = startNode.priceRound;
                    const endRound = endNode.priceRound;
                    const diffY = endRound - startRound;
                    const divisorY = Math.floor(startRound / 100);
                    const percentY = divisorY === 0 ? 0 : (diffY / divisorY);
                    const percentYStr = (percentY > 0 ? "+" : "") + percentY.toFixed(2) + "%";
                    const labelEnd = y - 1 === 0 ? "Last Close" : `${y - 1}Y Ago`;
                    const label = `  Year ${y} (${y}Y Ago -> ${labelEnd}):`.padEnd(34);
                    yearlyBreakdownLines.push(
                        `${label}${formatVal(startRound)} -> ${formatVal(endRound)} | Diff: ${formatVal(diffY)} / ${formatVal(divisorY)} = ${percentYStr}`
                    );
                }
            }

            const output = [
                `${target.name}`,
                `${"Current:".padEnd(16)}${formatVal(current)}`,
                `${"All-Time High :".padEnd(16)}${formatVal(highAllTime)}`,
                `${"52W High:".padEnd(16)}${formatVal(high52)}`,
                `${"52W Low:".padEnd(16)}${formatVal(low52)}`,
                ...(p5 ? [`${"5Y Ago Price:".padEnd(16)}${formatVal(p5.priceRound)}`] : []),
                `52W High Drawdown:  ${formatVal(high52Round)} | Diff: ${formatVal(diff52)} / ${formatVal(divisor52)} = ${percent52Str}`,
                `ATH Drawdown:       ${formatVal(highATRound)} | Diff: ${formatVal(diffAT)} / ${formatVal(divisorAT)} = ${percentATStr}`,
                `52W Range:          ${formatVal(high52Round)} - ${formatVal(low52Round)} = ${formatVal(range52)} / ${formatVal(divisor52)} = ${range52Str}`,
                ...(p5 ? [`5Y Growth:          ${formatVal(price5YRound)} -> ${formatVal(currentRound)} | Diff: ${formatVal(diff5Y)} / ${formatVal(divisor5Y)} = ${percent5YStr}`] : []),
                ...yearlyBreakdownLines,
                ``
            ].join("\n");

            const compactOutput = [
                `${target.name}`,
                `${"Current:".padEnd(16)}${formatVal(current)}`,
                `52W High Drawdown:  ${formatVal(high52Round)} | Diff: ${formatVal(diff52)} / ${formatVal(divisor52)} = ${percent52Str}`,
                ``
            ].join("\n");

            return { output, compactOutput };

        } catch (err) {
            return { error: `Error fetching data for ${target.name}: ${err.message || err}` };
        }
    });

    const results = await Promise.all(promises);

    // Detailed Output
    for (const r of results) {
        if (r.error) {
            console.error(r.error);
        } else {
            console.log(r.output);
        }
    }

    // Compact Summary Output
    console.log("------------------------------------------");
    console.log("Compact Summary (Docs Format):");
    console.log("------------------------------------------");
    for (const r of results) {
        if (!r.error && r.compactOutput) {
            console.log(r.compactOutput);
        }
    }
}

main();
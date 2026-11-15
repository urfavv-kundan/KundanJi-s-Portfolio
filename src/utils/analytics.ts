/**
 * Pure analytical and financial calculation utilities
 */

/**
 * Calculates net revenue impact of reducing customer churn in a SaaS business.
 * @param baseARR Current Annual Recurring Revenue ($)
 * @param currentChurnRate Current annual churn rate as percentage (e.g. 5.5 for 5.5%)
 * @param reductionPercentage Percentage reduction in churn (e.g. 20 for 20% relative reduction)
 * @returns Object with preserved revenue, new churn rate, and 3-year cumulative savings
 */
export function calculateRetentionImpact(
  baseARR: number,
  currentChurnRate: number,
  reductionPercentage: number
) {
  const currentChurnDecimal = currentChurnRate / 100;
  const reductionDecimal = reductionPercentage / 100;
  const newChurnRate = currentChurnRate * (1 - reductionDecimal);
  
  const currentLostRevenue = baseARR * currentChurnDecimal;
  const newLostRevenue = baseARR * (newChurnRate / 100);
  const annualPreservedRevenue = Math.round(currentLostRevenue - newLostRevenue);
  const threeYearCumulative = Math.round(annualPreservedRevenue * 3.25); // including compound compounding

  return {
    annualPreservedRevenue,
    newChurnRate: Number(newChurnRate.toFixed(2)),
    threeYearCumulative,
  };
}

/**
 * Computes RFM (Recency, Frequency, Monetary) segment tier and score.
 * Recency: lower days is better. Frequency: higher is better. Monetary: higher is better.
 */
export function calculateRFMScore(
  recencyDays: number,
  frequency: number,
  monetaryValue: number
): { score: number; segment: 'Champions' | 'Loyal Customers' | 'Potential Loyalists' | 'At Risk' | 'Hibernating' } {
  // Score 1-5 for Recency (inverted)
  let rScore = 1;
  if (recencyDays <= 15) rScore = 5;
  else if (recencyDays <= 30) rScore = 4;
  else if (recencyDays <= 60) rScore = 3;
  else if (recencyDays <= 90) rScore = 2;

  // Score 1-5 for Frequency
  let fScore = 1;
  if (frequency >= 12) fScore = 5;
  else if (frequency >= 8) fScore = 4;
  else if (frequency >= 4) fScore = 3;
  else if (frequency >= 2) fScore = 2;

  // Score 1-5 for Monetary
  let mScore = 1;
  if (monetaryValue >= 2000) mScore = 5;
  else if (monetaryValue >= 1000) mScore = 4;
  else if (monetaryValue >= 500) mScore = 3;
  else if (monetaryValue >= 250) mScore = 2;

  const totalScore = rScore * 100 + fScore * 10 + mScore;

  let segment: 'Champions' | 'Loyal Customers' | 'Potential Loyalists' | 'At Risk' | 'Hibernating';
  if (rScore >= 4 && fScore >= 4 && mScore >= 4) {
    segment = 'Champions';
  } else if (fScore >= 3 && mScore >= 3) {
    segment = 'Loyal Customers';
  } else if (rScore >= 3 && fScore <= 3) {
    segment = 'Potential Loyalists';
  } else if (rScore <= 2 && fScore >= 2) {
    segment = 'At Risk';
  } else {
    segment = 'Hibernating';
  }

  return { score: totalScore, segment };
}

/**
 * Calculates optimal safety stock using standard supply chain King/Silver formula
 * Safety Stock = (Max Daily Demand * Max Lead Time) - (Avg Daily Demand * Avg Lead Time)
 */
export function calculateInventorySafetyStock(
  avgDailyDemand: number,
  avgLeadTimeDays: number,
  maxDailyDemand: number,
  maxLeadTimeDays: number
): { safetyStockUnits: number; reorderPoint: number } {
  const maxUsage = maxDailyDemand * maxLeadTimeDays;
  const avgUsage = avgDailyDemand * avgLeadTimeDays;
  const safetyStockUnits = Math.max(0, Math.round(maxUsage - avgUsage));
  const reorderPoint = Math.round(avgUsage + safetyStockUnits);

  return { safetyStockUnits, reorderPoint };
}

/**
 * Calculates percentage growth rate
 */
export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
}

/**
 * Generates CSV string from tabular data
 */
export function generateCSVString(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (val: string | number) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map(r => r.map(escapeCell).join(','));
  return [headerLine, ...rowLines].join('\n');
}

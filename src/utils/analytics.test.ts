import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRetentionImpact,
  calculateRFMScore,
  calculateInventorySafetyStock,
  calculateGrowthRate,
  generateCSVString,
} from './analytics';

test('calculateRetentionImpact computes annual preserved revenue accurately', () => {
  // $10M ARR, 10% churn rate, 20% churn reduction
  // Current loss: $1M. New churn: 8%. New loss: $800k. Preserved: $200k.
  const result = calculateRetentionImpact(10_000_000, 10, 20);
  assert.equal(result.annualPreservedRevenue, 200_000);
  assert.equal(result.newChurnRate, 8);
  assert.equal(result.threeYearCumulative, 650_000);
});

test('calculateRFMScore identifies Champions and At Risk customers correctly', () => {
  // High recency (10 days), frequent (15 orders), high spend ($2500) -> Champions
  const champion = calculateRFMScore(10, 15, 2500);
  assert.equal(champion.segment, 'Champions');
  assert.equal(champion.score, 555);

  // Inactive (120 days), moderate frequency (4 orders), low spend ($100) -> At Risk or Hibernating
  const atRisk = calculateRFMScore(120, 4, 300);
  assert.equal(atRisk.segment, 'At Risk');
});

test('calculateInventorySafetyStock calculates correct buffer and reorder point', () => {
  // Avg demand: 20 units/day, Avg lead time: 5 days
  // Max demand: 35 units/day, Max lead time: 8 days
  // Max usage = 35 * 8 = 280
  // Avg usage = 20 * 5 = 100
  // Safety stock = 280 - 100 = 180 units
  // Reorder point = 100 + 180 = 280 units
  const result = calculateInventorySafetyStock(20, 5, 35, 8);
  assert.equal(result.safetyStockUnits, 180);
  assert.equal(result.reorderPoint, 280);
});

test('calculateGrowthRate computes percentage increase and decrease', () => {
  assert.equal(calculateGrowthRate(120, 100), 20);
  assert.equal(calculateGrowthRate(80, 100), -20);
  assert.equal(calculateGrowthRate(100, 0), 0);
});

test('generateCSVString produces properly escaped CSV rows', () => {
  const headers = ['SKU', 'Product Name', 'Price'];
  const rows = [
    ['A101', 'Smart Sensor, Type "A"', 45.5],
    ['B202', 'Widget Pro', 12.0],
  ];
  const csv = generateCSVString(headers, rows);
  assert.ok(csv.includes('"Smart Sensor, Type ""A"""'));
  assert.ok(csv.startsWith('SKU,Product Name,Price\n'));
});

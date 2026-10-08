export const significantWeightDropPercent = 10;
export const notableWeightChangePercent = 3;

export type WeightChangeTone = "positive" | "neutral" | "decrease";

export function weightChangePercent(
  previousWeightGram: number,
  currentWeightGram: number,
): number {
  if (previousWeightGram <= 0) return 0;
  return ((currentWeightGram - previousWeightGram) / previousWeightGram) * 100;
}

export function isSignificantWeightDrop(
  previousWeightGram: number,
  currentWeightGram: number,
): boolean {
  return (
    weightChangePercent(previousWeightGram, currentWeightGram) <=
    -significantWeightDropPercent
  );
}

export function weightChangeGram(
  previousWeightGram: number,
  currentWeightGram: number,
): number {
  return currentWeightGram - previousWeightGram;
}

const millisecondsPerDay = 1000 * 60 * 60 * 24;

export function measurementIntervalDays(
  previousMeasuredAt: string,
  currentMeasuredAt: string,
): number | undefined {
  const previous = Date.parse(`${previousMeasuredAt}T00:00:00.000Z`);
  const current = Date.parse(`${currentMeasuredAt}T00:00:00.000Z`);
  const difference = Math.round((current - previous) / millisecondsPerDay);
  return Number.isFinite(difference) && difference > 0 ? difference : undefined;
}

export function weeklyWeightChangeGram(
  previousWeightGram: number,
  currentWeightGram: number,
  intervalDays: number | undefined,
): number | undefined {
  if (!intervalDays || intervalDays <= 0) return undefined;
  return (
    (weightChangeGram(previousWeightGram, currentWeightGram) * 7) / intervalDays
  );
}

export function weightChangeTone(
  previousWeightGram: number,
  currentWeightGram: number,
): WeightChangeTone {
  const change = weightChangePercent(previousWeightGram, currentWeightGram);
  if (change >= notableWeightChangePercent) return "positive";
  if (change <= -notableWeightChangePercent) return "decrease";
  return "neutral";
}

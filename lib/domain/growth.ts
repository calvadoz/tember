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

export function weightChangeTone(
  previousWeightGram: number,
  currentWeightGram: number,
): WeightChangeTone {
  const change = weightChangePercent(previousWeightGram, currentWeightGram);
  if (change >= notableWeightChangePercent) return "positive";
  if (change <= -notableWeightChangePercent) return "decrease";
  return "neutral";
}

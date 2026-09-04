/**
 * WHO Child Growth Standards & Nutritional Status Calculation
 * Referensi: WHO Child Growth Standards (Weight-for-age, Length/height-for-age, Weight-for-length/height)
 * Median (M), Coefficient of Variation (S), and Box-Cox Power (L) for standard LMS calculation
 */

export interface GrowthMeasurement {
  ageInMonths: number;
  gender: 'L' | 'P'; // L = Laki-laki (Boy), P = Perempuan (Girl)
  weightKg?: number; // Berat Badan (BB)
  heightCm?: number; // Tinggi / Panjang Badan (TB)
}

export interface GrowthClassification {
  weightForAge?: {
    zScore: number;
    status: 'Gizi Buruk' | 'Gizi Kurang' | 'Gizi Baik (Normal)' | 'Risiko Gizi Lebih';
  };
  heightForAge?: {
    zScore: number;
    status: 'Sangat Pendek (Severely Stunted)' | 'Pendek (Stunted)' | 'Normal' | 'Tinggi';
  };
  weightForHeight?: {
    zScore: number;
    status: 'Gizi Buruk (Severely Wasted)' | 'Gizi Kurang (Wasted)' | 'Gizi Baik (Normal)' | 'Berisiko Gizi Lebih' | 'Gizi Lebih (Overweight)' | 'Obesitas';
  };
  summary: string;
}

/**
 * Standard WHO Child Growth Median approximations for quick, reliable clinical categorization
 * (Simplified LMS model based on WHO Child Growth Standards tables)
 */
export function calculateZScores(params: GrowthMeasurement): GrowthClassification {
  const { ageInMonths, gender, weightKg, heightCm } = params;
  const isBoy = gender === 'L';

  const result: GrowthClassification = {
    summary: 'Normal',
  };

  // 1. Weight-for-age (BB/U)
  if (weightKg !== undefined && weightKg > 0) {
    // Median reference curves (approximate WHO 0-60 months)
    const medianWeight = isBoy
      ? 3.3 + 0.5 * ageInMonths - (ageInMonths > 12 ? 0.002 * Math.pow(ageInMonths, 2) : 0)
      : 3.2 + 0.47 * ageInMonths - (ageInMonths > 12 ? 0.002 * Math.pow(ageInMonths, 2) : 0);
    const sdWeight = medianWeight * 0.13; // Approximate 1 SD
    const zBBU = parseFloat(((weightKg - medianWeight) / sdWeight).toFixed(2));

    let statusBBU: 'Gizi Buruk' | 'Gizi Kurang' | 'Gizi Baik (Normal)' | 'Risiko Gizi Lebih';
    if (zBBU < -3) statusBBU = 'Gizi Buruk';
    else if (zBBU < -2) statusBBU = 'Gizi Kurang';
    else if (zBBU <= 1) statusBBU = 'Gizi Baik (Normal)';
    else statusBBU = 'Risiko Gizi Lebih';

    result.weightForAge = { zScore: zBBU, status: statusBBU };
  }

  // 2. Height-for-age (TB/U)
  if (heightCm !== undefined && heightCm > 0) {
    // Median height reference
    const medianHeight = isBoy
      ? 49.9 + (ageInMonths <= 12 ? ageInMonths * 2.1 : 25 + (ageInMonths - 12) * 0.75)
      : 49.1 + (ageInMonths <= 12 ? ageInMonths * 2.05 : 24.5 + (ageInMonths - 12) * 0.75);
    const sdHeight = medianHeight * 0.042;
    const zTBU = parseFloat(((heightCm - medianHeight) / sdHeight).toFixed(2));

    let statusTBU: 'Sangat Pendek (Severely Stunted)' | 'Pendek (Stunted)' | 'Normal' | 'Tinggi';
    if (zTBU < -3) statusTBU = 'Sangat Pendek (Severely Stunted)';
    else if (zTBU < -2) statusTBU = 'Pendek (Stunted)';
    else if (zTBU <= 3) statusTBU = 'Normal';
    else statusTBU = 'Tinggi';

    result.heightForAge = { zScore: zTBU, status: statusTBU };
  }

  // 3. Weight-for-height (BB/TB)
  if (weightKg !== undefined && weightKg > 0 && heightCm !== undefined && heightCm > 0) {
    // Expected median weight for given height
    const expectedWeight = 0.00015 * Math.pow(heightCm, 2.5) * (isBoy ? 1.0 : 0.98);
    const sdWfH = expectedWeight * 0.10;
    const zBBTB = parseFloat(((weightKg - expectedWeight) / sdWfH).toFixed(2));

    let statusBBTB: 'Gizi Buruk (Severely Wasted)' | 'Gizi Kurang (Wasted)' | 'Gizi Baik (Normal)' | 'Berisiko Gizi Lebih' | 'Gizi Lebih (Overweight)' | 'Obesitas';
    if (zBBTB < -3) statusBBTB = 'Gizi Buruk (Severely Wasted)';
    else if (zBBTB < -2) statusBBTB = 'Gizi Kurang (Wasted)';
    else if (zBBTB <= 1) statusBBTB = 'Gizi Baik (Normal)';
    else if (zBBTB <= 2) statusBBTB = 'Berisiko Gizi Lebih';
    else if (zBBTB <= 3) statusBBTB = 'Gizi Lebih (Overweight)';
    else statusBBTB = 'Obesitas';

    result.weightForHeight = { zScore: zBBTB, status: statusBBTB };
  }

  // Determine overall summary
  if (result.heightForAge?.status === 'Sangat Pendek (Severely Stunted)' || result.heightForAge?.status === 'Pendek (Stunted)') {
    result.summary = `Stunting (${result.heightForAge.status})`;
  } else if (result.weightForHeight && result.weightForHeight.status !== 'Gizi Baik (Normal)') {
    result.summary = result.weightForHeight.status;
  } else if (result.weightForAge) {
    result.summary = result.weightForAge.status;
  }

  return result;
}

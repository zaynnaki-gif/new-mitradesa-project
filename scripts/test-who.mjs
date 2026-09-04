import { calculateZScores } from '../apps/api/src/utils/who-growth.js';

// Test 1: Boy 12 months, normal weight & height
const t1 = calculateZScores({ ageInMonths: 12, gender: 'L', weightKg: 9.6, heightCm: 75.7 });
console.log('Test 1 (Normal):', JSON.stringify(t1, null, 2));

// Test 2: Boy 24 months, severely stunted (height 76cm at 24 months, expected >87cm)
const t2 = calculateZScores({ ageInMonths: 24, gender: 'L', weightKg: 10.0, heightCm: 76.0 });
console.log('Test 2 (Stunting):', JSON.stringify(t2, null, 2));

// Test 3: Girl 6 months, wasted (low weight for length)
const t3 = calculateZScores({ ageInMonths: 6, gender: 'P', weightKg: 4.8, heightCm: 65.0 });
console.log('Test 3 (Wasted):', JSON.stringify(t3, null, 2));

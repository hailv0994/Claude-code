import type { MaterialGrade } from '../../types';

export const MATERIAL_GRADES: MaterialGrade[] = [
  // Carbon Steel
  { id: 'A36', name: 'ASTM A36', type: 'carbon_steel', pNumber: '1',
    C: 0.26, Mn: 0.80, Si: 0.15, Cr: 0, Ni: 0, Mo: 0, V: 0, Cu: 0.2,
    ceIIW: 0.40, cet: 0.28, yieldStrength: 250, tensileStrength: 400 },
  { id: 'A572_50', name: 'ASTM A572 Gr.50', type: 'carbon_steel', pNumber: '1',
    C: 0.23, Mn: 1.35, Si: 0.40, Cr: 0, Ni: 0, Mo: 0, V: 0.015, Cu: 0,
    ceIIW: 0.43, cet: 0.30, yieldStrength: 345, tensileStrength: 450 },
  { id: 'SS400', name: 'JIS SS400', type: 'carbon_steel', pNumber: '1',
    C: 0.21, Mn: 1.00, Si: 0.35, Cr: 0, Ni: 0, Mo: 0, V: 0, Cu: 0,
    ceIIW: 0.38, cet: 0.26, yieldStrength: 245, tensileStrength: 400 },
  { id: 'SM490', name: 'JIS SM490', type: 'carbon_steel', pNumber: '1',
    C: 0.20, Mn: 1.40, Si: 0.55, Cr: 0, Ni: 0, Mo: 0, V: 0, Cu: 0,
    ceIIW: 0.44, cet: 0.31, yieldStrength: 325, tensileStrength: 490 },
  { id: 'SB410', name: 'JIS SB410', type: 'carbon_steel', pNumber: '1',
    C: 0.24, Mn: 0.90, Si: 0.35, Cr: 0, Ni: 0, Mo: 0, V: 0, Cu: 0,
    ceIIW: 0.39, cet: 0.27, yieldStrength: 245, tensileStrength: 410 },
  { id: 'A516_70', name: 'ASTM A516 Gr.70', type: 'carbon_steel', pNumber: '1',
    C: 0.28, Mn: 1.20, Si: 0.45, Cr: 0, Ni: 0, Mo: 0, V: 0, Cu: 0,
    ceIIW: 0.48, cet: 0.33, yieldStrength: 260, tensileStrength: 485 },
  // Low Alloy Steel
  { id: 'A514', name: 'ASTM A514 (HY80)', type: 'low_alloy', pNumber: '11A',
    C: 0.21, Mn: 0.80, Si: 0.50, Cr: 0.5, Ni: 1.0, Mo: 0.40, V: 0.05, Cu: 0.25,
    ceIIW: 0.62, cet: 0.42, yieldStrength: 690, tensileStrength: 760 },
  { id: 'A709_100W', name: 'ASTM A709 Gr.100W', type: 'low_alloy', pNumber: '11A',
    C: 0.19, Mn: 0.90, Si: 0.50, Cr: 0.4, Ni: 1.20, Mo: 0.55, V: 0.06, Cu: 0.30,
    ceIIW: 0.63, cet: 0.44, yieldStrength: 690, tensileStrength: 760 },
  { id: 'SMA490', name: 'JIS SMA490 (Weathering)', type: 'low_alloy', pNumber: '1',
    C: 0.17, Mn: 0.60, Si: 0.65, Cr: 0.65, Ni: 0.65, Mo: 0, V: 0, Cu: 0.35,
    ceIIW: 0.41, cet: 0.29, yieldStrength: 345, tensileStrength: 490 },
  // Stainless Steel
  { id: 'SS304', name: 'AISI 304 / SUS304', type: 'stainless_austenitic', pNumber: '8',
    C: 0.08, Mn: 2.0, Si: 1.0, Cr: 18.0, Ni: 8.0, Mo: 0, V: 0, Cu: 0,
    ceIIW: 0, cet: 0, yieldStrength: 205, tensileStrength: 515 },
  { id: 'SS316L', name: 'AISI 316L / SUS316L', type: 'stainless_austenitic', pNumber: '8',
    C: 0.03, Mn: 2.0, Si: 1.0, Cr: 17.0, Ni: 12.0, Mo: 2.5, V: 0, Cu: 0,
    ceIIW: 0, cet: 0, yieldStrength: 170, tensileStrength: 485 },
  // Aluminum
  { id: 'A6061_T6', name: '6061-T6 Aluminum', type: 'aluminum', pNumber: '22',
    C: 0, Mn: 0.15, Si: 0.6, Cr: 0.19, Ni: 0, Mo: 0, V: 0, Cu: 0.28,
    ceIIW: 0, cet: 0, yieldStrength: 276, tensileStrength: 310 },
  { id: 'A5083', name: '5083 Aluminum', type: 'aluminum', pNumber: '22',
    C: 0, Mn: 0.7, Si: 0.4, Cr: 0.15, Ni: 0, Mo: 0, V: 0, Cu: 0.1,
    ceIIW: 0, cet: 0, yieldStrength: 228, tensileStrength: 317 },
];

export function getGradeById(id: string): MaterialGrade | undefined {
  return MATERIAL_GRADES.find(g => g.id === id);
}

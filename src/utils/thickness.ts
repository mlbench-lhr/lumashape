export type Unit = 'mm' | 'inches';

const OPTIONS: Record<Unit, number[]> = {
  inches: [0.5, 1.0, 1.25, 2.0],
  mm: [12.7, 25.4, 31.75, 50.8],
};

const round3 = (n: number) => Math.round(n * 1000) / 1000;

const labelFor = (value: number, unit: Unit) =>
  unit === 'mm' ? String(value) : value.toFixed(2);

export const getThicknessOptions = (unit: Unit) =>
  OPTIONS[unit].map((v) => ({ value: v, label: labelFor(v, unit) }));

export const defaultThicknessForUnit = (unit: Unit) =>
  unit === 'mm' ? 20 : 1.25;

export const isAllowedThickness = (value: number, unit: Unit) => {
  if (!Number.isFinite(value)) return false;
  return OPTIONS[unit].some((v) => Math.abs(v - value) < 0.001);
};

const closestAllowedThickness = (value: number, unit: Unit) => {
  const opts = OPTIONS[unit];
  let best = opts[0];
  let bestDist = Math.abs(best - value);

  for (let i = 1; i < opts.length; i++) {
    const d = Math.abs(opts[i] - value);
    if (d < bestDist) {
      best = opts[i];
      bestDist = d;
    }
  }
  return best;
};

const mmToInches = (mm: number) => mm / 25.4;
const inchesToMm = (inches: number) => inches * 25.4;

export const coerceThicknessBetweenUnits = (
  value: number,
  from: Unit,
  to: Unit
) => {
  if (!Number.isFinite(value) || !(value > 0)) return defaultThicknessForUnit(to);

  const inches = from === 'mm' ? mmToInches(value) : value;
  const converted = to === 'mm' ? inchesToMm(inches) : inches;

  return closestAllowedThickness(converted, to);
};

export const coerceThicknessFromPersisted = (value: number, unit: Unit) => {
  if (!Number.isFinite(value) || !(value > 0)) return defaultThicknessForUnit(unit);

  if (isAllowedThickness(value, unit)) return value;

  const other: Unit = unit === 'mm' ? 'inches' : 'mm';
  if (isAllowedThickness(value, other)) {
    return coerceThicknessBetweenUnits(value, other, unit);
  }

  if (unit === 'mm') {
    return value <= 5
      ? coerceThicknessBetweenUnits(value, 'inches', 'mm')
      : closestAllowedThickness(value, 'mm');
  }

  return value > 10
    ? coerceThicknessBetweenUnits(value, 'mm', 'inches')
    : closestAllowedThickness(value, 'inches');
};

export const normalizeThicknessToInches = (value: number, unit: Unit) => {
  if (!Number.isFinite(value) || !(value > 0)) return 0;

  if (unit === 'mm') {
    const inches = value > 10 ? mmToInches(value) : value;
    return round3(inches);
  }

  const inches = value > 10 ? mmToInches(value) : value;
  return round3(inches);
};
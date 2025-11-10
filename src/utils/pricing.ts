/**
 * Pricing utilities for calculating layout costs based on volume
 */

export interface LayoutDimensions {
  width: number;
  height: number;
  thickness: number;
  unit: 'mm' | 'inches';
}

/**
 * Convert dimensions to inches
 */
const convertToInches = (value: number, unit: 'mm' | 'inches'): number => {
  return unit === 'mm' ? value / 25.4 : value;
};

/**
 * Calculate volume in cubic inches
 */
export const calculateVolumeInCubicInches = (dimensions: LayoutDimensions): number => {
  const widthInches = convertToInches(dimensions.width, dimensions.unit);
  const heightInches = convertToInches(dimensions.height, dimensions.unit);
  const thicknessInches = convertToInches(dimensions.thickness, dimensions.unit);
  
  return widthInches * heightInches * thicknessInches;
};

/**
 * Calculate price based on volume at $0.10 per cubic inch
 */
export const calculateLayoutPrice = (dimensions: LayoutDimensions): number => {
  const volumeCubicInches = calculateVolumeInCubicInches(dimensions);
  const pricePerCubicInch = 0.10;
  
  // Round to 2 decimal places
  return Math.round(volumeCubicInches * pricePerCubicInch * 100) / 100;
};

/**
 * Calculate price from layout data structure
 */
export const calculatePriceFromLayoutData = (layoutData: {
  canvas: {
    width: number;
    height: number;
    unit: 'mm' | 'inches';
    thickness: number;
  };
  // NEW: optionally include tools for extras computation
  tools?: Array<{ isText?: boolean }>;
}): number => {
  const base = calculateLayoutPrice({
    width: layoutData.canvas.width,
    height: layoutData.canvas.height,
    thickness: layoutData.canvas.thickness,
    unit: layoutData.canvas.unit,
  });

  // NEW: $12 flat engraving fee if any text tool exists
  const hasText = Array.isArray(layoutData.tools) && layoutData.tools.some(t => t?.isText);
  const engravingFee = hasText ? 12 : 0;

  return Math.round((base + engravingFee) * 100) / 100;
};
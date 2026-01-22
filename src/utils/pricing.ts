import { normalizeThicknessToInches } from '../utils/thickness';

export interface LayoutDimensions {
  width: number;
  height: number;
  thickness: number;
  unit: 'mm' | 'inches';
}

export interface PricingParameters {
  materialCostPerIn3: number;
  engravingFlatFee: number;
  designTimeFlatFee: number;
  wasteFactor: number;
  machineTimeFlatFee: number;
  consumablesFlatFee: number;
  shippingFlatFee: number;
  packagingCostPerOrder: number;
  kaiserMarginPct: number;
  lumashapeMarginPct: number;
}

export const DEFAULT_PRICING: PricingParameters = {
  materialCostPerIn3: 0.04,
  engravingFlatFee: 20.0,
  designTimeFlatFee: 15.0,
  wasteFactor: 1,
  machineTimeFlatFee: 16.0,
  consumablesFlatFee: 1.6,
  shippingFlatFee: 7.5,
  packagingCostPerOrder: 0,
  kaiserMarginPct: 0.55,
  lumashapeMarginPct: 0.25,
};


const toInches = (value: number, unit: 'mm' | 'inches') => (unit === 'mm' ? value / 25.4 : value);

export const calculateVolumeInCubicInches = (dimensions: LayoutDimensions): number => {
  const w = toInches(dimensions.width, dimensions.unit);
  const h = toInches(dimensions.height, dimensions.unit);
  const t = normalizeThicknessToInches(dimensions.thickness, dimensions.unit);
  return w * h * t;
};

export const calculateUnitMaterialCostWithWaste = (
  dims: LayoutDimensions,
  params: PricingParameters = DEFAULT_PRICING
): number => {
  const volumeIn3 = calculateVolumeInCubicInches(dims);
  const materialCost = volumeIn3 * params.materialCostPerIn3;
  return Math.round(materialCost * 100) / 100;
};

export const calculatePriceFromLayoutData = (layoutData: {
  canvas: { width: number; height: number; unit: 'mm' | 'inches'; thickness: number };
  tools?: Array<{ isText?: boolean }>;
}): number => {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const dims: LayoutDimensions = {
    width: layoutData.canvas.width,
    height: layoutData.canvas.height,
    thickness: layoutData.canvas.thickness,
    unit: layoutData.canvas.unit,
  };

  const unitVolumeIn3 = calculateVolumeInCubicInches(dims);
  const unitMaterialCost = round2(unitVolumeIn3 * DEFAULT_PRICING.materialCostPerIn3);

  const hasTextEngraving = Array.isArray(layoutData.tools) && layoutData.tools.some((t) => t?.isText);
  const engravingFee = hasTextEngraving ? DEFAULT_PRICING.engravingFlatFee : 0;

  const baseFees =
    DEFAULT_PRICING.designTimeFlatFee +
    DEFAULT_PRICING.machineTimeFlatFee +
    DEFAULT_PRICING.consumablesFlatFee +
    DEFAULT_PRICING.shippingFlatFee;

  const baseCostBeforeMargins = round2(unitMaterialCost + baseFees + engravingFee);
  const kaiserPayout = round2(baseCostBeforeMargins * (1 + DEFAULT_PRICING.kaiserMarginPct));
  const lumashapePayout = round2(kaiserPayout * DEFAULT_PRICING.lumashapeMarginPct);

  return round2(kaiserPayout + lumashapePayout);
};

export interface MinimalCartItem {
  id: string;
  name: string;
  quantity: number;
  layoutData?: {
    canvas: { width: number; height: number; unit: 'mm' | 'inches'; thickness: number; materialColor?: string };
    tools?: Array<{ isText?: boolean }>;
  };
}

export interface OrderPricingResult {
  items: Array<{
    id: string;
    name: string;
    qty: number;
    unitVolumeIn3: number;
    unitMaterialCostWithWaste: number;
    lineMaterialCostWithWaste: number;
    hasTextEngraving: boolean;
  }>;
  totals: {
    materialVolumeIn3: number;
    materialCost: number;
    materialCostWithWaste: number;
    engravingFee: number;
    designTimeCost: number;
    machineTimeCost: number;
    consumablesCost: number;
    packagingCost: number;
    totalCostBeforeMargins: number;
    kaiserPayout: number;
    lumashapePayout: number;
    customerSubtotal: number;
    discountPct: number;
    discountAmount: number;
    customerSubtotalAfterDiscount: number;
    shippingCost: number;
    customerTotal: number;
  };
  parameters: PricingParameters;
}

const itemHasText = (item: MinimalCartItem) =>
  Array.isArray(item.layoutData?.tools) && item.layoutData!.tools!.some((t) => t?.isText);

export const calculateOrderPricing = (
  items: MinimalCartItem[],
  params: PricingParameters = DEFAULT_PRICING
): OrderPricingResult => {
  const round2 = (n: number) => Math.round(n * 100) / 100;

  const computedItems = items.map((i) => {
    const canvas = i.layoutData?.canvas;
    const dims: LayoutDimensions = {
      width: canvas?.width || 0,
      height: canvas?.height || 0,
      thickness: canvas?.thickness || 0,
      unit: canvas?.unit || 'inches',
    };
    const volumeIn3 = calculateVolumeInCubicInches(dims);
    const unitMaterialCost = round2(volumeIn3 * params.materialCostPerIn3);

    return {
      id: i.id,
      name: i.name,
      qty: i.quantity,
      unitVolumeIn3: round2(volumeIn3),
      unitMaterialCostWithWaste: unitMaterialCost,
      lineMaterialCostWithWaste: round2(unitMaterialCost * i.quantity),
      hasTextEngraving: itemHasText(i),
    };
  });

  const hasItems = computedItems.length > 0;

  const materialVolumeIn3 = round2(computedItems.reduce((s, x) => s + x.unitVolumeIn3 * x.qty, 0));

  const materialCost = round2(materialVolumeIn3 * params.materialCostPerIn3);
  const materialCostWithWaste = materialCost;

  const engravingFee = round2(
    computedItems.reduce((sum, itm) => sum + (itm.hasTextEngraving ? params.engravingFlatFee : 0), 0)
  );

  const totalLineItems = computedItems.reduce((sum, itm) => sum + itm.qty, 0);

  const designTimeCost = hasItems ? round2(params.designTimeFlatFee * totalLineItems) : 0;
  const machineTimeCost = hasItems ? round2(params.machineTimeFlatFee * totalLineItems) : 0;
  const consumablesCost = hasItems ? round2(params.consumablesFlatFee * totalLineItems) : 0;
  const packagingCost = 0;
  const shippingCost = hasItems ? round2(params.shippingFlatFee * totalLineItems) : 0;

  const totalCostBeforeMargins = round2(
    materialCostWithWaste + engravingFee + designTimeCost + machineTimeCost + consumablesCost + shippingCost
  );

  const kaiserPayout = round2(totalCostBeforeMargins * (1 + params.kaiserMarginPct));
  const lumashapePayout = round2(kaiserPayout * params.lumashapeMarginPct);
  const customerSubtotal = round2(kaiserPayout + lumashapePayout);

  const lineItemCount = computedItems.length;
  const discountPct = lineItemCount >= 10 ? 0.15 : lineItemCount >= 5 ? 0.1 : lineItemCount >= 2 ? 0.05 : 0;
  const discountAmount = round2(customerSubtotal * discountPct);
  const customerSubtotalAfterDiscount = round2(customerSubtotal - discountAmount);

  const customerTotal = round2(customerSubtotalAfterDiscount);

  return {
    items: computedItems,
    totals: {
      materialVolumeIn3,
      materialCost,
      materialCostWithWaste,
      engravingFee,
      designTimeCost,
      machineTimeCost,
      consumablesCost,
      packagingCost,
      totalCostBeforeMargins,
      kaiserPayout,
      lumashapePayout,
      customerSubtotal,
      discountPct,
      discountAmount,
      customerSubtotalAfterDiscount,
      shippingCost,
      customerTotal,
    },
    parameters: params,
  };
};

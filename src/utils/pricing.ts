export interface LayoutDimensions {
  width: number;
  height: number;
  thickness: number;
  unit: 'mm' | 'inches';
}

export interface PricingParameters {
  materialCostPerIn3: number;
  engravingFlatFee: number;
  wasteFactor: number;
  consumablesCostPerInsert: number;
  packagingCostPerOrder: number;
  kaiserMarginPct: number;
  lumashapeMarginPct: number;
}

export const DEFAULT_PRICING: PricingParameters = {
  materialCostPerIn3: 0.10,
  engravingFlatFee: 20.0,
  wasteFactor: 1.10,
  consumablesCostPerInsert: 0.50,
  packagingCostPerOrder: 3.0,
  kaiserMarginPct: 0.50,
  lumashapeMarginPct: 0.20,
};

const toInches = (value: number, unit: 'mm' | 'inches') => (unit === 'mm' ? value / 25.4 : value);

const normalizeThicknessInches = (value: number) => {
  if (!(value > 0)) return value;
  return value > 10 ? value / 25.4 : value;
};

export const calculateVolumeInCubicInches = (dimensions: LayoutDimensions): number => {
  const w = toInches(dimensions.width, dimensions.unit);
  const h = toInches(dimensions.height, dimensions.unit);
  const t = normalizeThicknessInches(dimensions.thickness);
  return w * h * t;
};

export const calculateUnitMaterialCostWithWaste = (
  dims: LayoutDimensions,
  params: PricingParameters = DEFAULT_PRICING
): number => {
  const volume = calculateVolumeInCubicInches(dims);
  const materialCost = volume * params.materialCostPerIn3;
  return Math.round(materialCost * params.wasteFactor * 100) / 100;
};

export const calculatePriceFromLayoutData = (layoutData: {
  canvas: { width: number; height: number; unit: 'mm' | 'inches'; thickness: number };
}): number => {
  return calculateUnitMaterialCostWithWaste(
    {
      width: layoutData.canvas.width,
      height: layoutData.canvas.height,
      thickness: layoutData.canvas.thickness,
      unit: layoutData.canvas.unit,
    },
    DEFAULT_PRICING
  );
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
    consumablesCost: number;
    packagingCost: number;
    totalCostBeforeMargins: number;
    kaiserPayout: number;
    lumashapePayout: number;
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
  const computedItems = items.map((i) => {
    const canvas = i.layoutData?.canvas;
    const dims: LayoutDimensions = {
      width: canvas?.width || 0,
      height: canvas?.height || 0,
      thickness: canvas?.thickness || 0,
      unit: canvas?.unit || 'inches',
    };
    const volume = calculateVolumeInCubicInches(dims);
    const unitMaterialCost = Math.round(volume * params.materialCostPerIn3 * 100) / 100;
    const unitWithWaste = Math.round(unitMaterialCost * params.wasteFactor * 100) / 100;
    return {
      id: i.id,
      name: i.name,
      qty: i.quantity,
      unitVolumeIn3: Math.round(volume * 100) / 100,
      unitMaterialCostWithWaste: unitWithWaste,
      lineMaterialCostWithWaste: Math.round(unitWithWaste * i.quantity * 100) / 100,
      hasTextEngraving: itemHasText(i),
    };
  });

  const materialVolumeIn3 = Math.round(
    computedItems.reduce((s, x) => s + x.unitVolumeIn3 * x.qty, 0) * 100
  ) / 100;

  const materialCost = Math.round(materialVolumeIn3 * params.materialCostPerIn3 * 100) / 100;
  const materialCostWithWaste = Math.round(materialCost * params.wasteFactor * 100) / 100;

  // ENGRAVING: apply flat fee per distinct line that requires text engraving (not per order, not per unit)
  const engravingFee = Math.round(
    computedItems.reduce((sum, itm) => sum + (itm.hasTextEngraving ? params.engravingFlatFee : 0), 0) * 100
  ) / 100;

  const totalQty = computedItems.reduce((s, x) => s + x.qty, 0);
  const consumablesCost = Math.round(totalQty * params.consumablesCostPerInsert * 100) / 100;
  const packagingCost = params.packagingCostPerOrder;

  const totalCostBeforeMargins = Math.round(
    (materialCostWithWaste + engravingFee + consumablesCost + packagingCost) * 100
  ) / 100;

  const kaiserPayout = Math.round(totalCostBeforeMargins * (1 + params.kaiserMarginPct) * 100) / 100;
  const lumashapePayout = Math.round(kaiserPayout * params.lumashapeMarginPct * 100) / 100;
  const customerTotal = Math.round((kaiserPayout + lumashapePayout) * 100) / 100;

  return {
    items: computedItems,
    totals: {
      materialVolumeIn3,
      materialCost,
      materialCostWithWaste,
      engravingFee,
      consumablesCost,
      packagingCost,
      totalCostBeforeMargins,
      kaiserPayout,
      lumashapePayout,
      customerTotal,
    },
    parameters: params,
  };
};

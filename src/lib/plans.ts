export const GROWTH_PLAN_IDENTIFIERS = ["growth", "both", "media-pro", "pro", "enterprise"];

export const normalizePlanIdentifier = (planIdentifier: string | null | undefined) =>
  planIdentifier?.toLowerCase().trim().replace(/[\s_]+/g, "-") ?? "";

export const isGrowthPlanIdentifier = (planIdentifier: string | null | undefined) => {
  const normalized = normalizePlanIdentifier(planIdentifier);
  return GROWTH_PLAN_IDENTIFIERS.includes(normalized) || normalized.includes("growth");
};
export const VIP_TIER_THRESHOLDS = Object.freeze({
  gold: 2_000,
  platinum: 5_000,
});

export function getVipTier(points) {
  const normalizedPoints = Math.max(0, Number(points) || 0);
  if (normalizedPoints >= VIP_TIER_THRESHOLDS.platinum) return 'platinum';
  if (normalizedPoints >= VIP_TIER_THRESHOLDS.gold) return 'gold';
  return 'silver';
}

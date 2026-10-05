export function buildBlockRules(sites, shouldBlock) {
  if (!shouldBlock) return [];
  return [...sites].sort().map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "block" },
    condition: {
      urlFilter: `||${site}^`,
      resourceTypes: ["main_frame"]
    }
  }));
}

function ruleSignature(rule) {
  return JSON.stringify({
    id: rule.id,
    priority: rule.priority,
    action: rule.action?.type,
    urlFilter: rule.condition?.urlFilter,
    resourceTypes: rule.condition?.resourceTypes
  });
}

export async function reconcileBlockRules(dnr, desired) {
  const existing = await dnr.getDynamicRules();
  const current = existing.map(ruleSignature).sort();
  const target = desired.map(ruleSignature).sort();
  if (JSON.stringify(current) === JSON.stringify(target)) return false;
  await dnr.updateDynamicRules({
    removeRuleIds: existing.map(({ id }) => id),
    addRules: desired
  });
  return true;
}

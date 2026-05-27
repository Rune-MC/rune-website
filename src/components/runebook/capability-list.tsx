import { capabilityTier } from "@/lib/capabilities";
import { CapabilityBadge } from "./capability-badge";

interface Props {
  capabilities: string[];
}

const TIER_ORDER = { danger: 0, elevated: 1, standard: 2 } as const;

export function CapabilityList({ capabilities }: Props) {
  if (capabilities.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No host capabilities declared. This Rune runs in a sandboxed isolate.
      </p>
    );
  }

  // Sort by trust cost so dangerous capabilities lead, per DESIGN.md
  // ("operators decide based on this list; the page must not hide it").
  const sorted = [...capabilities].sort(
    (a, b) => TIER_ORDER[capabilityTier(a)] - TIER_ORDER[capabilityTier(b)],
  );

  return (
    <ul className="flex flex-wrap gap-2">
      {sorted.map((cap) => (
        <li key={cap}>
          <CapabilityBadge cap={cap} />
        </li>
      ))}
    </ul>
  );
}

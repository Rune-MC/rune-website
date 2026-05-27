import { AlertTriangle, Shield, ShieldAlert } from "lucide-react";
import {
  type CapabilityTier,
  capabilityDescription,
  capabilityTier,
} from "@/lib/capabilities";

const TIER_ICON = {
  danger: AlertTriangle,
  elevated: ShieldAlert,
  standard: Shield,
} as const;

const TIER_CLASSES: Record<CapabilityTier, string> = {
  danger: "border-destructive/40 bg-destructive/5 text-foreground font-medium",
  elevated: "border-border bg-muted text-foreground font-medium",
  standard: "border-border bg-background text-muted-foreground font-normal",
};

interface Props {
  cap: string;
}

export function CapabilityBadge({ cap }: Props) {
  const tier = capabilityTier(cap);
  const Icon = TIER_ICON[tier];
  const desc = capabilityDescription(cap);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs ${TIER_CLASSES[tier]}`}
      title={desc}
    >
      <Icon className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{cap}</span>
    </span>
  );
}

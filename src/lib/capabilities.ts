export type CapabilityTier = "danger" | "elevated" | "standard";

/**
 * Trust-cost tier for a capability identifier.
 *
 *   danger    fs:write, fs:write:*
 *   elevated  fs:*, network, network:*
 *   standard  host:*, anything else
 *
 * The detail page weight-graders capability badges by tier; high-cost
 * capabilities get more visual weight than low-cost ones, per the
 * "Capability Color Rule" in DESIGN.md.
 */
export function capabilityTier(cap: string): CapabilityTier {
  if (cap === "fs:write" || cap.startsWith("fs:write:")) return "danger";
  if (cap === "fs" || cap.startsWith("fs:")) return "elevated";
  if (cap === "network" || cap.startsWith("network:")) return "elevated";
  return "standard";
}

const CAPABILITY_DESCRIPTIONS: Record<string, string> = {
  "fs:write": "Read and modify files on the server filesystem.",
  "fs:read": "Read files on the server filesystem.",
  network: "Make outbound network requests.",
  "host:bukkit": "Access the Bukkit/Paper plugin API.",
  "host:player.message": "Send chat messages to players.",
};

export function capabilityDescription(cap: string): string | undefined {
  return CAPABILITY_DESCRIPTIONS[cap];
}

export const TIER_LABEL: Record<CapabilityTier, string> = {
  danger: "elevated trust",
  elevated: "elevated",
  standard: "standard",
};

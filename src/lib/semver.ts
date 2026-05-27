import semverCompare from "semver/functions/compare";
import semverGt from "semver/functions/gt";
import semverValid from "semver/functions/valid";

export function compareVersions(a: string, b: string): number {
  return semverCompare(a, b);
}

export function isNewer(
  candidate: string,
  current: string | null | undefined,
): boolean {
  if (!current) return true;
  return semverGt(candidate, current);
}

export function isValidSemver(value: string): boolean {
  return semverValid(value) !== null;
}

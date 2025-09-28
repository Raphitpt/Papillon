import { Period } from "@/services/shared/grade";
import { error, warn } from "@/utils/logger/logger";

export function getCurrentPeriod(periods: Period[]): Period {
  const now = new Date().getTime()
  periods = periods.sort((a, b) => a.start.getTime() - b.start.getTime());

  // First, try to find the current period
  for (const period of periods) {
    if (period.start.getTime() <= now && period.end.getTime() >= now) {
      return period;
    }
  }

  // If no current period found, fallback to the most recent or upcoming period
  if (periods.length > 0) {
    // Find the closest period (either current or future)
    let closestPeriod = periods[0];
    let smallestDistance = Math.abs(now - periods[0].start.getTime());

    for (const period of periods) {
      const startDistance = Math.abs(now - period.start.getTime());
      const endDistance = Math.abs(now - period.end.getTime());
      const distance = Math.min(startDistance, endDistance);

      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestPeriod = period;
      }
    }

    warn("Current period not found. Falling back to the closest period: " + closestPeriod.name);
    return closestPeriod;
  }

  error("Unable to find the current period and unable to fallback...")
}
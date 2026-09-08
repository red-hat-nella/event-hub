export type TemporalStatus = 'upcoming' | 'ongoing' | 'finished';

/**
 * research.md §21: `upcoming` si `now < startsAt`; `ongoing` si
 * `startsAt <= now < startsAt + durationHours`; `finished` en otro caso.
 */
export function computeTemporalStatus(
  startsAt: Date,
  now: Date,
  durationHours: number,
): TemporalStatus {
  const endsAt = new Date(startsAt.getTime() + durationHours * 60 * 60 * 1000);

  if (now < startsAt) {
    return 'upcoming';
  }

  if (now < endsAt) {
    return 'ongoing';
  }

  return 'finished';
}

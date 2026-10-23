import { format } from 'date-fns';

import type { AvailabilitySchedule } from '@/types';

export function isAvailableNow(schedule: AvailabilitySchedule, now: Date = new Date()): boolean {
  const today = format(now, 'yyyy-MM-dd');
  if (schedule.blockedDates.includes(today)) return false;

  const dayOfWeek = now.getDay();
  const minutesNow = now.getHours() * 60 + now.getMinutes();

  return schedule.weekly.some(
    (window) =>
      window.dayOfWeek === dayOfWeek && minutesNow >= window.startMinutes && minutesNow <= window.endMinutes,
  );
}

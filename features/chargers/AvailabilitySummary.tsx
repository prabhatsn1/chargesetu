import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { AvailabilitySchedule } from '@/types';

const WEEKDAY_KEYS = ['days.sun', 'days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat'] as const;

function formatMinutes(minutes: number): string {
  const hours24 = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(mins).padStart(2, '0')} ${period}`;
}

interface AvailabilitySummaryProps {
  schedule: AvailabilitySchedule;
}

export function AvailabilitySummary({ schedule }: AvailabilitySummaryProps) {
  const { t } = useTranslation();
  const byDay = new Map(schedule.weekly.map((w) => [w.dayOfWeek, w]));

  return (
    <View className="gap-2">
      <Text className="text-sm font-medium">{t('host.availability')}</Text>
      <View className="gap-1 rounded-xl border border-border p-3">
        {WEEKDAY_KEYS.map((key, dayOfWeek) => {
          const window = byDay.get(dayOfWeek);
          return (
            <View key={key} className="flex-row justify-between">
              <Text className="text-sm text-muted-foreground">{t(key)}</Text>
              <Text className="text-sm">
                {window ? `${formatMinutes(window.startMinutes)} – ${formatMinutes(window.endMinutes)}` : '—'}
              </Text>
            </View>
          );
        })}
      </View>
      {schedule.blockedDates.length > 0 ? (
        <View className="gap-1">
          <Text className="text-xs text-muted-foreground">{t('host.blockedDates')}</Text>
          <Text className="text-xs text-muted-foreground">{schedule.blockedDates.join(', ')}</Text>
        </View>
      ) : null}
    </View>
  );
}

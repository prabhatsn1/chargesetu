import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, Text, View } from 'react-native';

import type { AvailabilitySchedule } from '@/types';

const WEEKDAY_KEYS = ['days.sun', 'days.mon', 'days.tue', 'days.wed', 'days.thu', 'days.fri', 'days.sat'] as const;

interface AvailabilityEditorProps {
  value: AvailabilitySchedule;
  onChange: (value: AvailabilitySchedule) => void;
}

function minutesToDate(minutes: number): Date {
  const date = new Date();
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}

function dateToMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function AvailabilityEditor({ value, onChange }: AvailabilityEditorProps) {
  const { t } = useTranslation();
  const [activeTimePicker, setActiveTimePicker] = useState<'start' | 'end' | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const selectedDays = new Set(value.weekly.map((w) => w.dayOfWeek));
  // MVP keeps one shared time range across all selected days.
  const startMinutes = value.weekly[0]?.startMinutes ?? 9 * 60;
  const endMinutes = value.weekly[0]?.endMinutes ?? 21 * 60;

  function toggleDay(dayOfWeek: number) {
    const nowSelected = new Set(selectedDays);
    if (nowSelected.has(dayOfWeek)) nowSelected.delete(dayOfWeek);
    else nowSelected.add(dayOfWeek);

    onChange({
      ...value,
      weekly: [...nowSelected].map((d) => ({ dayOfWeek: d, startMinutes, endMinutes })),
    });
  }

  function setTimeRange(nextStart: number, nextEnd: number) {
    onChange({
      ...value,
      weekly: [...selectedDays].map((d) => ({ dayOfWeek: d, startMinutes: nextStart, endMinutes: nextEnd })),
    });
  }

  function addBlockedDate(date: Date) {
    const iso = format(date, 'yyyy-MM-dd');
    if (value.blockedDates.includes(iso)) return;
    onChange({ ...value, blockedDates: [...value.blockedDates, iso].sort() });
  }

  function removeBlockedDate(iso: string) {
    onChange({ ...value, blockedDates: value.blockedDates.filter((d) => d !== iso) });
  }

  return (
    <View className="gap-4">
      <View className="flex-row flex-wrap gap-2">
        {WEEKDAY_KEYS.map((key, dayOfWeek) => {
          const selected = selectedDays.has(dayOfWeek);
          return (
            <Pressable
              key={key}
              onPress={() => toggleDay(dayOfWeek)}
              className={`h-10 w-12 items-center justify-center rounded-lg border ${selected ? 'border-brand bg-brand-light' : 'border-border'}`}
            >
              <Text className={selected ? 'font-medium text-brand-dark' : 'text-black'}>{t(key)}</Text>
            </Pressable>
          );
        })}
      </View>

      <View className="flex-row gap-4">
        <Pressable onPress={() => setActiveTimePicker('start')} className="flex-1 rounded-xl border border-border p-3">
          <Text className="text-xs text-muted-foreground">{t('host.from')}</Text>
          <Text className="text-base">{format(minutesToDate(startMinutes), 'h:mm a')}</Text>
        </Pressable>
        <Pressable onPress={() => setActiveTimePicker('end')} className="flex-1 rounded-xl border border-border p-3">
          <Text className="text-xs text-muted-foreground">{t('host.to')}</Text>
          <Text className="text-base">{format(minutesToDate(endMinutes), 'h:mm a')}</Text>
        </Pressable>
      </View>

      {activeTimePicker ? (
        <DateTimePicker
          mode="time"
          value={minutesToDate(activeTimePicker === 'start' ? startMinutes : endMinutes)}
          onChange={(_event, date) => {
            setActiveTimePicker(null);
            if (!date) return;
            const minutes = dateToMinutes(date);
            if (activeTimePicker === 'start') setTimeRange(minutes, endMinutes);
            else setTimeRange(startMinutes, minutes);
          }}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        />
      ) : null}

      <View className="gap-2">
        <Text className="text-sm font-medium">{t('host.blockedDates')}</Text>
        <View className="flex-row flex-wrap gap-2">
          {value.blockedDates.map((iso) => (
            <Pressable key={iso} onPress={() => removeBlockedDate(iso)} className="rounded-full bg-muted px-3 py-1.5">
              <Text className="text-sm">{iso} ✕</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setShowDatePicker(true)} className="rounded-full border border-dashed border-border px-3 py-1.5">
            <Text className="text-sm text-muted-foreground">+ {t('host.addBlockedDate')}</Text>
          </Pressable>
        </View>
      </View>

      {showDatePicker ? (
        <DateTimePicker
          mode="date"
          value={new Date()}
          minimumDate={new Date()}
          onChange={(_event, date) => {
            setShowDatePicker(false);
            if (date) addBlockedDate(date);
          }}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
        />
      ) : null}
    </View>
  );
}

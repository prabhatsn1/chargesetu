import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { createReport } from '@/features/reports/api';
import { useAuthStore } from '@/store/authStore';

interface ReportUserModalProps {
  visible: boolean;
  onClose: () => void;
  reportedUser: string;
  sessionId?: string;
}

export function ReportUserModal({ visible, onClose, reportedUser, sessionId }: ReportUserModalProps) {
  const { t } = useTranslation();
  const reportedBy = useAuthStore((s) => s.firebaseUid);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit() {
    if (!reportedBy || !reason.trim()) return;
    setIsSubmitting(true);
    try {
      await createReport({ reportedBy, reportedUser, sessionId, reason: reason.trim() });
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/30 p-6">
        <View className="w-full gap-3 rounded-2xl bg-surface p-4">
          <Text className="text-lg font-semibold">{t('profile.reportUser')}</Text>
          <TextField placeholder={t('profile.reportUser')} value={reason} onChangeText={setReason} multiline />
          <View className="flex-row gap-3">
            <Button label={t('common.cancel')} variant="secondary" className="flex-1" onPress={onClose} />
            <Button
              label={t('common.confirm')}
              className="flex-1"
              loading={isSubmitting}
              disabled={!reason.trim()}
              onPress={onSubmit}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

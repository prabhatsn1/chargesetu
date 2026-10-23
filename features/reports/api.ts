import { addDoc } from '@react-native-firebase/firestore';

import { reportsCollection } from '@/services/firebase';

export interface CreateReportInput {
  reportedBy: string;
  reportedUser: string;
  sessionId?: string;
  reason: string;
}

export async function createReport(input: CreateReportInput): Promise<void> {
  await addDoc(reportsCollection(), {
    reportedBy: input.reportedBy,
    reportedUser: input.reportedUser,
    sessionId: input.sessionId ?? null,
    reason: input.reason,
    status: 'open',
    createdAt: Date.now(),
  });
}

import type { ConnectorType } from './connector';

export type { ConnectorType };

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string | null;
  photoUrl: string | null;
  languagePref: 'en' | 'hi';

  /** Lightweight identity check (§4) — Aadhaar-last-4 + selfie, reviewed manually. */
  isHostVerified: boolean;
  aadhaarLast4: string | null;
  hostVerificationDocUrl: string | null;
  hostVerificationStatus: HostVerificationStatus;

  vehicleModel: string | null;
  vehicleConnectorType: ConnectorType | null;

  /** Razorpay Route payout linking — separate from the identity check above; KYC review is Razorpay's own. */
  razorpayLinkedAccountId: string | null;
  payoutAccountStatus: PayoutAccountStatus;
  fcmToken: string | null;

  avgRatingAsHost: number | null;
  avgRatingAsChargee: number | null;

  createdAt: number;
}

export type HostVerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type PayoutAccountStatus = 'unlinked' | 'pending' | 'activated' | 'under_review' | 'rejected';

export interface AvailabilityWindow {
  /** 0 = Sunday .. 6 = Saturday */
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}

export interface AvailabilitySchedule {
  weekly: AvailabilityWindow[];
  blockedDates: string[];
}

export interface Charger {
  id: string;
  hostId: string;
  location: { latitude: number; longitude: number };
  address: string;
  connectorTypes: ConnectorType[];
  powerKw: number;
  hourlyRate: number;
  minSessionCharge: number;
  photos: string[];
  availabilitySchedule: AvailabilitySchedule;
  isPaused: boolean;
  createdAt: number;
  updatedAt: number;
}

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  chargerId: string;
  hostId: string;
  chargeeId: string;
  requestedStart: number;
  requestedEnd: number;
  status: BookingStatus;
  estimatedCost: number;
  createdAt: number;
}

export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type HostConfirmationStatus = 'auto_confirmed' | 'confirmed' | 'disputed';

export interface Session {
  id: string;
  bookingId: string;
  chargerId: string;
  hostId: string;
  chargeeId: string;
  startedAt: number | null;
  endedAt: number | null;
  startPhotoUrl: string | null;
  endPhotoUrl: string | null;
  durationMinutes: number | null;
  hourlyRateAtBooking: number;
  totalAmount: number | null;
  commissionAmount: number | null;
  gstAmount: number | null;
  hostPayoutAmount: number | null;
  paymentStatus: PaymentStatus;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  hostConfirmationStatus: HostConfirmationStatus | null;
  createdAt: number;
}

export type ReviewDirection = 'host_to_chargee' | 'chargee_to_host';

export interface Review {
  id: string;
  sessionId: string;
  fromUid: string;
  toUid: string;
  rating: number;
  comment: string | null;
  direction: ReviewDirection;
  createdAt: number;
}

export type ReportStatus = 'open' | 'reviewed';

export type NotificationKind =
  | 'booking_requested'
  | 'booking_accepted'
  | 'booking_declined'
  | 'session_started'
  | 'session_ended'
  | 'session_confirmation_needed'
  | 'payment_receipt'
  | 'payout_confirmed';

export interface AppNotification {
  id: string;
  toUid: string;
  kind: NotificationKind;
  title: string;
  body: string;
  bookingId: string | null;
  sessionId: string | null;
  read: boolean;
  createdAt: number;
}

export interface Report {
  id: string;
  reportedBy: string;
  reportedUser: string;
  sessionId: string | null;
  reason: string;
  status: ReportStatus;
  createdAt: number;
}

import { getAuth } from '@react-native-firebase/auth';
import { collection, getFirestore } from '@react-native-firebase/firestore';
import { getMessaging } from '@react-native-firebase/messaging';
import { getStorage } from '@react-native-firebase/storage';

/**
 * Thin re-export so the rest of the app imports Firebase services from one
 * place and can swap the underlying SDK without touching call sites.
 */
export const auth = getAuth();
export const firestore = getFirestore();
export const storage = getStorage();
export const messaging = getMessaging();

export const usersCollection = () => collection(firestore, 'users');
export const chargersCollection = () => collection(firestore, 'chargers');
export const bookingsCollection = () => collection(firestore, 'bookings');
export const sessionsCollection = () => collection(firestore, 'sessions');
export const reviewsCollection = () => collection(firestore, 'reviews');
export const reportsCollection = () => collection(firestore, 'reports');
export const notificationsCollection = () => collection(firestore, 'notifications');

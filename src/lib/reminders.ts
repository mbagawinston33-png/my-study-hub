import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { getDb } from './firebase';
import { Reminder, ReminderFormData } from '@/types/reminder';

const REMINDERS_COLLECTION = 'reminders';

/**
 * Create a new reminder
 */
export async function createReminder(userId: string, reminderData: ReminderFormData): Promise<Reminder> {
  const db = getDb();

  try {
    const reminderDoc = {
      userId,
      title: reminderData.title.trim(),
      description: reminderData.description?.trim() || '',
      dueDate: Timestamp.fromDate(new Date(reminderData.dueDate)),
      isCompleted: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, REMINDERS_COLLECTION), reminderDoc);
    const newDoc = await getDoc(docRef);

    if (!newDoc.exists()) {
      throw new Error('Failed to create reminder');
    }

    return {
      id: newDoc.id,
      ...newDoc.data()
    } as Reminder;
  } catch (error) {
    console.error('Error creating reminder:', error);
    throw new Error('Failed to create reminder');
  }
}

/**
 * Get all reminders for a user
 */
export async function getUserReminders(userId: string): Promise<Reminder[]> {
  const db = getDb();

  try {
    const q = query(
      collection(db, REMINDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('dueDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reminder[];
  } catch (error) {
    console.error('Error fetching reminders:', error);
    throw new Error('Failed to fetch reminders');
  }
}

/**
 * Get upcoming reminders for a user (limit to 10)
 */
export async function getUpcomingReminders(userId: string): Promise<Reminder[]> {
  const db = getDb();

  try {
    const now = new Date();
    const q = query(
      collection(db, REMINDERS_COLLECTION),
      where('userId', '==', userId),
      where('isCompleted', '==', false),
      where('dueDate', '>=', Timestamp.fromDate(now)),
      orderBy('dueDate', 'asc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Reminder[];
  } catch (error) {
    console.error('Error fetching upcoming reminders:', error);
    throw new Error('Failed to fetch upcoming reminders');
  }
}

/**
 * Get a single reminder by ID
 */
export async function getReminderById(userId: string, reminderId: string): Promise<Reminder> {
  const db = getDb();

  try {
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Reminder not found');
    }

    const reminder = { id: docSnap.id, ...docSnap.data() } as Reminder;

    // Verify user ownership
    if (reminder.userId !== userId) {
      throw new Error('Access denied');
    }

    return reminder;
  } catch (error) {
    console.error('Error fetching reminder:', error);
    throw error instanceof Error ? error : new Error('Failed to fetch reminder');
  }
}

/**
 * Update an existing reminder
 */
export async function updateReminder(userId: string, reminderId: string, reminderData: Partial<ReminderFormData>): Promise<Reminder> {
  const db = getDb();

  try {
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);

    // First verify ownership
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new Error('Reminder not found');
    }

    const existingReminder = existingDoc.data() as Reminder;
    if (existingReminder.userId !== userId) {
      throw new Error('Access denied');
    }

    const updateData: any = {};

    if (reminderData.title !== undefined) {
      updateData.title = reminderData.title.trim();
    }
    if (reminderData.description !== undefined) {
      updateData.description = reminderData.description?.trim() || '';
    }
    if (reminderData.dueDate !== undefined) {
      updateData.dueDate = Timestamp.fromDate(new Date(reminderData.dueDate));
    }

    await updateDoc(docRef, updateData);

    // Return updated document
    const updatedDoc = await getDoc(docRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Reminder;
  } catch (error) {
    console.error('Error updating reminder:', error);
    throw error instanceof Error ? error : new Error('Failed to update reminder');
  }
}

/**
 * Toggle reminder completion status
 */
export async function toggleReminderCompletion(userId: string, reminderId: string): Promise<Reminder> {
  const db = getDb();

  try {
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);

    // First verify ownership
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new Error('Reminder not found');
    }

    const existingReminder = existingDoc.data() as Reminder;
    if (existingReminder.userId !== userId) {
      throw new Error('Access denied');
    }

    const newCompletionStatus = !existingReminder.isCompleted;
    await updateDoc(docRef, { isCompleted: newCompletionStatus });

    // Return updated document
    const updatedDoc = await getDoc(docRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Reminder;
  } catch (error) {
    console.error('Error toggling reminder completion:', error);
    throw error instanceof Error ? error : new Error('Failed to update reminder');
  }
}

/**
 * Delete a reminder
 */
export async function deleteReminder(userId: string, reminderId: string): Promise<void> {
  const db = getDb();

  try {
    const docRef = doc(db, REMINDERS_COLLECTION, reminderId);

    // First verify ownership
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new Error('Reminder not found');
    }

    const existingReminder = existingDoc.data() as Reminder;
    if (existingReminder.userId !== userId) {
      throw new Error('Access denied');
    }

    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting reminder:', error);
    throw error instanceof Error ? error : new Error('Failed to delete reminder');
  }
}
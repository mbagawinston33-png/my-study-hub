import { Timestamp } from "firebase/firestore";

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate: Timestamp;
  isCompleted: boolean;
  createdAt: Timestamp;
}

export interface ReminderFormData {
  title: string;
  description?: string;
  dueDate: string;
}
/**
 * Calendar utilities for MyStudyHub
 * Handles date calculations and calendar event data fetching
 */

import {
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';

import { getDb } from './firebase';
import { Task } from '@/types/task';
import { Reminder } from '@/types/reminder';
import { Subject } from '@/types/subject';
import { getUserSubjects } from './storage';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'task' | 'reminder';
  priority?: string;
  status?: string;
  isCompleted?: boolean;
  subjectId?: string;
  subject?: Subject;
}

export interface CalendarDay {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

/**
 * Get the first day of the month for a given date
 */
export function getMonthStart(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the month for a given date
 */
export function getMonthEnd(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

/**
 * Get the start of the week for a given date (Sunday)
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

/**
 * Get all days for a calendar month view (including padding days)
 */
export function getCalendarDays(date: Date): CalendarDay[] {
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);
  const calendarStart = getWeekStart(monthStart);
  const calendarEnd = new Date(getWeekStart(monthEnd));
  calendarEnd.setDate(calendarEnd.getDate() + 6);

  const days: CalendarDay[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = new Date(calendarStart);
  while (current <= calendarEnd) {
    const currentCopy = new Date(current);
    currentCopy.setHours(0, 0, 0, 0);

    days.push({
      date: currentCopy,
      events: [],
      isCurrentMonth: currentCopy >= monthStart && currentCopy <= monthEnd,
      isToday: currentCopy.getTime() === today.getTime()
    });

    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Fetch all tasks for a given month
 */
export async function getTasksForMonth(userId: string, date: Date): Promise<Task[]> {
  const db = getDb();
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);

  
  const q = query(
    collection(db, 'tasks'),
    where('userId', '==', userId),
    where('dueDate', '>=', Timestamp.fromDate(monthStart)),
    where('dueDate', '<=', Timestamp.fromDate(monthEnd)),
    orderBy('dueDate', 'asc')
  );

  const querySnapshot = await getDocs(q);
  const tasks = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Task[];

  
  return tasks;
}

/**
 * Fetch all reminders for a given month
 */
export async function getRemindersForMonth(userId: string, date: Date): Promise<Reminder[]> {
  const db = getDb();
  const monthStart = getMonthStart(date);
  const monthEnd = getMonthEnd(date);

  const q = query(
    collection(db, 'reminders'),
    where('userId', '==', userId),
    where('dueDate', '>=', Timestamp.fromDate(monthStart)),
    where('dueDate', '<=', Timestamp.fromDate(monthEnd)),
    orderBy('dueDate', 'asc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Reminder[];
}

/**
 * Convert tasks and reminders to calendar events
 */
export function createCalendarEvents(
  tasks: Task[],
  reminders: Reminder[],
  subjects: Subject[]
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  // Add tasks
  tasks.forEach(task => {
    events.push({
      id: task.id,
      title: task.title,
      date: task.dueDate.toDate(),
      type: 'task',
      priority: task.priority,
      status: task.status,
      isCompleted: task.status === 'completed',
      subjectId: task.subjectId,
      subject: task.subjectId ? subjects.find(s => s.id === task.subjectId) : undefined
    });
  });

  // Add reminders
  reminders.forEach(reminder => {
    events.push({
      id: reminder.id,
      title: reminder.title,
      date: reminder.dueDate.toDate(),
      type: 'reminder',
      isCompleted: reminder.isCompleted
    });
  });

  return events;
}

/**
 * Group events by calendar day
 */
export function groupEventsByDays(
  calendarDays: CalendarDay[],
  events: CalendarEvent[]
): CalendarDay[] {
  return calendarDays.map(day => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate.getTime() === day.date.getTime();
    });

    return {
      ...day,
      events: dayEvents
    };
  });
}

/**
 * Get calendar data for a specific month
 */
export async function getCalendarData(
  userId: string,
  date: Date
): Promise<CalendarDay[]> {
  try {
    
    // Fetch tasks, reminders, and subjects
    const [tasks, reminders, subjects] = await Promise.all([
      getTasksForMonth(userId, date),
      getRemindersForMonth(userId, date),
      getUserSubjects(userId)
    ]);

    // Convert to calendar events
    const events = createCalendarEvents(tasks, reminders, subjects);

    // Get calendar days and group events
    const calendarDays = getCalendarDays(date);
    const result = groupEventsByDays(calendarDays, events);

    return result;
  } catch (error) {
        return getCalendarDays(date); // Return empty calendar days on error
  }
}
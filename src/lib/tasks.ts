/**
 * Firebase Firestore utilities for Task Management
 * Handles CRUD operations and status management for tasks
 */

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
import { Task, TaskFormData, TaskStatus, TaskFilter, TaskWithSubject, TaskStats } from '@/types/task';
import { getUserSubjects } from './storage';

const TASKS_COLLECTION = 'tasks';

/**
 * Create a new task
 */
export async function createTask(userId: string, taskData: TaskFormData): Promise<Task> {
  const db = getDb();

  try {
    const taskDoc = {
      userId,
      title: taskData.title.trim(),
      description: taskData.description?.trim() || '',
      dueDate: Timestamp.fromDate(new Date(taskData.dueDate)),
      priority: taskData.priority,
      status: 'pending' as TaskStatus,
      subjectId: taskData.subjectId || null,
      attachedFiles: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, TASKS_COLLECTION), taskDoc);
    const newDoc = await getDoc(docRef);

    if (!newDoc.exists()) {
      throw new Error('Failed to create task');
    }

    return {
      id: newDoc.id,
      ...newDoc.data()
    } as Task;
  } catch (error) {
throw new Error('Failed to create task');
  }
}

/**
 * Get all tasks for a user
 */
export async function getUserTasks(userId: string): Promise<Task[]> {
  const db = getDb();

  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];
  } catch (error) {
throw new Error('Failed to fetch tasks');
  }
}

/**
 * Get tasks filtered by status
 */
export async function getTasksByStatus(userId: string, status: TaskStatus): Promise<Task[]> {
  const db = getDb();

  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', status),
      orderBy('dueDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];
  } catch (error) {
throw new Error('Failed to fetch tasks by status');
  }
}

/**
 * Get tasks for a specific subject
 */
export async function getTasksBySubject(userId: string, subjectId: string): Promise<Task[]> {
  const db = getDb();

  try {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      where('subjectId', '==', subjectId),
      orderBy('dueDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];
  } catch (error) {
throw new Error('Failed to fetch tasks by subject');
  }
}

/**
 * Get upcoming tasks (not completed, due date in future)
 */
export async function getUpcomingTasks(userId: string, limitCount: number = 10): Promise<Task[]> {
  const db = getDb();

  try {
    const now = new Date();
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      where('status', 'in', ['pending', 'overdue']),
      where('dueDate', '>=', Timestamp.fromDate(now)),
      orderBy('dueDate', 'asc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Task[];
  } catch (error) {
throw new Error('Failed to fetch upcoming tasks');
  }
}

/**
 * Get overdue tasks (not completed, due date passed)
 */
export async function getOverdueTasks(userId: string): Promise<Task[]> {
  const db = getDb();

  try {
    const now = new Date();
    const q = query(
      collection(db, TASKS_COLLECTION),
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      where('dueDate', '<', Timestamp.fromDate(now)),
      orderBy('dueDate', 'asc')
    );

    const querySnapshot = await getDocs(q);
    const tasks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      status: 'overdue' as TaskStatus
    })) as Task[];

    // Update all overdue tasks to have 'overdue' status
    for (const task of tasks) {
      await updateTaskStatus(userId, task.id, 'overdue');
    }

    return tasks;
  } catch (error) {
throw new Error('Failed to fetch overdue tasks');
  }
}

/**
 * Get a single task by ID
 */
export async function getTaskById(userId: string, taskId: string): Promise<Task> {
  const db = getDb();

  try {
    const docRef = doc(db, TASKS_COLLECTION, taskId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error('Task not found');
    }

    const task = { id: docSnap.id, ...docSnap.data() } as Task;

    // Verify user ownership
    if (task.userId !== userId) {
      throw new Error('Access denied');
    }

    return task;
  } catch (error) {
throw error instanceof Error ? error : new Error('Failed to fetch task');
  }
}

/**
 * Update an existing task
 */
export async function updateTask(userId: string, taskId: string, taskData: Partial<TaskFormData>): Promise<Task> {
  const db = getDb();

  try {
    const docRef = doc(db, TASKS_COLLECTION, taskId);

    // First verify ownership
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new Error('Task not found');
    }

    const existingTask = existingDoc.data() as Task;
    if (existingTask.userId !== userId) {
      throw new Error('Access denied');
    }

    const updateData: any = {
      updatedAt: serverTimestamp()
    };

    if (taskData.title !== undefined) {
      updateData.title = taskData.title.trim();
    }
    if (taskData.description !== undefined) {
      updateData.description = taskData.description?.trim() || '';
    }
    if (taskData.dueDate !== undefined) {
      updateData.dueDate = Timestamp.fromDate(new Date(taskData.dueDate));
      // Reset to pending if due date is changed
      updateData.status = 'pending';
    }
    if (taskData.priority !== undefined) {
      updateData.priority = taskData.priority;
    }
    if (taskData.subjectId !== undefined) {
      updateData.subjectId = taskData.subjectId || null;
    }

    await updateDoc(docRef, updateData);

    // Return updated document
    const updatedDoc = await getDoc(docRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Task;
  } catch (error) {
throw error instanceof Error ? error : new Error('Failed to update task');
  }
}

/**
 * Update task status
 */
export async function updateTaskStatus(userId: string, taskId: string, status: TaskStatus): Promise<Task> {
  const db = getDb();

  try {
    const docRef = doc(db, TASKS_COLLECTION, taskId);

    // First verify ownership
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new Error('Task not found');
    }

    const existingTask = existingDoc.data() as Task;
    if (existingTask.userId !== userId) {
      throw new Error('Access denied');
    }

    await updateDoc(docRef, {
      status,
      updatedAt: serverTimestamp()
    });

    // Return updated document
    const updatedDoc = await getDoc(docRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Task;
  } catch (error) {
throw error instanceof Error ? error : new Error('Failed to update task status');
  }
}

/**
 * Toggle task completion status
 */
export async function toggleTaskCompletion(userId: string, taskId: string): Promise<Task> {
  const db = getDb();

  try {
    const docRef = doc(db, TASKS_COLLECTION, taskId);

    // First verify ownership
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new Error('Task not found');
    }

    const existingTask = existingDoc.data() as Task;
    if (existingTask.userId !== userId) {
      throw new Error('Access denied');
    }

    const newStatus = existingTask.status === 'completed' ? 'pending' : 'completed';
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: serverTimestamp()
    });

    // Return updated document
    const updatedDoc = await getDoc(docRef);
    return {
      id: updatedDoc.id,
      ...updatedDoc.data()
    } as Task;
  } catch (error) {
throw error instanceof Error ? error : new Error('Failed to update task');
  }
}

/**
 * Delete a task
 */
export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const db = getDb();

  try {
    const docRef = doc(db, TASKS_COLLECTION, taskId);

    // First verify ownership
    const existingDoc = await getDoc(docRef);
    if (!existingDoc.exists()) {
      throw new Error('Task not found');
    }

    const existingTask = existingDoc.data() as Task;
    if (existingTask.userId !== userId) {
      throw new Error('Access denied');
    }

    await deleteDoc(docRef);
  } catch (error) {
throw error instanceof Error ? error : new Error('Failed to delete task');
  }
}

/**
 * Get tasks with subject information
 */
export async function getTasksWithSubjects(userId: string): Promise<TaskWithSubject[]> {
  try {
    const [tasks, subjects] = await Promise.all([
      getUserTasks(userId),
      getUserSubjects(userId)
    ]);

    return tasks.map(task => ({
      ...task,
      subject: task.subjectId ? subjects.find(s => s.id === task.subjectId) : undefined
    }));
  } catch (error) {
throw new Error('Failed to fetch tasks with subjects');
  }
}

/**
 * Get task statistics
 */
export async function getTaskStats(userId: string): Promise<TaskStats> {
  try {
    const tasks = await getUserTasks(userId);
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const stats = tasks.reduce((acc, task) => {
      const dueDate = task.dueDate.toDate();

      acc.total++;

      if (task.status === 'completed') {
        acc.completed++;
      } else if (task.status === 'overdue' || dueDate < now) {
        acc.overdue++;
      } else {
        acc.pending++;
      }

      if (dueDate <= weekFromNow && task.status !== 'completed') {
        acc.dueThisWeek++;
      }

      return acc;
    }, {
      total: 0,
      pending: 0,
      completed: 0,
      overdue: 0,
      dueThisWeek: 0
    });

    return stats;
  } catch (error) {
throw new Error('Failed to get task statistics');
  }
}

/**
 * Update all overdue tasks
 */
export async function updateOverdueTasks(userId: string): Promise<number> {
  try {
    const overdueTasks = await getOverdueTasks(userId);
    return overdueTasks.length;
  } catch (error) {
throw new Error('Failed to update overdue tasks');
  }
}

/**
 * Get tasks by filter
 */
export async function getTasksByFilter(userId: string, filter: TaskFilter): Promise<Task[]> {
  try {
    // Update overdue tasks first
    await updateOverdueTasks(userId);

    switch (filter) {
      case 'all':
        return await getUserTasks(userId);
      case 'pending':
        return await getTasksByStatus(userId, 'pending');
      case 'completed':
        return await getTasksByStatus(userId, 'completed');
      case 'overdue':
        return await getTasksByStatus(userId, 'overdue');
      default:
        return await getUserTasks(userId);
    }
  } catch (error) {
throw new Error('Failed to fetch tasks by filter');
  }
}
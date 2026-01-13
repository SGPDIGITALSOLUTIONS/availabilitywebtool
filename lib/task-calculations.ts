export interface Task {
  id: string;
  title: string;
  deadline: Date | string;
  status: 'pending' | 'in_progress' | 'completed';
  importance: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

/**
 * Calculate smart score for a task based on:
 * - Importance (0-50 points): importance × 10
 * - Deadline (0-40 points): based on proximity to deadline
 * - Aging (0-10 points): based on last update/creation date
 */
export function calculateSmartScore(task: Task): number {
  // Completed tasks always have score 0
  if (task.status === 'completed') {
    return 0;
  }

  // Importance Points (0-50)
  const importancePoints = task.importance * 10;

  // Deadline Points (0-40)
  const deadlineDate = typeof task.deadline === 'string' 
    ? new Date(task.deadline) 
    : task.deadline;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const daysUntilDeadline = Math.floor((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let deadlinePoints = 0;
  if (daysUntilDeadline < 0) {
    // Overdue
    deadlinePoints = 40;
  } else if (daysUntilDeadline <= 1) {
    // Due today or tomorrow
    deadlinePoints = 30;
  } else if (daysUntilDeadline <= 3) {
    // Due soon (2-3 days)
    deadlinePoints = 20;
  } else if (daysUntilDeadline <= 7) {
    // Due this week (4-7 days)
    deadlinePoints = 10;
  } else {
    // Future (> 7 days)
    deadlinePoints = 0;
  }

  // Aging Points (0-10)
  const lastUpdateDate = typeof task.updatedAt === 'string'
    ? new Date(task.updatedAt)
    : task.updatedAt;
  const createdDate = typeof task.createdAt === 'string'
    ? new Date(task.createdAt)
    : task.createdAt;
  
  // Use the more recent of updatedAt or createdAt
  const referenceDate = lastUpdateDate > createdDate ? lastUpdateDate : createdDate;
  const daysSinceUpdate = Math.floor((today.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24));
  
  let agingPoints = 0;
  if (daysSinceUpdate < 3) {
    // Recent (< 3 days)
    agingPoints = 0;
  } else if (daysSinceUpdate <= 6) {
    // Moderate (3-6 days)
    agingPoints = 2;
  } else if (daysSinceUpdate <= 13) {
    // Aging (7-13 days)
    agingPoints = 5;
  } else if (daysSinceUpdate <= 20) {
    // Stale (14-20 days)
    agingPoints = 8;
  } else {
    // Very stale (21+ days)
    agingPoints = 10;
  }

  return importancePoints + deadlinePoints + agingPoints;
}

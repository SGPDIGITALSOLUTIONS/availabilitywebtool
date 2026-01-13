import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { calculateSmartScore } from '@/lib/task-calculations';

export async function GET() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all tasks (including completed) for average calculation
    const allTasks = await prisma.task.findMany({
      include: {
        allocatedByUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        deadline: 'asc',
      },
    });

    // Get only non-completed tasks for count and most urgent
    const activeTasks = allTasks.filter(task => task.status !== 'completed');
    const totalTasks = activeTasks.length;

    if (allTasks.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalTasks: 0,
          averageUrgency: 0,
          mostUrgentTask: null,
        },
      });
    }

    // Calculate urgency scores for ALL tasks (including completed)
    const allTasksWithScores = allTasks.map(task => ({
      ...task,
      urgencyScore: calculateSmartScore({
        id: task.id,
        title: task.title,
        deadline: task.deadline,
        status: task.status as 'pending' | 'in_progress' | 'completed',
        importance: task.importance,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      }),
    }));

    // Calculate average urgency: sum of all urgency scores divided by total number of tasks
    const totalUrgency = allTasksWithScores.reduce((sum, task) => sum + task.urgencyScore, 0);
    const averageUrgency = Math.round((totalUrgency / allTasks.length) * 10) / 10; // Round to 1 decimal

    // Find most urgent task (highest score) from active tasks only
    const activeTasksWithScores = allTasksWithScores.filter(task => task.status !== 'completed');
    const mostUrgentTask = activeTasksWithScores.length > 0
      ? activeTasksWithScores.reduce((max, task) => 
          task.urgencyScore > max.urgencyScore ? task : max
        )
      : null;

    return NextResponse.json({
      success: true,
      data: {
        totalTasks,
        averageUrgency,
        mostUrgentTask: mostUrgentTask ? {
          id: mostUrgentTask.id,
          title: mostUrgentTask.title,
          urgencyScore: mostUrgentTask.urgencyScore,
          deadline: mostUrgentTask.deadline,
          status: mostUrgentTask.status,
          importance: mostUrgentTask.importance,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

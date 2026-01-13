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

    // Get all non-completed tasks
    const tasks = await prisma.task.findMany({
      where: {
        status: { not: 'completed' },
      },
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

    // Calculate statistics
    const totalTasks = tasks.length;
    
    if (totalTasks === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalTasks: 0,
          averageUrgency: 0,
          mostUrgentTask: null,
        },
      });
    }

    // Calculate urgency scores for all tasks
    const tasksWithScores = tasks.map(task => ({
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

    // Calculate average urgency
    const totalUrgency = tasksWithScores.reduce((sum, task) => sum + task.urgencyScore, 0);
    const averageUrgency = Math.round((totalUrgency / totalTasks) * 10) / 10; // Round to 1 decimal

    // Find most urgent task (highest score)
    const mostUrgentTask = tasksWithScores.reduce((max, task) => 
      task.urgencyScore > max.urgencyScore ? task : max
    );

    return NextResponse.json({
      success: true,
      data: {
        totalTasks,
        averageUrgency,
        mostUrgentTask: {
          id: mostUrgentTask.id,
          title: mostUrgentTask.title,
          urgencyScore: mostUrgentTask.urgencyScore,
          deadline: mostUrgentTask.deadline,
          status: mostUrgentTask.status,
          importance: mostUrgentTask.importance,
        },
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

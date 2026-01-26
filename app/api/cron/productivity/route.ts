import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { calculateSmartScore } from '@/lib/task-calculations';

export async function GET(request: Request) {
  try {
    // Authentication check (same pattern as scrape cron)
    const authHeader = request.headers.get('authorization');
    const vercelCronSecret = process.env.VERCEL_CRON_SECRET;
    const cronSecret = process.env.CRON_SECRET;
    
    if (vercelCronSecret || cronSecret) {
      const expectedSecret = vercelCronSecret || cronSecret;
      if (authHeader !== `Bearer ${expectedSecret}`) {
        return NextResponse.json({ 
          error: 'Unauthorized',
        }, { status: 401 });
      }
    }

    console.log(`\n⏰ Productivity report cron job started at ${new Date().toISOString()}`);

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMinutes(0, 0, 0);

    // Check if report already exists for today
    const existingReport = await prisma.productivityReport.findUnique({
      where: { reportDate: today },
    });

    if (existingReport) {
      console.log('Productivity report already exists for today, skipping...');
      return NextResponse.json({
        success: true,
        message: 'Report already exists for today',
      });
    }

    // Get all tasks
    const allTasks = await prisma.task.findMany({
      include: {
        allocatedByUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Calculate date range for today
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Filter tasks completed today - use completedAt timestamp if available, otherwise fall back to updatedAt
    const tasksCompletedToday = allTasks.filter(task => {
      if (task.status !== 'completed') return false;
      // Use completedAt if available, otherwise use updatedAt as fallback
      const completionDate = task.completedAt ? new Date(task.completedAt) : new Date(task.updatedAt);
      return completionDate >= todayStart && completionDate <= todayEnd;
    });

    // Calculate metrics
    const adhocTasksCompletedToday = tasksCompletedToday.filter(t => t.isAdhocTask).length;
    const plannedTasksCompletedToday = tasksCompletedToday.filter(t => !t.isAdhocTask).length;
    const totalTasksCompletedToday = tasksCompletedToday.length;

    // Get pending and completed task lists for details
    const pendingTasks = allTasks
      .filter(t => t.status === 'pending')
      .map(t => ({
        id: t.id,
        title: t.title,
        deadline: t.deadline.toISOString(),
        importance: t.importance,
        allocatedBy: t.allocatedByUser?.username || t.allocatedByOverride || 'Unknown',
      }));

    const completedTasksList = tasksCompletedToday.map(t => ({
      id: t.id,
      title: t.title,
      deadline: t.deadline.toISOString(),
      importance: t.importance,
      isAdhoc: t.isAdhocTask,
      allocatedBy: t.allocatedByUser?.username || t.allocatedByOverride || 'Unknown',
      completedAt: t.completedAt ? t.completedAt.toISOString() : t.updatedAt.toISOString(), // Use completedAt if available
    }));

    // Store task details as JSON
    const taskDetails = {
      pending: pendingTasks,
      completed: completedTasksList,
    };

    // Generate CSV data
    const csvRows = [
      ['Date', 'Planned Tasks Completed Today', 'Ad-hoc Tasks Completed Today', 'Total Tasks Completed Today'],
      [
        today.toISOString().split('T')[0],
        plannedTasksCompletedToday.toString(),
        adhocTasksCompletedToday.toString(),
        totalTasksCompletedToday.toString(),
      ],
    ];

    const csvData = csvRows.map(row => row.join(',')).join('\n');

    // Save report
    await prisma.productivityReport.create({
      data: {
        reportDate: today,
        csvData,
        plannedTasksCompletedToday,
        adhocTasksCompletedToday,
        totalTasksCompletedToday,
        taskDetails,
      },
    });

    console.log(`✅ Productivity report created for ${today.toISOString().split('T')[0]}`);

    return NextResponse.json({
      success: true,
      message: 'Productivity report created successfully',
      data: {
        reportDate: today,
        plannedTasksCompletedToday,
        adhocTasksCompletedToday,
        totalTasksCompletedToday,
      },
    });
  } catch (error) {
    console.error('Error creating productivity report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create productivity report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

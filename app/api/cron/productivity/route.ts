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

    // Calculate statistics
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'completed').length;
    const pendingTasks = allTasks.filter(t => t.status === 'pending').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
    
    // Count ad-hoc tasks completed today
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    const adhocTasks = allTasks.filter(task => {
      if (!task.isAdhocTask || task.status !== 'completed') return false;
      const taskDate = new Date(task.updatedAt);
      return taskDate >= todayStart && taskDate <= todayEnd;
    }).length;

    // Calculate average urgency
    const tasksWithScores = allTasks.map(task => ({
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

    const totalUrgency = tasksWithScores.reduce((sum, task) => sum + task.urgencyScore, 0);
    const averageUrgency = totalTasks > 0 ? Math.round((totalUrgency / totalTasks) * 10) / 10 : 0;

    // Generate CSV data
    const csvRows = [
      ['Date', 'Total Tasks', 'Completed Tasks', 'Pending Tasks', 'In Progress Tasks', 'Ad-hoc Tasks (Today)', 'Average Urgency'],
      [
        today.toISOString().split('T')[0],
        totalTasks.toString(),
        completedTasks.toString(),
        pendingTasks.toString(),
        inProgressTasks.toString(),
        adhocTasks.toString(),
        averageUrgency.toString(),
      ],
    ];

    const csvData = csvRows.map(row => row.join(',')).join('\n');

    // Save report
    await prisma.productivityReport.create({
      data: {
        reportDate: today,
        csvData,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        adhocTasks,
        averageUrgency,
      },
    });

    console.log(`✅ Productivity report created for ${today.toISOString().split('T')[0]}`);

    return NextResponse.json({
      success: true,
      message: 'Productivity report created successfully',
      data: {
        reportDate: today,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        adhocTasks,
        averageUrgency,
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

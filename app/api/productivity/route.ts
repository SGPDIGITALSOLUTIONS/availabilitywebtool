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

    // Get all productivity reports, ordered by date (newest first)
    const reports = await prisma.productivityReport.findMany({
      orderBy: {
        reportDate: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error('Error fetching productivity reports:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch productivity reports',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setMinutes(0, 0, 0);

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

    // Check if report already exists for today - if so, update it; otherwise create new
    const existingReport = await prisma.productivityReport.findUnique({
      where: { reportDate: today },
    });

    let report;
    if (existingReport) {
      // Update existing report
      report = await prisma.productivityReport.update({
        where: { id: existingReport.id },
        data: {
          csvData,
          totalTasks,
          completedTasks,
          pendingTasks,
          inProgressTasks,
          adhocTasks,
          averageUrgency,
        },
      });
    } else {
      // Create new report
      report = await prisma.productivityReport.create({
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
    }

    return NextResponse.json({
      success: true,
      message: existingReport ? 'Productivity report updated successfully' : 'Productivity report created successfully',
      data: {
        reportDate: report.reportDate,
        totalTasks,
        completedTasks,
        pendingTasks,
        inProgressTasks,
        adhocTasks,
        averageUrgency,
      },
    });
  } catch (error) {
    console.error('Error exporting productivity report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export productivity report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

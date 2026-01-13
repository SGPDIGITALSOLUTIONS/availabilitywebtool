import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

    // Calculate date range for today
    const todayStart = new Date(today);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Filter tasks completed today
    const tasksCompletedToday = allTasks.filter(task => {
      if (task.status !== 'completed') return false;
      const taskDate = new Date(task.updatedAt);
      return taskDate >= todayStart && taskDate <= todayEnd;
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
      completedAt: t.updatedAt.toISOString(),
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
          plannedTasksCompletedToday,
          adhocTasksCompletedToday,
          totalTasksCompletedToday,
          taskDetails,
        },
      });
    } else {
      // Create new report
      report = await prisma.productivityReport.create({
        data: {
          reportDate: today,
          csvData,
          plannedTasksCompletedToday,
          adhocTasksCompletedToday,
          totalTasksCompletedToday,
          taskDetails,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: existingReport ? 'Productivity report updated successfully' : 'Productivity report created successfully',
      data: {
        reportDate: report.reportDate,
        plannedTasksCompletedToday,
        adhocTasksCompletedToday,
        totalTasksCompletedToday,
      },
    });
  } catch (error) {
    console.error('Error exporting productivity report:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to export productivity report',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined,
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  console.log('[GET /api/tasks] Request received');
  
  try {
    console.log('[GET /api/tasks] Checking authentication...');
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('[GET /api/tasks] ERROR: Unauthorized - no user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[GET /api/tasks] User authenticated:', user.username);

    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');
    const deadlineFilter = searchParams.get('deadline');

    console.log('[GET /api/tasks] Query params:', { statusFilter, deadlineFilter });

    // Build where clause
    const where: any = {};

    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
      console.log('[GET /api/tasks] Applied status filter:', statusFilter);
    }

    if (deadlineFilter && deadlineFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (deadlineFilter === 'overdue') {
        where.deadline = { lt: today };
        where.status = { not: 'completed' };
        console.log('[GET /api/tasks] Applied overdue filter');
      } else if (deadlineFilter === 'upcoming') {
        where.deadline = { gte: today };
        where.status = { not: 'completed' };
        console.log('[GET /api/tasks] Applied upcoming filter');
      } else if (deadlineFilter === 'past') {
        where.deadline = { lt: today };
        console.log('[GET /api/tasks] Applied past filter');
      }
    }

    console.log('[GET /api/tasks] Where clause:', JSON.stringify(where, null, 2));
    console.log('[GET /api/tasks] Querying database...');

    let tasks;
    try {
      // Try with client relation first
      tasks = await prisma.task.findMany({
        where,
        include: {
          allocatedByUser: {
            select: {
              id: true,
              username: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
        orderBy: [
          { deadline: 'asc' },
        ],
      });
    } catch (clientError: any) {
      // If client relation fails (table might not exist), retry without it
      console.log('[GET /api/tasks] Client relation failed, retrying without client:', clientError.message);
      tasks = await prisma.task.findMany({
        where,
        include: {
          allocatedByUser: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        orderBy: [
          { deadline: 'asc' },
        ],
      });
    }

    console.log('[GET /api/tasks] SUCCESS: Found', tasks.length, 'tasks');
    if (tasks.length > 0) {
      console.log('[GET /api/tasks] Sample task:', {
        id: tasks[0].id,
        title: tasks[0].title,
        startDate: tasks[0].startDate,
        deadline: tasks[0].deadline,
        status: tasks[0].status,
      });
    }

    return NextResponse.json({
      success: true,
      data: tasks,
    });
  } catch (error) {
    console.error('[GET /api/tasks] ERROR: Failed to fetch tasks');
    console.error('[GET /api/tasks] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[GET /api/tasks] Error message:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error) {
      console.error('[GET /api/tasks] Error stack:', error.stack);
    }
    console.error('[GET /api/tasks] Full error object:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch tasks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      startDate,
      deadline,
      status = 'pending',
      importance = 3,
      notes,
      meetingType,
      location,
      meetingLink,
      recurrence = 'none',
      recurrenceDays,
      isCustomMeeting = false,
      isPersonalTask = false,
      isAdhocTask = false,
      allocatedByUserId,
      allocatedByOverride,
    } = body;

    // Validation
    if (!title || !startDate || !deadline) {
      return NextResponse.json(
        { error: 'Title, start date, and deadline are required' },
        { status: 400 }
      );
    }

    if (importance < 1 || importance > 5) {
      return NextResponse.json(
        { error: 'Importance must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Meeting validation
    if (meetingType === 'in_person' && !location) {
      return NextResponse.json(
        { error: 'Location is required for in-person meetings' },
        { status: 400 }
      );
    }

    if (meetingType === 'call' && !meetingLink) {
      return NextResponse.json(
        { error: 'Meeting link is required for call meetings' },
        { status: 400 }
      );
    }

    // Allocated by logic: use override if provided, otherwise use user ID
    const finalAllocatedByUserId = allocatedByOverride ? null : (allocatedByUserId || user.id);
    const finalAllocatedByOverride = allocatedByOverride || null;

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        startDate: new Date(startDate),
        deadline: new Date(deadline),
        status,
        importance,
        notes: notes || null,
        meetingType: meetingType || null,
        location: location || null,
        meetingLink: meetingLink || null,
        recurrence,
        recurrenceDays: recurrenceDays || null,
        isCustomMeeting,
        isPersonalTask,
        isAdhocTask,
        allocatedByUserId: finalAllocatedByUserId,
        allocatedByOverride: finalAllocatedByOverride,
        completedAt: status === 'completed' ? new Date() : null, // Set completion timestamp if task is created as completed
      },
      include: {
        allocatedByUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Log task creation
    await logAuditEvent({
      action: 'task_created',
      userId: user.id,
      username: user.username,
      details: JSON.stringify({
        taskId: task.id,
        title: task.title,
        taskType: isCustomMeeting ? 'custom_meeting' : isPersonalTask ? 'personal_task' : 'regular_task',
      }),
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        allocatedByUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const updateData: any = {};

    // Only update fields that are provided
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
    if (body.deadline !== undefined) updateData.deadline = new Date(body.deadline);
    if (body.status !== undefined) updateData.status = body.status;
    if (body.importance !== undefined) {
      if (body.importance < 1 || body.importance > 5) {
        return NextResponse.json(
          { error: 'Importance must be between 1 and 5' },
          { status: 400 }
        );
      }
      updateData.importance = body.importance;
    }
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.meetingType !== undefined) updateData.meetingType = body.meetingType || null;
    if (body.location !== undefined) updateData.location = body.location || null;
    if (body.meetingLink !== undefined) updateData.meetingLink = body.meetingLink || null;
    if (body.recurrence !== undefined) updateData.recurrence = body.recurrence;
    if (body.recurrenceDays !== undefined) updateData.recurrenceDays = body.recurrenceDays || null;
    if (body.isCustomMeeting !== undefined) updateData.isCustomMeeting = body.isCustomMeeting;
    if (body.isPersonalTask !== undefined) updateData.isPersonalTask = body.isPersonalTask;
    
    // Allocated by fields
    if (body.allocatedByOverride !== undefined) {
      if (body.allocatedByOverride) {
        // If override is provided, clear user ID
        updateData.allocatedByUserId = null;
        updateData.allocatedByOverride = body.allocatedByOverride;
      } else {
        // If override is cleared, use current user
        updateData.allocatedByUserId = user.id;
        updateData.allocatedByOverride = null;
      }
    } else if (body.allocatedByUserId !== undefined) {
      // If user ID is provided and no override, use it
      updateData.allocatedByUserId = body.allocatedByUserId;
      updateData.allocatedByOverride = null;
    }

    // Get task before update for logging
    const existingTask = await prisma.task.findUnique({
      where: { id },
      select: { title: true, notes: true },
    });

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        allocatedByUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Log task update - check if notes were added/updated
    let action = 'task_updated';
    if (body.notes !== undefined && body.notes && (!existingTask?.notes || body.notes !== existingTask.notes)) {
      action = 'note_added';
    }

    await logAuditEvent({
      action,
      userId: user.id,
      username: user.username,
      details: JSON.stringify({
        taskId: task.id,
        title: task.title,
        updatedFields: Object.keys(updateData),
      }),
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    
    // Get task before deletion for logging
    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    await prisma.task.delete({
      where: { id },
    });

    // Log task deletion
    await logAuditEvent({
      action: 'task_deleted',
      userId: user.id,
      username: user.username,
      details: JSON.stringify({
        taskId: id,
        title: task?.title || 'Unknown',
      }),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete task',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

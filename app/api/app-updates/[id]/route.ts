import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/audit';
import { logAuditEvent } from '@/lib/audit';

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

    // Check if user is admin
    if (!isAdmin(user.username)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const updateData: any = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.expiresAt !== undefined) {
      updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    const update = await prisma.appUpdate.update({
      where: { id },
      data: updateData,
    });

    // Log audit event
    await logAuditEvent({
      action: 'app_update_updated',
      userId: user.id,
      username: user.username,
      details: JSON.stringify({
        updateId: update.id,
        title: update.title,
      }),
    });

    return NextResponse.json({
      success: true,
      data: update,
    });
  } catch (error) {
    console.error('Error updating app update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update app update',
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

    // Check if user is admin
    if (!isAdmin(user.username)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    
    // Get update before deletion for logging
    const update = await prisma.appUpdate.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    await prisma.appUpdate.delete({
      where: { id },
    });

    // Log audit event
    await logAuditEvent({
      action: 'app_update_deleted',
      userId: user.id,
      username: user.username,
      details: JSON.stringify({
        updateId: id,
        title: update?.title || 'Unknown',
      }),
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error deleting app update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete app update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

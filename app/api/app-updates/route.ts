import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/audit';
import { logAuditEvent } from '@/lib/audit';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    
    // Check if user is admin for including inactive updates
    let isUserAdmin = false;
    if (includeInactive) {
      const user = await getCurrentUser();
      isUserAdmin = user ? isAdmin(user.username) : false;
    }

    const now = new Date();
    
    // Build where clause
    const where: any = {};
    
    if (!includeInactive || !isUserAdmin) {
      // Regular users only see active, non-expired updates
      where.isActive = true;
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ];
    }
    // Admin with includeInactive=true sees all updates

    const updates = await prisma.appUpdate.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: includeInactive ? 50 : 10, // More for admin view
    });

    return NextResponse.json({
      success: true,
      data: updates,
    });
  } catch (error) {
    console.error('Error fetching app updates:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch app updates',
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

    // Check if user is admin
    if (!isAdmin(user.username)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, content, priority = 'normal', expiresAt } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const update = await prisma.appUpdate.create({
      data: {
        title,
        content,
        priority,
        createdBy: user.id,
        createdByUsername: user.username,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    // Log audit event
    await logAuditEvent({
      action: 'app_update_created',
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
    console.error('Error creating app update:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create app update',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

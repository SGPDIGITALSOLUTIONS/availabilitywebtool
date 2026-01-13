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

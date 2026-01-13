import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const forecastId = searchParams.get('id');

    if (!forecastId) {
      return NextResponse.json(
        { error: 'Forecast ID is required' },
        { status: 400 }
      );
    }

    // Delete forecast (cascade will delete clinic targets)
    await prisma.forecast.delete({
      where: { id: forecastId },
    });

    return NextResponse.json({
      success: true,
      message: 'Forecast deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting forecast:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete forecast',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

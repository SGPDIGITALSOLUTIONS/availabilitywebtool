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

    // Fetch all clients
    const clients = await prisma.client.findMany({
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch clients',
        message: error instanceof Error ? error.message : 'Unknown error',
        data: [], // Return empty array if error (for backward compatibility)
      },
      { status: 500 }
    );
  }
}

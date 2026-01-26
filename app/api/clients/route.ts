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

    // Fetch all clients - if table doesn't exist, return empty array
    try {
      const clients = await prisma.client.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return NextResponse.json({
        success: true,
        data: clients,
      });
    } catch (dbError: any) {
      // If Client table doesn't exist yet, return empty array (not an error)
      const errorMessage = dbError?.message || String(dbError);
      if (errorMessage.includes('does not exist') || 
          errorMessage.includes('Client') || 
          errorMessage.includes('client')) {
        console.log('[GET /api/clients] Client table does not exist, returning empty array');
        return NextResponse.json({
          success: true,
          data: [], // Return empty array if table doesn't exist
        });
      }
      // If it's a different error, re-throw it
      throw dbError;
    }
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

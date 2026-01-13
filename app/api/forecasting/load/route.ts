import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
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

    // If ID provided, return specific forecast
    if (forecastId) {
      const forecast = await prisma.forecast.findUnique({
        where: { id: forecastId },
        include: {
          clinicTargets: true,
        },
      });

      if (!forecast) {
        return NextResponse.json(
          { error: 'Forecast not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        forecast: {
          id: forecast.id,
          name: forecast.name,
          dateRangeStart: forecast.dateRangeStart.toISOString().split('T')[0],
          dateRangeEnd: forecast.dateRangeEnd.toISOString().split('T')[0],
          variables: {
            nhsTestValue: forecast.nhsTestValue,
            nhsEligiblePercent: forecast.nhsEligiblePercent,
            averageGos3Value: forecast.averageGos3Value,
            gos3EligiblePercent: forecast.gos3EligiblePercent,
          },
          clinicTargets: forecast.clinicTargets.map(ct => ({
            clinicName: ct.clinicName,
            targetClinics: ct.targetClinics,
            targetTests: ct.targetTests,
          })),
        },
      });
    }

    // Otherwise, return list of all forecasts
    const forecasts = await prisma.forecast.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to 50 most recent
      select: {
        id: true,
        name: true,
        dateRangeStart: true,
        dateRangeEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      forecasts: forecasts.map(f => ({
        id: f.id,
        name: f.name || 'Unnamed Forecast',
        dateRangeStart: f.dateRangeStart.toISOString().split('T')[0],
        dateRangeEnd: f.dateRangeEnd.toISOString().split('T')[0],
        createdAt: f.createdAt.toISOString(),
        updatedAt: f.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Error loading forecasts:', error);
    return NextResponse.json(
      {
        error: 'Failed to load forecasts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

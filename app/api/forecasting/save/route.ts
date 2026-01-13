import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // Check authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      name,
      dateRangeStart,
      dateRangeEnd,
      variables,
      targetClinics,
      targetTests,
    } = body;

    // Validate required fields
    if (!name || !dateRangeStart || !dateRangeEnd || !variables) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create forecast with clinic targets directly
    const forecast = await prisma.forecast.create({
      data: {
        name: name.trim(),
        dateRangeStart: new Date(dateRangeStart),
        dateRangeEnd: new Date(dateRangeEnd),
        nhsTestValue: variables.nhsTestValue || 0,
        nhsEligiblePercent: variables.nhsEligiblePercent || 0,
        averageGos3Value: variables.averageGos3Value || 0,
        gos3EligiblePercent: variables.gos3EligiblePercent || 0,
        clinicTargets: {
          create: Object.keys(targetClinics || {}).map(clinicName => ({
            clinicName,
            targetClinics: targetClinics[clinicName] || 0,
            targetTests: targetTests[clinicName] || 0,
          })),
        },
      },
      include: {
        clinicTargets: true,
      },
    });

    return NextResponse.json({
      success: true,
      forecastId: forecast.id,
      message: 'Forecast saved successfully',
    });
  } catch (error) {
    console.error('Error saving forecast:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      {
        error: 'Failed to save forecast',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

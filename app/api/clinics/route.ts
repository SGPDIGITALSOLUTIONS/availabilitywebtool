import { NextResponse } from 'next/server';
import { getAllClinics } from '@/lib/clinics';
import { ClinicScraper } from '@/lib/scraper';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

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

    console.log(`\n🌐 API /clinics called at ${new Date().toISOString()}`);

    // Extract date range from query parameters
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const forceRefresh = searchParams.get('force') === 'true';
    
    // Parse date range if provided
    let dateRange: { start: Date; end: Date } | null = null;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      dateRange = { start, end };
      console.log(`📅 Date range filter: ${startDate} to ${endDate}`);
    }

    const allClinics = getAllClinics();
    console.log(`📊 Found ${allClinics.length} clinics`);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      try {
        // Only use cache if DATABASE_URL is configured
        if (process.env.DATABASE_URL) {
          const cacheAgeThreshold = 60 * 60 * 1000; // 1 hour in milliseconds
          const now = new Date();
          
          // Fetch all cached clinics
          const cachedClinics = await prisma.clinicCache.findMany({
            where: {
              clinicName: { in: allClinics.map(c => c.name) },
            },
          });

        // Check if cache is fresh (less than 1 hour old)
        const isCacheFresh = cachedClinics.length === allClinics.length && 
          cachedClinics.every((cache: any) => {
            const age = now.getTime() - cache.lastScraped.getTime();
            return age < cacheAgeThreshold && !cache.error;
          });

        if (isCacheFresh) {
          console.log(`✅ Using cached data (${cachedClinics.length} clinics)`);
          
          // Filter shifts by date range if provided
          const clinicData = cachedClinics.map((cache: any) => {
            let shifts = cache.shifts as any[];
            
            // Apply date range filter if provided
            if (dateRange && shifts) {
              shifts = shifts.filter(shift => {
                try {
                  const shiftDate = new Date(shift.date);
                  shiftDate.setHours(0, 0, 0, 0);
                  return shiftDate >= dateRange!.start && shiftDate <= dateRange!.end;
                } catch {
                  return false;
                }
              });
            }
            
            return {
              clinic: cache.clinicName,
              shifts: shifts || [],
              lastUpdated: cache.lastUpdated.toISOString(),
              error: cache.error || undefined,
            };
          });

          return NextResponse.json({
            clinics: clinicData,
            cached: true,
            lastUpdated: Math.max(...cachedClinics.map((c: any) => c.lastScraped.getTime())),
          });
        } else {
          console.log(`⚠️  Cache is stale or incomplete, will use cached data but trigger background refresh`);
        }
        } else {
          console.log(`ℹ️  DATABASE_URL not configured, skipping cache check`);
        }
      } catch (error) {
        console.error(`⚠️  Cache check failed, falling back to live scrape:`, error);
      }
    }

    // If force refresh or cache miss, do live scrape
    if (forceRefresh) {
      console.log(`🔄 Force refresh requested, scraping live data...`);
    } else {
      console.log(`🔄 Cache miss or stale, scraping live data...`);
    }

    const scraper = new ClinicScraper();

    const startTime = Date.now();
    const clinicData = await scraper.scrapeAllClinics(allClinics, dateRange);
    const endTime = Date.now();

    console.log(`⚡ Total scraping completed in ${(endTime - startTime) / 1000}s`);
    return NextResponse.json({
      clinics: clinicData,
      cached: false,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ API /clinics error:`, error);
    console.error(`   Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    
    const errorDetails = {
      error: 'Failed to fetch clinic data',
      message: error instanceof Error ? error.message : 'Unknown error',
      debug: {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : null,
        isVercel: !!process.env.VERCEL,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeVersion: process.version,
        awsLambdaRuntime: process.env.AWS_LAMBDA_JS_RUNTIME || 'NOT SET - THIS MAY BE THE ISSUE!',
        timestamp: new Date().toISOString()
      }
    };
    console.error('❌ Full error details:', JSON.stringify(errorDetails, null, 2));
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
} 
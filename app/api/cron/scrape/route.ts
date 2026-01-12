import { NextResponse } from 'next/server';
import { getAllClinics } from '@/lib/clinics';
import { ClinicScraper } from '@/lib/scraper';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'A',location:'app/api/cron/scrape/route.ts:GET:entry',message:'Cron endpoint entry',data:{hasAuthHeader:!!request.headers.get('authorization'),hasCronSecret:!!process.env.CRON_SECRET,vercelEnv:process.env.VERCEL,nodeEnv:process.env.NODE_ENV},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  try {
    // Verify this is a cron request (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'A',location:'app/api/cron/scrape/route.ts:GET:unauthorized',message:'Unauthorized request',data:{},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`\n⏰ Cron job started at ${new Date().toISOString()}`);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'B',location:'app/api/cron/scrape/route.ts:GET:beforePrisma',message:'Before Prisma create',data:{hasDatabaseUrl:!!process.env.DATABASE_URL},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    // Create scrape job record
    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        status: 'running',
        clinicsScraped: 0,
      },
    });

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'B',location:'app/api/cron/scrape/route.ts:GET:afterPrismaCreate',message:'Prisma create success',data:{scrapeJobId:scrapeJob.id},timestamp:Date.now()})}).catch(()=>{});
    // #endregion

    try {
      const allClinics = getAllClinics();
      console.log(`📊 Found ${allClinics.length} clinics to scrape`);

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'C',location:'app/api/cron/scrape/route.ts:GET:beforeScrape',message:'Before scrapeAllClinics',data:{clinicCount:allClinics.length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      const scraper = new ClinicScraper();
      const startTime = Date.now();
      
      // Scrape all clinics (no date range filter for background jobs - get all data)
      const clinicData = await scraper.scrapeAllClinics(allClinics);
      const endTime = Date.now();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'C',location:'app/api/cron/scrape/route.ts:GET:afterScrape',message:'Scrape completed',data:{duration:(endTime-startTime)/1000,clinicCount:clinicData.length,errors:clinicData.filter(c=>c.error).length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      console.log(`⚡ Total scraping completed in ${(endTime - startTime) / 1000}s`);

      // Save results to cache
      let successCount = 0;
      for (const data of clinicData) {
        try {
          await prisma.clinicCache.upsert({
            where: { clinicName: data.clinic },
            create: {
              clinicName: data.clinic,
              shifts: data.shifts as any,
              lastUpdated: new Date(data.lastUpdated),
              lastScraped: new Date(),
              error: data.error || null,
            },
            update: {
              shifts: data.shifts as any,
              lastUpdated: new Date(data.lastUpdated),
              lastScraped: new Date(),
              error: data.error || null,
            },
          });
          if (!data.error) {
            successCount++;
          }
        } catch (error) {
          console.error(`❌ Failed to cache ${data.clinic}:`, error);
        }
      }

      // Update scrape job record
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          clinicsScraped: successCount,
        },
      });

      console.log(`✅ Cron job completed: ${successCount}/${allClinics.length} clinics cached successfully`);

      return NextResponse.json({
        success: true,
        message: `Scraped and cached ${successCount} clinics`,
        duration: (endTime - startTime) / 1000,
        clinicsScraped: successCount,
        totalClinics: allClinics.length,
      });
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'C',location:'app/api/cron/scrape/route.ts:GET:scrapeError',message:'Scrape error caught',data:{errorType:error instanceof Error ? error.constructor.name : typeof error,errorMessage:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      // Update scrape job record with error
      await prisma.scrapeJob.update({
        where: { id: scrapeJob.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      console.error(`❌ Cron job failed:`, error);
      return NextResponse.json(
        {
          success: false,
          error: 'Scraping failed',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'A',location:'app/api/cron/scrape/route.ts:GET:outerError',message:'Outer error caught',data:{errorType:error instanceof Error ? error.constructor.name : typeof error,errorMessage:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    console.error(`❌ Cron endpoint error:`, error);
    return NextResponse.json(
      {
        error: 'Failed to process cron job',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

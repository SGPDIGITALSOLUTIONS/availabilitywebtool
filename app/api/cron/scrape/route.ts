import { NextResponse } from 'next/server';
import { getAllClinics } from '@/lib/clinics';
import { ClinicScraper } from '@/lib/scraper';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Verify this is a cron request (optional but recommended)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`\n⏰ Cron job started at ${new Date().toISOString()}`);

    // Create scrape job record
    const scrapeJob = await prisma.scrapeJob.create({
      data: {
        status: 'running',
        clinicsScraped: 0,
      },
    });

    try {
      const allClinics = getAllClinics();
      console.log(`📊 Found ${allClinics.length} clinics to scrape`);

      const scraper = new ClinicScraper();
      const startTime = Date.now();
      
      // Scrape all clinics (no date range filter for background jobs - get all data)
      const clinicData = await scraper.scrapeAllClinics(allClinics);
      const endTime = Date.now();

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

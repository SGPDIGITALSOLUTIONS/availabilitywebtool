import { NextResponse } from 'next/server';
import { getAllClinics } from '@/lib/clinics';
import { ClinicScraper } from '@/lib/scraper';

export async function GET(request: Request) {
  try {
    console.log(`\n🌐 API /clinics called at ${new Date().toISOString()}`);

    // Always fetch fresh data (no cache)
    const allClinics = getAllClinics();
    console.log(`📊 Found ${allClinics.length} clinics to scrape`);

    const scraper = new ClinicScraper();

    const startTime = Date.now();
    const clinicData = await scraper.scrapeAllClinics(allClinics);
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

    return NextResponse.json(
      { 
        error: 'Failed to fetch clinic data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new Response(null, { status: 200 });
} 
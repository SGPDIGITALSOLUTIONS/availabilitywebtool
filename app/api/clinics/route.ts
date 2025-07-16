import { NextResponse } from 'next/server';
import { getAllClinics } from '@/lib/clinics';
import { ClinicScraper } from '@/lib/scraper';

// Cache for clinic data
let cachedData: any = null;
let lastCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function GET(request: Request) {
  try {
    console.log(`\n🌐 API /clinics called at ${new Date().toISOString()}`);
    
    // Check for force refresh parameter
    const url = new URL(request.url);
    const forceRefresh = url.searchParams.get('force') === 'true';
    
    // Check if we have valid cached data
    const now = Date.now();
    const cacheAge = cachedData ? (now - lastCacheTime) / 1000 : 0;
    
    if (!forceRefresh && cachedData && (now - lastCacheTime) < CACHE_DURATION) {
      console.log(`📦 Returning cached clinic data (${Math.round(cacheAge)}s old)`);
      return NextResponse.json({
        clinics: cachedData,
        cached: true,
        lastUpdated: new Date(lastCacheTime).toISOString()
      });
    }

    console.log(`🔄 ${forceRefresh ? 'Force refresh requested' : `Cache ${cachedData ? 'expired' : 'empty'}`} - fetching fresh clinic data...`);
    
    // Get all clinics and scrape them
    const allClinics = getAllClinics();
    console.log(`📊 Found ${allClinics.length} clinics to scrape`);
    
    const scraper = new ClinicScraper();
    
    // Scrape all clinics in parallel
    const startTime = Date.now();
    const clinicData = await scraper.scrapeAllClinics(allClinics);
    const endTime = Date.now();
    
    console.log(`⚡ Total scraping completed in ${(endTime - startTime) / 1000}s`);
    
    // Update cache
    cachedData = clinicData;
    lastCacheTime = now;
    
    console.log(`💾 Cache updated with fresh data`);
    
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
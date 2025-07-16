import { NextResponse } from 'next/server';
import { getAllClinics } from '@/lib/clinics';
import { ClinicScraper } from '@/lib/scraper';

export async function GET(
  request: Request,
  { params }: { params: { clinicName: string } }
) {
  try {
    const clinicName = decodeURIComponent(params.clinicName);
    console.log(`\n🌐 API /clinics/${clinicName}/rota called at ${new Date().toISOString()}`);
    
    // Find the clinic configuration
    const allClinics = getAllClinics();
    const clinic = allClinics.find(c => c.name === clinicName);
    
    if (!clinic) {
      console.log(`❌ Clinic "${clinicName}" not found in configuration`);
      console.log(`📋 Available clinics: ${allClinics.map(c => c.name).join(', ')}`);
      return NextResponse.json(
        { error: 'Clinic not found' },
        { status: 404 }
      );
    }

    console.log(`🔄 Fetching shift data for ${clinicName}...`);
    
    // Use the simplified scraper to get shift data
    const scraper = new ClinicScraper();
    const startTime = Date.now();
    const scrapedData = await scraper.scrapeClinic(clinic);
    const endTime = Date.now();
    
    console.log(`⚡ Scraping completed for ${clinicName} in ${(endTime - startTime) / 1000}s`);
    console.log(`✨ API returning ${scrapedData.shifts.length} shifts for ${clinicName}`);
    
    return NextResponse.json({
      clinic: clinicName,
      shifts: scrapedData.shifts,
      lastUpdated: scrapedData.lastUpdated,
      error: scrapedData.error,
      dataSource: 'live'
    });
    
  } catch (error) {
    console.error(`❌ API /clinics/${params.clinicName}/rota error:`, error);
    console.error(`   Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch rota data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 
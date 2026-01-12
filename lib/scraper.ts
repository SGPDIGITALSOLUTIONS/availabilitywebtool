import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { ClinicStatus, Clinic } from './clinics';

export interface ShiftData {
  date: string;
  time: string;
  jobRoles: string[];
}

export interface ScrapedClinicData {
  clinic: string;
  shifts: ShiftData[];
  lastUpdated: string;
  error?: string;
}

export class ClinicScraper {
  private readonly timeout = 10000; // For regular fetch (not used with Puppeteer)
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async scrapeClinic(clinic: Clinic, dateRange?: { start: Date; end: Date } | null, browser?: any): Promise<ScrapedClinicData> {
    const isEdinburgh = clinic.name.toLowerCase().includes('edinburgh');
    const shouldCloseBrowser = !browser; // Only close browser if we created it
    try {
      console.log(`\n🔍 Scraping ${clinic.name}...`);
      console.log(`📍 URL: ${clinic.url}`);
      // #region agent log
      if(isEdinburgh){fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-edinburgh',hypothesisId:'A',location:'lib/scraper.ts:scrapeClinic:start',message:'Edinburgh scrape start',data:{name:clinic.name,url:clinic.url,dateRange:dateRange ? {start:dateRange.start.toISOString(),end:dateRange.end.toISOString()} : null},timestamp:Date.now()})}).catch(()=>{});}
      // #endregion
      
      let htmlText: string;
      
      // Use Puppeteer for all clinics to handle JavaScript-rendered content
      console.log(`🌐 Using Puppeteer for ${clinic.name} to handle JavaScript-rendered content...`);
      // #region agent log
      if(isEdinburgh){fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-edinburgh',hypothesisId:'A',location:'lib/scraper.ts:scrapeClinic:puppeteerStart',message:'Edinburgh Puppeteer start',data:{clinic:clinic.name},timestamp:Date.now()})}).catch(()=>{});}
      // #endregion
      
      // Create browser if not provided (for backward compatibility)
      if (!browser) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'D',location:'lib/scraper.ts:scrapeClinic:beforeBrowserLaunch',message:'Before browser launch',data:{isVercel:!!process.env.VERCEL,clinic:clinic.name},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        try {
      // Use Vercel-compatible Puppeteer on Vercel, regular Puppeteer locally
      if (process.env.VERCEL) {
        // Dynamic import to avoid webpack parsing issues with private class fields
        const puppeteerCore = (await import('puppeteer-core')).default;
        const chromium = await import('@sparticuz/chromium');
        
        console.log('🔧 [Scraper] Configuring Chromium for Vercel (shared browser)...');
        console.log('🔧 [Scraper] Environment check:', {
          isVercel: !!process.env.VERCEL,
          nodeVersion: process.version,
          awsLambdaRuntime: process.env.AWS_LAMBDA_JS_RUNTIME || 'NOT SET',
          hasChromium: !!chromium.default,
          hasSetGraphicsMode: 'setGraphicsMode' in chromium.default
        });
        
        // IMPORTANT: Set graphics mode to false BEFORE getting executable path
        // This is critical for @sparticuz/chromium to work in serverless
        chromium.default.setGraphicsMode = false;
        console.log('🔧 [Scraper] Set graphics mode to false');
        
        const executablePath = await chromium.default.executablePath();
        console.log('🔧 [Scraper] Got executable path:', executablePath?.substring(0, 80) + '...');
        console.log('🔧 [Scraper] Chromium args count:', chromium.default.args?.length || 0);
        console.log('🔧 [Scraper] Chromium args (first 5):', chromium.default.args?.slice(0, 5));
        
        // Configure Chromium for Vercel with additional args for serverless
        // These args help Chromium work in Lambda/serverless environments
        const launchArgs = [
          ...chromium.default.args,
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-software-rasterizer',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
        ];
        
        console.log('🔧 [Scraper] Launching shared browser with', launchArgs.length, 'args');
        console.log('🔧 [Scraper] Launch config:', {
          executablePath: executablePath?.substring(0, 50) + '...',
          headless: chromium.default.headless,
          argsCount: launchArgs.length
        });
        
        browser = await puppeteerCore.launch({
          args: launchArgs,
          defaultViewport: chromium.default.defaultViewport,
          executablePath: executablePath,
          headless: chromium.default.headless,
        });
        console.log('✅ [Scraper] Shared browser launched successfully');
          } else {
            // Local development - use regular Puppeteer
            browser = await puppeteer.launch({ 
              headless: true, 
              args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-images',
                '--disable-plugins',
                '--disable-extensions'
              ]
            });
          }
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'D',location:'lib/scraper.ts:scrapeClinic:browserLaunchSuccess',message:'Browser launch success',data:{clinic:clinic.name,isVercel:!!process.env.VERCEL},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        } catch (launchError) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'D',location:'lib/scraper.ts:scrapeClinic:browserLaunchError',message:'Browser launch error',data:{clinic:clinic.name,isVercel:!!process.env.VERCEL,errorType:launchError instanceof Error ? launchError.constructor.name : typeof launchError,errorMessage:launchError instanceof Error ? launchError.message : String(launchError),errorStack:launchError instanceof Error ? launchError.stack : null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      const errorMsg = launchError instanceof Error ? launchError.message : String(launchError);
      console.error(`❌ [Scraper] Browser launch failed for ${clinic.name}:`, {
        error: errorMsg,
        clinic: clinic.name,
        isVercel: !!process.env.VERCEL,
        nodeVersion: process.version,
        timestamp: new Date().toISOString()
      });
      throw launchError;
        }
      }
      
      try {
        const page = await browser.newPage();
        
        // Optimize page loading - disable images, CSS, fonts for faster loading (but keep JavaScript!)
        await page.setRequestInterception(true);
        page.on('request', (req: any) => {
          const resourceType = req.resourceType();
          if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
            req.abort();
          } else {
            req.continue();
          }
        });
        
        await page.setUserAgent(this.userAgent);
        // Use 'domcontentloaded' instead of 'networkidle2' for faster loading, then wait for content
        await page.goto(clinic.url, { waitUntil: 'domcontentloaded' });
        // Wait for JavaScript to render dates - wait for table content to appear
        try {
          await page.waitForSelector('table');
        } catch (e) {
          // Table might not exist, continue anyway
        }
        // Additional wait for JavaScript to update dates
        await new Promise(resolve => setTimeout(resolve, 3000));
        htmlText = await page.content();
        await page.close(); // Close page, not browser
        console.log(`✅ Puppeteer fetched HTML: ${htmlText.length} characters`);
        // #region agent log
        if(isEdinburgh){fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-edinburgh',hypothesisId:'A',location:'lib/scraper.ts:scrapeClinic:puppeteerSuccess',message:'Edinburgh Puppeteer success',data:{clinic:clinic.name,htmlLength:htmlText.length},timestamp:Date.now()})}).catch(()=>{});}
        // #endregion
      } catch (error) {
        // #region agent log
        if(isEdinburgh){fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-edinburgh',hypothesisId:'A',location:'lib/scraper.ts:scrapeClinic:puppeteerError',message:'Edinburgh Puppeteer error',data:{clinic:clinic.name,error:error instanceof Error ? error.message : String(error)},timestamp:Date.now()})}).catch(()=>{});}
        // #endregion
        throw error;
      } finally {
        // Only close browser if we created it
        if (shouldCloseBrowser && browser) {
          await browser.close();
        }
      }
      console.log(`📄 Content Length: ${htmlText.length} characters`);
      // #region agent log
      if(isEdinburgh){
        // Extract a sample of the HTML to see what dates are actually in it
        const dateMatches = htmlText.match(/Monday\s+\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/gi);
        const sampleDates = dateMatches ? dateMatches.slice(0, 5) : [];
        // Also check for 2026 dates specifically
        const dateMatches2026 = htmlText.match(/Monday\s+\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+2026/gi);
        const sampleDates2026 = dateMatches2026 ? dateMatches2026.slice(0, 5) : [];
        // Extract a sample of the actual table HTML to see the structure
        const tableMatch = htmlText.match(/<table[^>]*>[\s\S]{0,2000}<\/table>/i);
        const tableSample = tableMatch ? tableMatch[0].substring(0, 500) : null;
        fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-edinburgh',hypothesisId:'A',location:'lib/scraper.ts:scrapeClinic:htmlContent',message:'Edinburgh HTML received',data:{htmlLength:htmlText.length,sampleDates,sampleDates2026,has2026Dates:dateMatches2026 && dateMatches2026.length > 0,tableSample},timestamp:Date.now()})}).catch(()=>{});
      }
      // #endregion

      const $ = cheerio.load(htmlText);
      
      // Log some basic HTML structure info
      const tableCount = $('table').length;
      const rowCount = $('tr').length;
      const cellCount = $('td, th').length;
      
      console.log(`📊 HTML Structure:`);
      console.log(`   - Tables found: ${tableCount}`);
      console.log(`   - Rows found: ${rowCount}`);
      console.log(`   - Cells found: ${cellCount}`);
      
      // Extract shift data (with date range filtering during extraction)
      const shifts = this.extractShiftData($, clinic.name, dateRange);

      console.log(`✨ Final result for ${clinic.name}: ${shifts.length} shifts extracted`);
      // #region agent log
      if(isEdinburgh){fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-edinburgh',hypothesisId:'C',location:'lib/scraper.ts:scrapeClinic:success',message:'Edinburgh scrape success',data:{shiftsCount:shifts.length,shifts:shifts.map(s=>({date:s.date,time:s.time,roles:s.jobRoles.length}))},timestamp:Date.now()})}).catch(()=>{});}
      // #endregion
      
      return {
        clinic: clinic.name,
        shifts,
        lastUpdated: new Date().toISOString(),
      };

    } catch (error) {
      console.error(`❌ Error scraping ${clinic.name}:`, error);
      console.error(`   Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
      console.error(`   Error message: ${error instanceof Error ? error.message : String(error)}`);
      // #region agent log
      if(isEdinburgh){fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-edinburgh',hypothesisId:'A',location:'lib/scraper.ts:scrapeClinic:error',message:'Edinburgh scrape error',data:{errorType:error instanceof Error ? error.constructor.name : typeof error,errorMessage:error instanceof Error ? error.message : String(error)},timestamp:Date.now()})}).catch(()=>{});}
      // #endregion
      
      return {
        clinic: clinic.name,
        shifts: [],
        lastUpdated: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private extractShiftData($: cheerio.CheerioAPI, clinicName: string, dateRange?: { start: Date; end: Date } | null): ShiftData[] {
    const shifts: ShiftData[] = [];
    console.log(`\n🔄 Extracting shift data for ${clinicName}...`);
    let consecutiveOutOfRange = 0; // Track consecutive shifts outside date range for early exit
    let shouldStopProcessing = false; // Flag to stop processing rows

    try {
      // Narrow to tables that look like the rota (header contains "Shift Date")
      const rotaTables = $('table').filter((_, tbl) => {
        const headerText = $(tbl).find('th').text().toLowerCase();
        return headerText.includes('shift date');
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run2',hypothesisId:'E',location:'lib/scraper.ts:tables',message:'Tables detected',data:{clinic:clinicName,rotaTables:rotaTables.length,totalTables:$('table').length},timestamp:Date.now()})}).catch(()=>{});
      // #endregion

      const tablesToProcess = rotaTables.length > 0 ? rotaTables : $('table');
      if (rotaTables.length === 0) {
        console.log('⚠️  No explicit rota table found, falling back to all tables');
      }
      // #region agent log
      const isEdinburgh = clinicName.toLowerCase().includes('edinburgh');
      if(isEdinburgh){fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-edinburgh',hypothesisId:'B',location:'lib/scraper.ts:extractShiftData:tables',message:'Edinburgh table detection',data:{rotaTables:rotaTables.length,totalTables:$('table').length,usingFallback:rotaTables.length===0},timestamp:Date.now()})}).catch(()=>{});}
      // #endregion

      tablesToProcess.each((tableIndex, table) => {
        const $table = $(table);
        console.log(`\n📋 Processing table ${tableIndex + 1}...`);
        
        // Log table structure
        const tableRows = $table.find('tr').length;
        console.log(`   - Rows in table: ${tableRows}`);
        // #region agent log
        const headerText = $table.find('th').text().trim();
        fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run2',hypothesisId:'E',location:'lib/scraper.ts:tableHeader',message:'Table header text',data:{clinic:clinicName,tableIndex:tableIndex+1,header:headerText},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
        
        // Process each row in the table
        // Convert to array so we can break early
        const rows = $table.find('tr').toArray();
        for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
          // Early exit if we've determined we're past all relevant shifts
          if (shouldStopProcessing) {
            console.log(`   ⏭️  Stopping row processing at row ${rowIndex + 1} (early exit triggered)`);
            break; // Stop iterating
          }
          
          const row = rows[rowIndex];
          const $row = $(row);
          const cells = $row.find('td, th');
          
          if (cells.length === 0) {
            console.log(`   ⚠️  Row ${rowIndex + 1}: No cells found`);
            continue;
          }

          console.log(`\n   🔍 Row ${rowIndex + 1} (${cells.length} cells):`);

          let shiftDate = '';
          let shiftTime = '';
          const jobRoles: string[] = [];

          cells.each((cellIndex, cell) => {
            const $cell = $(cell);
            // Strip scripts/styles/noscript and normalize whitespace to avoid hidden date noise
            const cellText = $cell
              .clone()
              .find('script, style, noscript')
              .remove()
              .end()
              .text()
              .replace(/\s+/g, ' ')
              .trim();
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'A',location:'lib/scraper.ts:cell',message:'Cell text parsed',data:{clinic:clinicName,row:rowIndex+1,cell:cellIndex+1,text:cellText},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            
            console.log(`      Cell ${cellIndex + 1}: "${cellText}"`);

            // Extract date and time ONLY from first column (column 1)
            if (cellIndex === 0) {
              console.log(`      🕒 Checking for date/time in column 1 (cell ${cellIndex + 1})...`);
              
              const dateMatch = this.extractDate(cellText);
              const timeMatch = this.extractTime(cellText);
              
              if (dateMatch) {
                console.log(`      ✅ Date found: "${dateMatch}" (raw cell: "${cellText}")`);
                shiftDate = dateMatch;
                // #region agent log
                const isEdinburgh = clinicName.toLowerCase().includes('edinburgh');
                fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:isEdinburgh?'run-edinburgh':'run1',hypothesisId:isEdinburgh?'C':'B',location:'lib/scraper.ts:dateMatch',message:isEdinburgh?'Edinburgh date matched':'Date matched',data:{clinic:clinicName,row:rowIndex+1,cell:cellIndex+1,dateMatch,rawCell:cellText},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
              }
              if (timeMatch) {
                console.log(`      ✅ Time found: "${timeMatch}"`);
                shiftTime = timeMatch;
              }
              
              if (!dateMatch && !timeMatch) {
                console.log(`      ❌ No date/time patterns matched in column 1`);
              }
            }

            // Extract job roles from brackets in "Volunteers Confirmed" content
            const rolesInBrackets = this.extractJobRolesFromBrackets(cellText);
            if (rolesInBrackets.length > 0) {
              console.log(`      💼 Job roles found: [${rolesInBrackets.join(', ')}]`);
              jobRoles.push(...rolesInBrackets);
            }
          });

          // Add shift if we have date/time, regardless of staff booking
          if (shiftDate || shiftTime) {
            // Create a more descriptive date string that includes day name and full date
            let displayDate = shiftDate || this.getTodayDate();

            // Preserve the year from the extracted date if it's already in ISO format (YYYY-MM-DD)
            // Only infer/force year for dates without explicit year
            const isoWithYear = shiftDate && shiftDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
            const shortDdMm = shiftDate && shiftDate.match(/^(\d{1,2})\/(\d{1,2})$/);
            const daynameDdMm = shiftDate && shiftDate.match(/^[A-Za-z]+\s+(\d{1,2})\/(\d{1,2})$/);
            const fullDayMonthYear = shiftDate && shiftDate.match(/^[A-Za-z]+\s+(\d{1,2})\s+[A-Za-z]+\s+(\d{4})/);

            let normalizedIso: string | null = null;

            if (isoWithYear) {
              // Preserve the year from ISO format - don't override it
              normalizedIso = shiftDate; // Already in correct format
              // #region agent log
              const isEdinburgh = clinicName.toLowerCase().includes('edinburgh');
              if(isEdinburgh){fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run-edinburgh',hypothesisId:'C',location:'lib/scraper.ts:normalize:preserveYear',message:'Edinburgh preserving year',data:{clinic:clinicName,row:rowIndex+1,shiftDate,normalizedIso},timestamp:Date.now()})}).catch(()=>{});}
              // #endregion
            } else if (shortDdMm) {
              // Date without year - infer year intelligently
              const day = parseInt(shortDdMm[1], 10);
              const month = parseInt(shortDdMm[2], 10);
              const inferredYear = this.inferYear(month, day);
              normalizedIso = this.normalizeDate(shortDdMm[1], shortDdMm[2], inferredYear.toString());
            } else if (daynameDdMm) {
              // Day name with partial date - infer year intelligently
              const day = parseInt(daynameDdMm[1], 10);
              const month = parseInt(daynameDdMm[2], 10);
              const inferredYear = this.inferYear(month, day);
              normalizedIso = this.normalizeDate(daynameDdMm[1], daynameDdMm[2], inferredYear.toString());
            } else if (fullDayMonthYear) {
              // Full textual date with year - preserve the year from the match
              try {
                const year = fullDayMonthYear[3]; // Extract year from match
                const parsed = new Date(shiftDate);
                const month = (parsed.getMonth() + 1).toString().padStart(2, '0');
                const day = parsed.getDate().toString().padStart(2, '0');
                normalizedIso = `${year}-${month}-${day}`;
              } catch {
                normalizedIso = null;
              }
            }

            if (normalizedIso) {
              try {
                const dateObj = new Date(normalizedIso);
                const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
                const shortDate = dateObj.toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'numeric',
                  year: 'numeric'
                });
                displayDate = `${dayName} ${shortDate}`;
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run1',hypothesisId:'C',location:'lib/scraper.ts:normalized',message:'Normalized ISO applied',data:{clinic:clinicName,row:rowIndex+1,normalizedIso,displayDate},timestamp:Date.now()})}).catch(()=>{});
                // #endregion
              } catch (error) {
                // Keep existing displayDate if formatting fails
                console.log(`      ⚠️  Date normalization failed for ${normalizedIso}, keeping original`);
              }
            }
            
            // Drop past raw dates before adding (prevents historic rows inflating counts)
            if (shiftDate) {
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              // Use normalizedIso when available to reflect forced/parsed year; fallback to raw
              const candidateDateStr = normalizedIso || shiftDate;
              let candidateDate: Date | null = null;
              try {
                candidateDate = new Date(candidateDateStr);
              } catch {
                candidateDate = null;
              }

              if (candidateDate) {
                candidateDate.setHours(0, 0, 0, 0);
                if (candidateDate < today) {
                  // #region agent log
                  const isEdinburgh = clinicName.toLowerCase().includes('edinburgh');
                  fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:isEdinburgh?'run-edinburgh':'run6',hypothesisId:isEdinburgh?'D':'J',location:'lib/scraper.ts:skipPast',message:isEdinburgh?'Edinburgh skipping past shift':'Skipping past shift',data:{clinic:clinicName,row:rowIndex+1,rawDate:shiftDate,normalizedIso,candidateDate:candidateDate.toISOString(),today:today.toISOString(),isPast:candidateDate<today},timestamp:Date.now()})}).catch(()=>{});
                  // #endregion
                  continue;
                }
              }
            }

            // If we have a normalized ISO, use it as the stored date; otherwise fallback to displayDate
            const finalDate = normalizedIso || displayDate;
            
            // Filter by date range if provided (during scraping for performance)
            if (dateRange && finalDate) {
              let shiftDateObj: Date | null = null;
              try {
                // Try to parse the final date
                shiftDateObj = new Date(finalDate);
                if (isNaN(shiftDateObj.getTime())) {
                  // If parsing fails, try parsing the normalized ISO or raw date
                  shiftDateObj = normalizedIso ? new Date(normalizedIso) : (shiftDate ? new Date(shiftDate) : null);
                }
              } catch {
                shiftDateObj = null;
              }
              
              if (shiftDateObj) {
                shiftDateObj.setHours(0, 0, 0, 0);
                // Check if shift date is within the selected range
                if (shiftDateObj < dateRange.start || shiftDateObj > dateRange.end) {
                  consecutiveOutOfRange++;
                  // If we've seen 5 consecutive shifts outside the range and we're past the end date,
                  // assume we've passed all relevant shifts and can stop processing
                  if (shiftDateObj > dateRange.end && consecutiveOutOfRange >= 5) {
                    console.log(`   ⏭️  Early exit: Found ${consecutiveOutOfRange} consecutive shifts after end date, stopping extraction`);
                    shouldStopProcessing = true; // Signal to stop processing rows
                    continue; // Skip this shift
                  }
                  // #region agent log
                  const isEdinburgh = clinicName.toLowerCase().includes('edinburgh');
                  fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:isEdinburgh?'run-edinburgh':'run5',hypothesisId:isEdinburgh?'C':'H',location:'lib/scraper.ts:dateRangeFilter',message:isEdinburgh?'Edinburgh shift filtered by date range':'Shift filtered by date range',data:{clinic:clinicName,row:rowIndex+1,finalDate,shiftDateObj:shiftDateObj.toISOString(),startDate:dateRange.start.toISOString(),endDate:dateRange.end.toISOString(),inRange:false,consecutiveOutOfRange},timestamp:Date.now()})}).catch(()=>{});
                  // #endregion
                  continue; // Skip this shift - outside date range
                } else {
                  // Reset counter when we find a shift in range
                  consecutiveOutOfRange = 0;
                }
              }
            }
            
            // #region agent log
            const isEdinburgh = clinicName.toLowerCase().includes('edinburgh');
            fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:isEdinburgh?'run-edinburgh':'run5',hypothesisId:isEdinburgh?'C':'H',location:'lib/scraper.ts:finalShift',message:isEdinburgh?'Edinburgh shift recorded':'Shift recorded',data:{clinic:clinicName,row:rowIndex+1,rawDate:shiftDate||null,rawTime:shiftTime||null,finalDate,shiftTime,jobRoles},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            
            const shift = {
              // Store ISO when available so API consumers get an unambiguous date
              date: finalDate,
              time: shiftTime || '',
              jobRoles
            };
            console.log(`      ✨ Adding shift: Date="${shift.date}", Time="${shift.time}", Roles=[${shift.jobRoles.join(', ')}]`);
            shifts.push(shift);
          } else {
            console.log(`      ⚠️  Row skipped - insufficient data (date/time: ${!!(shiftDate || shiftTime)}, roles: ${jobRoles.length})`);
          }
        }
      });

    } catch (error) {
      console.error('❌ Error extracting shift data:', error);
    }

    console.log(`\n📊 Summary for ${clinicName}: ${shifts.length} shifts extracted`);
    const uniqueDates = Array.from(new Set(shifts.map(s => s.date)));
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'run6',hypothesisId:'I',location:'lib/scraper.ts:clinicSummary',message:'Clinic shifts summary',data:{clinic:clinicName,shiftCount:shifts.length,uniqueDates:uniqueDates.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    shifts.forEach((shift, index) => {
      console.log(`   ${index + 1}. ${shift.date} ${shift.time} - [${shift.jobRoles.join(', ')}]`);
    });

    return shifts;
  }

  private containsDateTime(text: string): boolean {
    const lowerText = text.toLowerCase();
    const hasDateWord = lowerText.includes('date');
    const hasTimeWord = lowerText.includes('time');
    const hasTimePattern = /\d{1,2}[:\-\/]\d{1,2}/.test(text);
    const hasDayName = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(text);
    
    const result = hasDateWord || hasTimeWord || hasTimePattern || hasDayName;
    
    if (result) {
      console.log(`         🕒 DateTime detected in "${text}" - date word: ${hasDateWord}, time word: ${hasTimeWord}, time pattern: ${hasTimePattern}, day name: ${hasDayName}`);
    }
    
    return result;
  }

  private extractDate(text: string): string | null {
    console.log(`         📅 Extracting date from: "${text}"`);
    
    const datePatterns = [
      // Prioritize patterns with actual dates first
      // Day name with full date and year (e.g. "Monday 5 January 2026 10:00" or "Wednesday 14 January 2026")
      // More flexible pattern to handle various whitespace and formatting
      { name: 'Day DD Month YYYY', pattern: /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)[\s\W]*(\d{1,2})[\s\W]+(january|february|march|april|may|june|july|august|september|october|november|december)[\s\W]+(\d{4})/i },
      // Day name with full date patterns (highest priority)
      { name: 'Day DD/MM/YYYY', pattern: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^\d]*(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/i },
      { name: 'Day DD/MM', pattern: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^\d]*(\d{1,2})[\/-](\d{1,2})/i },
      { name: 'Day DD Month', pattern: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)[^\d]*(\d{1,2})[^\d]+(january|february|march|april|may|june|july|august|september|october|november|december)/i },
      
      // Pure date formats (second priority)
      { name: 'DD/MM/YYYY', pattern: /(\d{1,2})\/(\d{1,2})\/(\d{4})/ },
      { name: 'DD-MM-YYYY', pattern: /(\d{1,2})-(\d{1,2})-(\d{4})/ },
      { name: 'DD.MM.YYYY', pattern: /(\d{1,2})\.(\d{1,2})\.(\d{4})/ },
      { name: 'YYYY-MM-DD', pattern: /(\d{4})-(\d{1,2})-(\d{1,2})/ },
      { name: 'DD/MM', pattern: /(\d{1,2})\/(\d{1,2})/ },
      { name: 'DD-MM', pattern: /(\d{1,2})-(\d{1,2})/ },
      
      // Month names with dates
      { name: 'DD Month YYYY', pattern: /(\d{1,2})[^\d]+(january|february|march|april|may|june|july|august|september|october|november|december)[^\d]+(\d{4})/i },
      { name: 'Month DD, YYYY', pattern: /(january|february|march|april|may|june|july|august|september|october|november|december)[^\d]+(\d{1,2})[^\d]+(\d{4})/i }
    ];

    for (const { name, pattern } of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        console.log(`         ✅ Date pattern matched (${name}): ${match[0]}`);
        
        // Day with explicit DD Month YYYY (used by some clinic rotas, e.g. Edinburgh Skylight)
        // This MUST be checked first to preserve the year
        if (name === 'Day DD Month YYYY' && match[1] && match[2] && match[3]) {
          try {
            // Create a properly formatted match array for parseMonthDate
            // match[1] = day, match[2] = month name, match[3] = year
            const formattedMatch = [match[0], match[1], match[2], match[3]] as RegExpMatchArray;
            const result = this.parseMonthDate(formattedMatch, 'DD Month YYYY');
            if (result) {
              console.log(`         📅 Day DD Month YYYY "${match[0]}" normalized to: ${result}`);
              return result;
            } else {
              console.log(`         ⚠️  parseMonthDate returned null for "${match[0]}"`);
            }
          } catch (error) {
            console.log(`         ❌ Error parsing Day DD Month YYYY: ${error}`);
          }
        } else if (name.includes('Day DD/MM/YYYY') && match[1] && match[2] && match[3] && match[4]) {
          // Day with full date - use the date part and preserve day name
          const result = this.normalizeDate(match[2], match[3], match[4]);
          console.log(`         📅 Day with full date "${match[1]} ${match[2]}/${match[3]}/${match[4]}" normalized to: ${result}`);
          return result;
        } else if (name.includes('Day DD/MM') && match[1] && match[2] && match[3]) {
          // Day with partial date - infer year intelligently
          const day = parseInt(match[2], 10);
          const month = parseInt(match[3], 10);
          const inferredYear = this.inferYear(month, day);
          const result = this.normalizeDate(match[2], match[3], inferredYear.toString());
          console.log(`         📅 Day with partial date "${match[1]} ${match[2]}/${match[3]}" inferred year ${inferredYear}, normalized to: ${result}`);
          return result;
        } else if (name === 'Day DD Month' && match[1] && match[2]) {
          // Day with month name but no year - infer year intelligently
          const months: Record<string, number> = {
            january: 1, february: 2, march: 3, april: 4,
            may: 5, june: 6, july: 7, august: 8,
            september: 9, october: 10, november: 11, december: 12
          };
          const day = parseInt(match[1], 10);
          const monthNum = months[match[2].toLowerCase()];
          if (monthNum) {
            const inferredYear = this.inferYear(monthNum, day);
            const month = monthNum.toString().padStart(2, '0');
            const dayStr = day.toString().padStart(2, '0');
            const result = `${inferredYear}-${month}-${dayStr}`;
            console.log(`         📅 Day DD Month "${match[0]}" inferred year ${inferredYear}, normalized to: ${result}`);
            return result;
          }
        } else if (name.includes('Month') && match.length >= 3) {
          // Handle month names with year
          const result = this.parseMonthDate(match, name);
          if (result) {
            console.log(`         📅 Month date "${match[0]}" converted to: ${result}`);
            return result;
          }
        } else if (name.includes('DD/MM') && match[1] && match[2]) {
          // DD/MM format - infer year intelligently
          const day = parseInt(match[1], 10);
          const month = parseInt(match[2], 10);
          const inferredYear = this.inferYear(month, day);
          const result = this.normalizeDate(match[1], match[2], inferredYear.toString());
          console.log(`         📅 DD/MM date "${match[1]}/${match[2]}" inferred year ${inferredYear}, normalized to: ${result}`);
          return result;
        } else if (match[1] && match[2] && match[3]) {
          // Three-part numeric date
          const result = this.normalizeDate(match[1], match[2], match[3]);
          console.log(`         📅 Three-part numeric date normalized to: ${result}`);
          return result;
        }
      }
    }
    
    console.log(`         ❌ No date patterns matched in: "${text}"`);
    return null;
  }

  private extractTime(text: string): string | null {
    console.log(`         🕐 Extracting time from: "${text}"`);
    
    const timePatterns = [
      { name: 'HH:MM AM/PM', pattern: /(\d{1,2}):(\d{2})\s*(am|pm)?/i },
      { name: 'H AM/PM', pattern: /(\d{1,2})\s*(am|pm)/i },
      { name: 'HH.MM', pattern: /(\d{1,2})\.(\d{2})/ },
      { name: 'HH:MM', pattern: /(\d{1,2}):(\d{2})/ }
    ];

    for (const { name, pattern } of timePatterns) {
      const match = text.match(pattern);
      if (match) {
        console.log(`         ✅ Time pattern matched (${name}): ${match[0]}`);
        
        let hour = parseInt(match[1]);
        const minute = match[2] ? parseInt(match[2]) : 0;
        const period = match[3] || match[2];

        console.log(`         🔄 Converting: ${hour}:${minute} ${period || 'no period'}`);

        // Convert to 24-hour format
        if (period && period.toLowerCase() === 'pm' && hour !== 12) {
          hour += 12;
        } else if (period && period.toLowerCase() === 'am' && hour === 12) {
          hour = 0;
        }

        const result = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        console.log(`         🕐 Time converted to 24h format: ${result}`);
        return result;
      }
    }
    
    console.log(`         ❌ No time patterns matched in: "${text}"`);
    return null;
  }

  private extractJobRolesFromBrackets(text: string): string[] {
    const roles: string[] = [];

    // Look for content in brackets/parentheses which should contain job roles
    const bracketMatches = text.match(/\(([^)]+)\)/g) || [];
    const squareBracketMatches = text.match(/\[([^\]]+)\]/g) || [];

    [...bracketMatches, ...squareBracketMatches].forEach(match => {
      const content = match.replace(/[\(\)\[\]]/g, '').trim();
      if (content && content.length > 0) {
        const splitRoles = content.split(/[,;&|]/).map(role => role.trim()).filter(role => role.length > 0);
        roles.push(...splitRoles);
      }
    });

    return roles;
  }

  private parseMonthDate(match: RegExpMatchArray, patternName: string): string | null {
    const months = {
      january: '01', february: '02', march: '03', april: '04',
      may: '05', june: '06', july: '07', august: '08',
      september: '09', october: '10', november: '11', december: '12'
    };

    try {
      if (patternName.includes('DD Month YYYY')) {
        // Format: "DD Month YYYY" -> match[1] = day, match[2] = month, match[3] = year
        const day = match[1].padStart(2, '0');
        const month = months[match[2].toLowerCase() as keyof typeof months];
        const year = match[3];
        return month ? `${year}-${month}-${day}` : null;
      } else if (patternName.includes('Month DD, YYYY')) {
        // Format: "Month DD, YYYY" -> match[1] = month, match[2] = day, match[3] = year
        const month = months[match[1].toLowerCase() as keyof typeof months];
        const day = match[2].padStart(2, '0');
        const year = match[3];
        return month ? `${year}-${month}-${day}` : null;
      }
    } catch (error) {
      console.log(`         ❌ Error parsing month date: ${error}`);
    }

    return null;
  }

  private inferYear(month: number, day: number): number {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12
    const currentDay = today.getDate();
    
    // Create a date with the inferred year (try current year first)
    const testDate = new Date(currentYear, month - 1, day);
    
    // Calculate days difference
    const daysDiff = Math.floor((testDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // If the date would be in the past (even by 1 day), assume next year
    // This handles: we're in Dec 18 2025, see "December 17" → should be 2026 (not 2025)
    if (daysDiff < 0) {
      return currentYear + 1;
    }
    
    // If we're in November or December (last 2 months of year), assume ALL dates are next year
    // This is because rotas typically show future planning dates, and if 2025 isn't on the rota,
    // all dates should be 2026
    if (currentMonth >= 11) {
      return currentYear + 1;
    }
    
    // If we're in October and the date is more than 30 days away, assume next year
    // (rota showing future planning)
    if (currentMonth === 10 && daysDiff > 30) {
      return currentYear + 1;
    }
    
    // Otherwise, assume current year
    return currentYear;
  }

  private getDayDate(dayName: string): string {
    const today = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = days.indexOf(dayName.toLowerCase());
    
    if (targetDay === -1) return this.getTodayDate();
    
    const currentDay = today.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7;
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilTarget);
    
    return targetDate.toISOString().split('T')[0];
  }

  private normalizeDate(part1: string, part2: string, part3: string): string {
    if (!part1 || !part2 || !part3) {
      return this.getTodayDate();
    }
    
    try {
      // Assume YYYY-MM-DD format if first part is 4 digits
      if (part1.length === 4) {
        const month = part2.padStart(2, '0');
        const day = part3.padStart(2, '0');
        return `${part1}-${month}-${day}`;
      } else if (part3.length === 4) {
        // Third part is year, so DD/MM/YYYY format (UK format)
        const day = part1.padStart(2, '0');
        const month = part2.padStart(2, '0');
        return `${part3}-${month}-${day}`;
      } else {
        // Fallback - assume DD/MM format with current year
        const currentYear = new Date().getFullYear().toString();
        const day = part1.padStart(2, '0');
        const month = part2.padStart(2, '0');
        return `${currentYear}-${month}-${day}`;
      }
    } catch (error) {
      return this.getTodayDate();
    }
  }

  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  async scrapeAllClinics(clinics: Clinic[], dateRange?: { start: Date; end: Date } | null): Promise<ScrapedClinicData[]> {
    console.log(`\n🚀 Starting to scrape ${clinics.length} clinics in parallel...`);
    console.log(`📋 Clinics to scrape: ${clinics.map(c => c.name).join(', ')}`);
    if (dateRange) {
      console.log(`📅 Filtering shifts to date range: ${dateRange.start.toISOString().split('T')[0]} to ${dateRange.end.toISOString().split('T')[0]}`);
    }
    
    // Create a single browser instance to reuse across all clinics for better performance
    console.log(`🌐 Launching shared Puppeteer browser...`);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'D',location:'lib/scraper.ts:scrapeAllClinics:beforeBrowserLaunch',message:'Before shared browser launch',data:{isVercel:!!process.env.VERCEL,clinicCount:clinics.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    let browser;
    try {
          // Use Vercel-compatible Puppeteer on Vercel, regular Puppeteer locally
          if (process.env.VERCEL) {
            // Dynamic import to avoid webpack parsing issues with private class fields
            const puppeteerCore = (await import('puppeteer-core')).default;
            const chromium = await import('@sparticuz/chromium');
            
            console.log('🔧 [Scraper] Configuring Chromium for Vercel...');
            console.log('🔧 [Scraper] Environment check:', {
              isVercel: !!process.env.VERCEL,
              nodeVersion: process.version,
              awsLambdaRuntime: process.env.AWS_LAMBDA_JS_RUNTIME || 'NOT SET',
              hasChromium: !!chromium.default,
              hasSetGraphicsMode: 'setGraphicsMode' in chromium.default
            });
            
            // IMPORTANT: Set graphics mode to false BEFORE getting executable path
            // This is critical for @sparticuz/chromium to work in serverless
            chromium.default.setGraphicsMode = false;
            console.log('🔧 [Scraper] Set graphics mode to false');
            
            const executablePath = await chromium.default.executablePath();
            console.log('🔧 [Scraper] Got executable path:', executablePath?.substring(0, 80) + '...');
            console.log('🔧 [Scraper] Chromium args count:', chromium.default.args?.length || 0);
            console.log('🔧 [Scraper] Chromium args (first 5):', chromium.default.args?.slice(0, 5));
            
            // Configure Chromium for Vercel with additional args for serverless
            // These args help Chromium work in Lambda/serverless environments
            const launchArgs = [
              ...chromium.default.args,
              '--disable-gpu',
              '--disable-dev-shm-usage',
              '--disable-software-rasterizer',
              '--no-sandbox',
              '--disable-setuid-sandbox',
              '--disable-web-security',
              '--disable-features=IsolateOrigins,site-per-process',
            ];
            
            console.log('🔧 [Scraper] Launching browser with', launchArgs.length, 'args');
            console.log('🔧 [Scraper] Launch config:', {
              executablePath: executablePath?.substring(0, 50) + '...',
              headless: chromium.default.headless,
              argsCount: launchArgs.length
            });
            
            browser = await puppeteerCore.launch({
              args: launchArgs,
              defaultViewport: chromium.default.defaultViewport,
              executablePath: executablePath,
              headless: chromium.default.headless,
            });
            console.log('✅ [Scraper] Browser launched successfully');
      } else {
        // Local development - use regular Puppeteer
        browser = await puppeteer.launch({ 
          headless: true, 
          args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-images',
            '--disable-plugins',
            '--disable-extensions'
          ]
        });
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'D',location:'lib/scraper.ts:scrapeAllClinics:browserLaunchSuccess',message:'Shared browser launch success',data:{isVercel:!!process.env.VERCEL},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
    } catch (launchError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8e0cff36-ee07-4b7f-9afb-10474bb0c728',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'debug-session',runId:'vercel-debug',hypothesisId:'D',location:'lib/scraper.ts:scrapeAllClinics:browserLaunchError',message:'Shared browser launch error',data:{isVercel:!!process.env.VERCEL,errorType:launchError instanceof Error ? launchError.constructor.name : typeof launchError,errorMessage:launchError instanceof Error ? launchError.message : String(launchError),errorStack:launchError instanceof Error ? launchError.stack : null},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      throw launchError;
    }
    
    try {
      // Process all clinics in parallel, reusing the same browser
      const promises = clinics.map(clinic => {
        console.log(`🔄 Queuing scrape for ${clinic.name}`);
        return this.scrapeClinic(clinic, dateRange, browser);
      });
      
      console.log(`⏳ Waiting for all ${promises.length} scrape operations to complete...`);
      const results = await Promise.allSettled(promises);
    
    const finalResults = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`✅ ${clinics[index].name}: Successfully scraped ${result.value.shifts.length} shifts`);
        return result.value;
      } else {
        console.log(`❌ ${clinics[index].name}: Failed - ${result.reason?.message || 'Unknown error'}`);
        return {
          clinic: clinics[index].name,
          shifts: [],
          lastUpdated: new Date().toISOString(),
          error: result.reason?.message || 'Unknown error'
        };
      }
    });

      console.log(`\n🎯 Scraping complete! Results summary:`);
      finalResults.forEach(result => {
        if (result.error) {
          console.log(`   ❌ ${result.clinic}: ERROR - ${result.error}`);
        } else {
          console.log(`   ✅ ${result.clinic}: ${result.shifts.length} shifts`);
        }
      });
      
      return finalResults;
    } finally {
      // Always close the shared browser
      await browser.close();
      console.log(`🔒 Shared browser closed`);
    }
  }
} 
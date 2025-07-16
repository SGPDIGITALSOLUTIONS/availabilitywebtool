import * as cheerio from 'cheerio';
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
  private readonly timeout = 10000;
  private readonly userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async scrapeClinic(clinic: Clinic): Promise<ScrapedClinicData> {
    try {
      console.log(`\n🔍 Scraping ${clinic.name}...`);
      console.log(`📍 URL: ${clinic.url}`);
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(clinic.url, {
        signal: controller.signal,
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
        }
      });

      clearTimeout(timeoutId);

      console.log(`✅ HTTP Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const htmlText = await response.text();
      console.log(`📄 Content Length: ${htmlText.length} characters`);

      const $ = cheerio.load(htmlText);
      
      // Log some basic HTML structure info
      const tableCount = $('table').length;
      const rowCount = $('tr').length;
      const cellCount = $('td, th').length;
      
      console.log(`📊 HTML Structure:`);
      console.log(`   - Tables found: ${tableCount}`);
      console.log(`   - Rows found: ${rowCount}`);
      console.log(`   - Cells found: ${cellCount}`);
      
      // Extract shift data
      const shifts = this.extractShiftData($, clinic.name);

      console.log(`✨ Final result for ${clinic.name}: ${shifts.length} shifts extracted`);
      
      return {
        clinic: clinic.name,
        shifts,
        lastUpdated: new Date().toISOString(),
      };

    } catch (error) {
      console.error(`❌ Error scraping ${clinic.name}:`, error);
      console.error(`   Error type: ${error instanceof Error ? error.constructor.name : typeof error}`);
      console.error(`   Error message: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        clinic: clinic.name,
        shifts: [],
        lastUpdated: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private extractShiftData($: cheerio.CheerioAPI, clinicName: string): ShiftData[] {
    const shifts: ShiftData[] = [];
    console.log(`\n🔄 Extracting shift data for ${clinicName}...`);

    try {
      // Look for tables containing shift information
      $('table').each((tableIndex, table) => {
        const $table = $(table);
        console.log(`\n📋 Processing table ${tableIndex + 1}...`);
        
        // Log table structure
        const tableRows = $table.find('tr').length;
        console.log(`   - Rows in table: ${tableRows}`);
        
        // Process each row in the table
        $table.find('tr').each((rowIndex, row) => {
          const $row = $(row);
          const cells = $row.find('td, th');
          
          if (cells.length === 0) {
            console.log(`   ⚠️  Row ${rowIndex + 1}: No cells found`);
            return;
          }

          console.log(`\n   🔍 Row ${rowIndex + 1} (${cells.length} cells):`);

          let shiftDate = '';
          let shiftTime = '';
          const jobRoles: string[] = [];

          cells.each((cellIndex, cell) => {
            const $cell = $(cell);
            const cellText = $cell.text().trim();
            
            console.log(`      Cell ${cellIndex + 1}: "${cellText}"`);

            // Extract date and time from first column or cells containing date/time
            if (cellIndex === 0 || this.containsDateTime(cellText)) {
              console.log(`      🕒 Checking for date/time in cell ${cellIndex + 1}...`);
              
              const dateMatch = this.extractDate(cellText);
              const timeMatch = this.extractTime(cellText);
              
              if (dateMatch) {
                console.log(`      ✅ Date found: "${dateMatch}"`);
                shiftDate = dateMatch;
              }
              if (timeMatch) {
                console.log(`      ✅ Time found: "${timeMatch}"`);
                shiftTime = timeMatch;
              }
              
              if (!dateMatch && !timeMatch) {
                console.log(`      ❌ No date/time patterns matched`);
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
            // Create a more descriptive date string that includes day name if available
            let displayDate = shiftDate || this.getTodayDate();
            
            // If we have a date in ISO format, try to add the day name
            if (displayDate && displayDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              try {
                const dateObj = new Date(displayDate);
                const dayName = dateObj.toLocaleDateString('en-GB', { weekday: 'long' });
                const shortDate = dateObj.toLocaleDateString('en-GB', { 
                  day: 'numeric', 
                  month: 'numeric',
                  year: undefined  // Don't show year if it's current year
                });
                displayDate = `${dayName} ${shortDate}`;
              } catch (error) {
                // Keep original date if conversion fails
                console.log(`      ⚠️  Date formatting failed for ${displayDate}, keeping original`);
              }
            }
            
            const shift = {
              date: displayDate,
              time: shiftTime || '',
              jobRoles
            };
            console.log(`      ✨ Adding shift: Date="${shift.date}", Time="${shift.time}", Roles=[${shift.jobRoles.join(', ')}]`);
            shifts.push(shift);
          } else {
            console.log(`      ⚠️  Row skipped - insufficient data (date/time: ${!!(shiftDate || shiftTime)}, roles: ${jobRoles.length})`);
          }
        });
      });

    } catch (error) {
      console.error('❌ Error extracting shift data:', error);
    }

    console.log(`\n📊 Summary for ${clinicName}: ${shifts.length} shifts extracted`);
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
      { name: 'Month DD, YYYY', pattern: /(january|february|march|april|may|june|july|august|september|october|november|december)[^\d]+(\d{1,2})[^\d]+(\d{4})/i },
      
      // Day names only (lowest priority - only use as last resort)
      { name: 'Day name only', pattern: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i }
    ];

    for (const { name, pattern } of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        console.log(`         ✅ Date pattern matched (${name}): ${match[0]}`);
        
        if (name.includes('Day DD/MM/YYYY') && match[1] && match[2] && match[3] && match[4]) {
          // Day with full date - use the date part and preserve day name
          const result = this.normalizeDate(match[2], match[3], match[4]);
          console.log(`         📅 Day with full date "${match[1]} ${match[2]}/${match[3]}/${match[4]}" normalized to: ${result}`);
          return result;
        } else if (name.includes('Day DD/MM') && match[1] && match[2] && match[3]) {
          // Day with partial date - assume current year
          const currentYear = new Date().getFullYear().toString();
          const result = this.normalizeDate(match[2], match[3], currentYear);
          console.log(`         📅 Day with partial date "${match[1]} ${match[2]}/${match[3]}" normalized to: ${result}`);
          return result;
        } else if (name.includes('Month') && match.length >= 3) {
          // Handle month names
          const result = this.parseMonthDate(match, name);
          if (result) {
            console.log(`         📅 Month date "${match[0]}" converted to: ${result}`);
            return result;
          }
        } else if (name.includes('DD/MM') && match[1] && match[2]) {
          // DD/MM format - assume current year
          const currentYear = new Date().getFullYear().toString();
          const result = this.normalizeDate(match[1], match[2], currentYear);
          console.log(`         📅 DD/MM date "${match[1]}/${match[2]}" normalized to: ${result}`);
          return result;
        } else if (match[1] && match[2] && match[3]) {
          // Three-part numeric date
          const result = this.normalizeDate(match[1], match[2], match[3]);
          console.log(`         📅 Three-part numeric date normalized to: ${result}`);
          return result;
        } else if (name.includes('Day name only') && match[1]) {
          // LAST RESORT: Just day name - convert to next occurrence of that day
          console.log(`         ⚠️  Using day name only as last resort: "${match[1]}"`);
          const result = this.getDayDate(match[1]);
          console.log(`         📅 Day name "${match[1]}" converted to: ${result}`);
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
    console.log(`         💼 Extracting job roles from: "${text}"`);
    
    const roles: string[] = [];
    
    // Look for content in brackets/parentheses which should contain job roles
    const bracketMatches = text.match(/\(([^)]+)\)/g) || [];
    const squareBracketMatches = text.match(/\[([^\]]+)\]/g) || [];
    
    if (bracketMatches.length > 0) {
      console.log(`         📝 Found parentheses: ${bracketMatches.join(', ')}`);
    }
    if (squareBracketMatches.length > 0) {
      console.log(`         📝 Found square brackets: ${squareBracketMatches.join(', ')}`);
    }
    
    [...bracketMatches, ...squareBracketMatches].forEach(match => {
      // Remove the brackets and extract the content
      const content = match.replace(/[\(\)\[\]]/g, '').trim();
      console.log(`         🔄 Bracket content: "${content}"`);
      
      if (content && content.length > 0) {
        // Split by common separators and clean up
        const splitRoles = content.split(/[,;&|]/).map(role => role.trim()).filter(role => role.length > 0);
        console.log(`         ✂️  Split into roles: [${splitRoles.join(', ')}]`);
        roles.push(...splitRoles);
      }
    });

    // Keep duplicates as they represent multiple positions of the same role
    if (roles.length > 0) {
      console.log(`         ✅ Final job roles extracted (with duplicates): [${roles.join(', ')}]`);
    } else {
      console.log(`         ❌ No job roles found in brackets`);
    }
    
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

  async scrapeAllClinics(clinics: Clinic[]): Promise<ScrapedClinicData[]> {
    console.log(`\n🚀 Starting to scrape ${clinics.length} clinics in parallel...`);
    console.log(`📋 Clinics to scrape: ${clinics.map(c => c.name).join(', ')}`);
    
    // Process all clinics in parallel for better performance
    const promises = clinics.map(clinic => {
      console.log(`🔄 Queuing scrape for ${clinic.name}`);
      return this.scrapeClinic(clinic);
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
  }
} 
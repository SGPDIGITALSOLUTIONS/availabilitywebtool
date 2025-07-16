# Clinic Availability Web Tool

A real-time web application that aggregates and displays clinic availability and staffing information from multiple healthcare facilities across the UK.

## 🎯 Project Overview

This tool fetches data from 11 clinic scheduling systems and presents a unified dashboard showing:
- Which clinics are currently operational
- Current staffing levels for each clinic
- Real-time availability status
- Consolidated view for quick decision-making

## 🏥 Supported Clinics

| Clinic Name | Location | Source URL |
|------------|----------|------------|
| Birmingham | Birmingham | `https://vchp.my.salesforce-sites.com/rota?clinicId=7014J00000099sc` |
| Bristol | Bristol | `https://vchp.my.salesforce-sites.com/rota?clinicId=7014J000000QupC` |
| Manchester | Manchester | `https://vchp.my.salesforce-sites.com/rota?clinicId=7014J00000099sh` |
| Brighton | Brighton | `https://vchp.my.salesforce-sites.com/rota?clinicId=7014J0000004ysx` |
| Edinburgh Skylight | Edinburgh | `https://vchp.my.salesforce-sites.com/rota?clinicId=701Nz000005T054` |
| Exeter | Exeter | `https://vchp.my.salesforce-sites.com/rota?clinicId=7014J0000009MmI` |
| Gloucester | Gloucester | `https://vchp.my.salesforce-sites.com/rota?clinicId=7014J000000I9vH` |
| Leeds | Leeds | `https://vchp.my.salesforce-sites.com/rota?clinicId=7014J0000004xIQ` |
| Plymouth | Plymouth | `https://vchp.my.salesforce-sites.com/rota?clinicId=701Nz00000BGf8y` |
| London Skylight | London | `https://vchp.my.salesforce-sites.com/rota?clinicId=7014J000000kfMy` |
| Skylight Thursday | London | `https://vchp.my.salesforce-sites.com/rota?clinicId=7014J000000kfNS` |

## ✨ Key Features

### Real-time Data Aggregation
- **Live Updates**: Fetches current data from all clinic endpoints
- **Smart Parsing**: Extracts relevant information from HTML tables
- **Error Handling**: Graceful handling of unavailable or delayed data sources

### Dashboard Interface
- **Status Overview**: Quick visual indicators for clinic operational status
- **Staffing Levels**: Display current staff count and availability
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Auto-refresh**: Configurable intervals for data updates

### Data Processing
- **Table Extraction**: Intelligent parsing of HTML table structures
- **Data Normalization**: Standardizes information across different clinic formats
- **Caching**: Optimized performance with smart caching strategies

## 🛠️ Technical Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS for responsive design
- **UI Components**: Shadcn/ui for consistent interface elements
- **State Management**: React hooks and context for real-time updates

### Backend
- **API Routes**: Next.js API routes for data fetching
- **Web Scraping**: Cheerio for HTML parsing
- **HTTP Client**: Axios for reliable API requests
- **Caching**: Redis or in-memory caching for performance

### Deployment
- **Platform**: Vercel for seamless deployment and scaling
- **Environment**: Edge functions for global performance
- **Monitoring**: Built-in analytics and error tracking

## 📊 Data Structure

### Clinic Configuration
```javascript
const clinics = {
  "birmingham": {
    name: "Birmingham",
    url: "https://vchp.my.salesforce-sites.com/rota?clinicId=7014J00000099sc",
    location: "Birmingham",
    timezone: "Europe/London"
  },
  // ... other clinics
}
```

### Expected Data Format
```javascript
{
  clinic: "Birmingham",
  status: "operational" | "closed" | "limited",
  lastUpdated: "2024-01-15T10:30:00Z",
  staffing: {
    support: 2,
    total: 2
  },
  availability: {
    appointments: 15,
    waitTime: "20 minutes"
  }
}
```

## 🚀 Implementation Plan

### Phase 1: Core Infrastructure
1. **Project Setup**
   - Initialize Next.js project
   - Configure TypeScript and ESLint
   - Set up Tailwind CSS and UI components

2. **Data Fetching Layer**
   - Create API routes for each clinic
   - Implement HTML parsing logic
   - Add error handling and retry mechanisms

3. **Basic Dashboard**
   - Design clinic cards layout
   - Implement real-time updates
   - Add loading and error states

### Phase 2: Enhanced Features
1. **Advanced UI**
   - Interactive filtering and sorting
   - Historical data visualization
   - Mobile-optimized interface

2. **Performance Optimization**
   - Implement caching strategies
   - Add background job processing
   - Optimize API response times

3. **Monitoring & Analytics**
   - Add uptime monitoring
   - Implement usage analytics
   - Create admin dashboard

## 📁 Project Structure

```
clinic-availability-tool/
├── app/
│   ├── api/
│   │   ├── clinics/
│   │   │   └── route.ts
│   │   └── health/
│   │       └── route.ts
│   ├── components/
│   │   ├── ui/
│   │   ├── ClinicCard.tsx
│   │   ├── Dashboard.tsx
│   │   └── StatusIndicator.tsx
│   ├── lib/
│   │   ├── scraper.ts
│   │   ├── clinics.ts
│   │   └── utils.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── public/
├── package.json
├── tailwind.config.js
├── next.config.js
└── vercel.json
```

## 🔧 Environment Configuration

### Required Environment Variables
```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app
CACHE_TTL=300000
REQUEST_TIMEOUT=10000

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
ANALYTICS_ID=your-analytics-id
```

## 🚀 Vercel Deployment

### Automatic Deployment
1. **Repository Setup**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/clinic-availability-tool
   git push -u origin main
   ```

2. **Vercel Configuration**
   - Connect GitHub repository to Vercel
   - Configure environment variables
   - Set up automatic deployments

3. **Custom Configuration** (`vercel.json`)
   ```json
   {
     "functions": {
       "app/api/**": {
         "maxDuration": 30
       }
     },
     "crons": [
       {
         "path": "/api/health",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

### Manual Deployment
```bash
npm install -g vercel
vercel login
vercel --prod
```

## 📈 Performance Considerations

### Optimization Strategies
- **Caching**: 5-minute cache for clinic data to reduce API calls
- **Concurrent Requests**: Parallel fetching from all clinic endpoints
- **Edge Functions**: Global distribution for low latency
- **Error Recovery**: Fallback mechanisms for failed requests

### Monitoring Metrics
- Response time per clinic endpoint
- Success/failure rates for data fetching
- Dashboard load times
- User engagement metrics

## 🔒 Security & Privacy

### Data Protection
- No sensitive patient data stored or transmitted
- HTTPS encryption for all communications
- Rate limiting to prevent abuse
- CORS configuration for secure API access

### Compliance
- GDPR compliant data handling
- Healthcare data privacy considerations
- Regular security audits and updates

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Local Development
```bash
git clone https://github.com/yourusername/clinic-availability-tool
cd clinic-availability-tool
npm install
npm run dev
```

### Testing Strategy
- Unit tests for data parsing functions
- Integration tests for API endpoints
- End-to-end tests for user workflows
- Performance testing for concurrent requests

## 📞 Support & Maintenance

### Monitoring
- Automated health checks every 5 minutes
- Alert system for clinic endpoint failures
- Performance monitoring and optimization

### Updates
- Regular dependency updates
- Clinic endpoint monitoring and adaptation
- Feature enhancements based on user feedback

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This tool is designed for operational visibility and does not handle patient data or medical records. Always ensure compliance with relevant healthcare regulations and data protection laws in your jurisdiction. 
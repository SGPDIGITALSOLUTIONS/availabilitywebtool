export interface Clinic {
  id: string;
  name: string;
  location: string;
  url: string;
  timezone: string;
}

export interface ClinicStatus {
  clinic: string;
  shifts: ShiftData[];
  lastUpdated: string;
  error?: string;
}

export interface ShiftData {
  date: string;
  time: string;
  jobRoles: string[];
}

export const clinics: Record<string, Clinic> = {
  birmingham: {
    id: 'birmingham',
    name: 'Birmingham',
    location: 'Birmingham',
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=7014J00000099sc',
    timezone: 'Europe/London'
  },
  bristol: {
    id: 'bristol',
    name: 'Bristol',
    location: 'Bristol',
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=7014J000000QupC',
    timezone: 'Europe/London'
  },
  manchester: {
    id: 'manchester',
    name: 'Manchester',
    location: 'Manchester',
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=7014J00000099sh',
    timezone: 'Europe/London'
  },
  brighton: {
    id: 'brighton',
    name: 'Brighton',
    location: 'Brighton',
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=7014J0000004ysx',
    timezone: 'Europe/London'
  },
  edinburgh: {
    id: 'edinburgh',
    name: 'Edinburgh Skylight',
    location: 'Edinburgh',
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=701Nz000005T054',
    timezone: 'Europe/London'
  },
  exeter: {
    id: 'exeter',
    name: 'Exeter',
    location: 'Exeter',
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=7014J0000009MmI',
    timezone: 'Europe/London'
  },
  gloucester: {
    id: 'gloucester',
    name: 'Gloucester',
    location: 'Gloucester',
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=7014J000000I9vH',
    timezone: 'Europe/London'
  },
  leeds: {
    id: 'leeds',
    name: 'Leeds',
    location: 'Leeds',
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=7014J0000004xIQ',
    timezone: 'Europe/London'
  },
  plymouth: {
    id: 'plymouth',
    name: 'Plymouth',
    location: 'Plymouth',
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=701Nz00000BGf8y',
    timezone: 'Europe/London'
  },
  london: {
    id: 'london',
    name: 'London Skylight',
    location: 'London',
    // Updated to new Skylight rota link (includes current Wed/Thu schedule)
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=701Nz00000i6VXf',
    timezone: 'Europe/London'
  },
  thursday: {
    id: 'thursday',
    name: 'Skylight Thursday',
    location: 'London',
    url: 'https://vchp.my.salesforce-sites.com/rota?clinicId=701Nz00000Sbs2v',
    timezone: 'Europe/London'
  }
};

export const getClinicById = (id: string): Clinic | undefined => {
  return clinics[id];
};

export const getAllClinics = (): Clinic[] => {
  return Object.values(clinics);
}; 
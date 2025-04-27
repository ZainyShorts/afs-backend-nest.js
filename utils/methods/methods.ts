import * as path from 'path';
import * as fs from 'fs';

export function ensureUploadsFolder() {
  const uploadsPath = path.join(process.cwd(), 'uploads'); // Ensure it's in the project root
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
}

export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) =>
      index === 0 ? match.toLowerCase() : match.toUpperCase(),
    )
    .replace(/\s+/g, '')
    .replace(/([a-z])([A-Z])/g, '$1$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1$2')
    .replace(/[^a-zA-Z0-9]/g, '');
}

// Manual header-to-database key mapping
export const MasterDevelopmentheaderMapping: { [key: string]: string } = {
  Country: 'country',
  City: 'city',
  'Road Location': 'roadLocation',
  'Development Name': 'developmentName',
  'Location Quality': 'locationQuality',
  'BUA Area': 'buaAreaSqFt',
  'Facilities Area': 'facilitiesAreaSqFt',
  'Amenities Area': 'amentiesAreaSqFt',
};

export const SubDevelopmentheaderMapping: { [key: string]: string } = {
  'Development Name': 'developmentName',
  'Sub Development': 'subDevelopmentName',
  'Plot Number': 'plotNumber',
  'Plot Height': 'plotHeight',
  'Plot Permission1': 'plotPermission1',
  'Plot Permission2': 'plotPermission2',
  'Plot Permission3': 'plotPermission3',
  'Plot Permission4': 'plotPermission4',
  'Plot Permission5': 'plotPermission5',
  'Plot Size': 'plotSizeSqFt',
  'Plot BUA': 'plotBUASqFt',
  'Plot Status': 'plotStatus',
  'BUA Area': 'buaAreaSqFt',
  'Facilities Area': 'facilitiesAreaSqFt',
  'Amenities Area': 'amentiesAreaSqFt',
};

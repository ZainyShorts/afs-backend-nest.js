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
  'Sub Development': 'subDevelopment',
  'Plot Number': 'plotNumber',
  'Plot Height': 'plotHeight',
  'Plot Permission 1': 'plotPermission1',
  'Plot Permission 2': 'plotPermission2',
  'Plot Permission 3': 'plotPermission3',
  'Plot Permission 4': 'plotPermission4',
  'Plot Permission 5': 'plotPermission5',
  'Plot Size Sq. Ft.': 'plotSizeSqFt',
  'Plot BUASq. Ft.': 'plotBUASqFt',
  'Plot Status': 'plotStatus',
  'BUA AreaSq. Ft.': 'buaAreaSqFt',
  'Facilities AreaSq. Ft.': 'facilitiesAreaSqFt',
  'Amenities AreaSq. Ft.': 'amentiesAreaSqFt',
};

export const InventoryHeaderMapping: { [key: string]: string } = {
  Project: 'project',
  'Unit Number': 'unitNumber',
  'Unit Height': 'unitHeight',
  'Unit Internal Design': 'unitInternalDesign',
  'Unit External Design': 'unitExternalDesign',
  'Plot Size Sq. Ft.': 'plotSizeSqFt',
  'BUA Sq. Ft.': 'BuaSqFt',
  'No. of Bedrooms': 'noOfBedRooms',
  'Unit Type': 'unitType',
  'Rented At': 'rentedAt',
  'Rented Till': 'rentedTill',
  'Unit View': 'unitView',
  'Unit Purpose': 'unitPurpose',
  'Listing Date': 'listingDate',
  'Purchase Price': 'purchasePrice',
  'Market Price': 'marketPrice',
  'Asking Price': 'askingPrice',
  'Premium and Loss': 'premiumAndLoss',
  'Market Rent': 'marketRent',
  'Asking Rent': 'askingRent',
  'Paid to Developers': 'paidTODevelopers',
  'Payable to Developers': 'payableTODevelopers',
};



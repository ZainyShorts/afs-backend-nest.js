export class InventoryFilterInput {
  masterDevelopment?: string;
  subDevelopment?: string;
  project?: string;
  unitNumber?: string;
  unitHeight?: number;
  unitInternalDesign?: string;
  unitExternalDesign?: string;
  plotSizeSqFt?: number;
  buaSqFt?: number;
  unitType?: string;
  unitView?: string[];
  pictures?: string[];
  unitPurpose?: string;
  listingDate?: string;
  chequeFrequency?: string;
  rentalPriceRange?: {
    min?: number;
    max?: number;
  };
  salePriceRange?: {
    min?: number;
    max?: number;
  };
  originalPriceRange?: {
    min?: number;
    max?: number;
  };
  startDate?: string;
  endDate?: string;
  rentedAt?: string;
  rentedTill?: string;
  vacantOn?: string;
  paidTODevelopers?: string;
  payableTODevelopers?: string;
  premiumAndLossRange?: {
    min?: number;
    max?: number;
  };
}

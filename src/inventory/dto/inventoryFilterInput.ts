export class InventoryFilterInput {
  projectID?: string;
  developmentName?: string;
  subDevelopment?: string;
  project?: string;
  unitNumber?: string;
  unitHeight?: string;
  unitInternalDesign?: string;
  unitExternalDesign?: string;
  unitView?: string[];
  pictures?: string[];
  unitPurpose?: string;
  unitType?: string;
  listingDate?: string;
  chequeFrequency?: string;
  roadLocation?: string;
  noOfBedRooms?: {
    min?: number;
    max?: number;
  };
  plotSizeSqFt?: {
    min?: number;
    max?: number;
  };
  BuaSqFt?: {
    min?: number;
    max?: number;
  };
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

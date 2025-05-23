export class InventoryFilterInput {
  projectID?: string;
  developmentName?: string;
  subDevelopment?: string;
  project?: string;
  unitNumber?: string;
  unitHeight?: string;
  unitInternalDesign?: string;
  unitExternalDesign?: string;
  plotSizeSqFt?: number;
  buaSqFt?: number;
  noOfBedRooms?: string;
  unitView?: string[];
  pictures?: string[];
  unitPurpose?: string;
  listingDate?: string;
  chequeFrequency?: string;
  roadLocation?: string;
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

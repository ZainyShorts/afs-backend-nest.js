export class InventoryFilterInput {
  project?: string; // Mongoose field is `project`, not `projectID`
  unitNumber?: string;
  unitHeight?: string;
  unitInternalDesign?: string;
  unitExternalDesign?: string;
  unitView?: string[];
  pictures?: string[];
  unitPurpose?: string; // Should be validated using UnitPurpose enum in actual logic
  unitType?: string; // Should be validated using unitType enum
  listingDate?: string;
  developmentName?: string;
  roadLocation?: string;
  subDevelopment?: string;

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

  purchasePriceRange?: {
    min?: number;
    max?: number;
  };

  marketPriceRange?: {
    min?: number;
    max?: number;
  };

  askingPriceRange?: {
    min?: number;
    max?: number;
  };

  marketRentRange?: {
    min?: number;
    max?: number;
  };

  askingRentRange?: {
    min?: number;
    max?: number;
  };

  premiumAndLossRange?: {
    min?: number;
    max?: number;
  };

  rentedAt?: string;
  rentedTill?: string;

  paidTODevelopers?: number;
  payableTODevelopers?: number;

  startDate?: string; // Can be used to filter by createdAt range
  endDate?: string;
}

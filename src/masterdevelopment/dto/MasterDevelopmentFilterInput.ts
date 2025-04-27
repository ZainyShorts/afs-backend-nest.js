export class MasterDevelopmentFilterInput {
  country?: string;
  city?: string;
  developmentName?: string;
  roadLocation?: string;
  locationQuality?: string;

  buaAreaSqFtRange?: { min?: number; max?: number };
  totalAreaSqFtRange?: { min?: number; max?: number };

  facilitiesCategories?: string[];
  amentiesCategories?: string[];

  startDate?: string; // createdAt range
  endDate?: string;
}

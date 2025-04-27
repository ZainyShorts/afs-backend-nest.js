// dto/sub-development-filter.input.ts

export class SubDevelopmentFilterInput {
  subDevelopment?: string;
  plotNumber?: number;
  plotStatus?: string;

  buaAreaSqFtRange?: { min?: number; max?: number };
  totalSizeSqFtRange?: { min?: number; max?: number };

  facilitiesCategories?: string[];
  amentiesCategories?: string[];
  plotPermission?: string[];

  startDate?: string;
  endDate?: string;
}

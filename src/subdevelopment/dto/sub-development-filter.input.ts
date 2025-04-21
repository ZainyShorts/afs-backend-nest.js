// dto/sub-development-filter.input.ts

export class SubDevelopmentFilterInput {
  subDevelopment?: string;
  plotNumber?: number;
  plotPermission?: string;
  plotStatus?: string;

  buaAreaSqFtRange?: { min?: number; max?: number };
  totalSizeSqFtRange?: { min?: number; max?: number };

  facilitiesCategories?: string[];
  amentiesCategories?: string[];

  startDate?: string;
  endDate?: string;
}

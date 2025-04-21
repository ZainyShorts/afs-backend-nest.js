export class UpdateSubDevelopmentDto {
  masterDevelopment?: string;
  subDevelopment?: string;
  plotNumber?: number;
  plotHeight?: number;
  plotPermission?: string;
  plotSizeSqFt?: number;
  plotBUASqFt?: number;
  plotStatus?: string;
  buaAreaSqFt?: string;
  facilitiesAreaSqFt?: string;
  amenitiesAreaSqFt?: string;
  totalSizeSqFt?: string;
  pictures?: string[];
  facilitiesCategories?: string[];
  amentiesCategories?: string[];
}

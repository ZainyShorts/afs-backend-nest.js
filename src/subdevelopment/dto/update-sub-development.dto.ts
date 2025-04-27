export class UpdateSubDevelopmentDto {
  masterDevelopment?: string;
  subDevelopment?: string;
  plotNumber?: number;
  plotHeight?: number;
  plotSizeSqFt?: number;
  plotBUASqFt?: number;
  plotStatus?: string;
  buaAreaSqFt?: string;
  facilitiesAreaSqFt?: string;
  amenitiesAreaSqFt?: string;
  totalAreaSqFt?: string;
  pictures?: string[];
  facilitiesCategories?: string[];
  amentiesCategories?: string[];
  plotPermission?: string[];
}

export class CreateMasterDevelopmentDto {
  country: string;
  city: string;
  roadLocation: string;
  developmentName: string;
  locationQuality: string;
  buaAreaSqFt: number;
  facilitiesAreaSqFt: number;
  amentiesAreaSqFt: number;
  totalAreaSqFt: number;
  pictures?: string[];
  facilitiesCategories: string[];
  amentiesCategories: string[];
}

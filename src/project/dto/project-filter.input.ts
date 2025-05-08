export class ProjectFilterInput {
  masterDevelopment?: string;
  subDevelopment?: string;
  propertyType?: string;
  projectName?: string;
  projectQuality?: string;
  constructionStatus?: number;
  launchDate?: string;
  completionDate?: string;
  salesStatus?: string;
  percentOfConstruction?: number;
  uponCompletion?: string;
  installmentDate?: string;
  postHandOver?: string;
  startDate?: string;
  endDate?: string;
  facilityCategories?: string[];
  amenitiesCategories?: string[];

  // New Plot filters
  plotNumber?: number;
  plotStatus?: string;
  plotPermission?: string[];
}

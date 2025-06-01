import { PlotStatus, PropertyType } from 'utils/enum/enums';

export interface SubDevelopmentRow {
  developmentName: string;
  subDevelopment: string;
  plotNumber: string;
  plotHeight: number;
  plotPermission1?: PropertyType;
  plotPermission2?: PropertyType;
  plotPermission3?: PropertyType;
  plotPermission4?: PropertyType;
  plotPermission5?: PropertyType;
  plotPermission: PropertyType[];
  plotSizeSqFt?: number;
  plotBUASqFt?: number;
  plotStatus: PlotStatus;
  buaAreaSqFt?: number;
  facilitiesAreaSqFt?: number;
  amentiesAreaSqFt?: number;
  totalAreaSqFt?: number;
}

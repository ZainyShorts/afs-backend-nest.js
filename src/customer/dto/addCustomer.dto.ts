
import {
  CustomerSegment,
  CustomerCategory,
  CustomerSubCategory,
  CustomerType,
  CustomerSubType,
} from 'utils/enum/enums'

export interface CustomerDTO {
  customerSegment: CustomerSegment
  customerCategory: CustomerCategory
  customerSubCategory: CustomerSubCategory
  customerType: CustomerType
  customerSubType: CustomerSubType
  customerBusinessSector : string
  customerNationality: string
  customerName: string
  contactPerson: string
  customerDepartment: string
  customerDesignation: string

  telOffice: string
  tellDirect: string
  mobile1: string
  mobile2: string

  emailAddress: string
  webAddress: string
  officeLocation: string
}

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './schema/customer.schema';
import { CustomerService } from './customer.service';
import { CustomerController } from './customer.controller';

import { Project, ProjectSchema } from 'src/project/schema/project.schema';
import {
  SubDevelopment,
  SubDevelopmentSchema,
} from 'src/subdevelopment/schema/subdevelopment.schema';
import {
  MasterDevelopment,
  MasterDevelopmentSchema,
} from 'src/masterdevelopment/schema/master-development.schema';
import {
  Inventory,
  InventorySchema,
} from 'src/inventory/schema/inventory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: SubDevelopment.name, schema: SubDevelopmentSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: MasterDevelopment.name, schema: MasterDevelopmentSchema },
    ]),
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService],
})
export class CustomerModule {}

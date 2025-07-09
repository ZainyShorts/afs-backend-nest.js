import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Inventory, InventorySchema } from './schema/inventory.schema'; 
import { Project, ProjectSchema } from 'src/project/schema/project.schema'; 
import { Customer, CustomerSchema } from '../customer/schema/customer.schema';
import { CustomerService } from '../customer/customer.service';
import { CustomerController } from '../customer/customer.controller';
import {
  SubDevelopment,
  SubDevelopmentSchema,
} from 'src/subdevelopment/schema/subdevelopment.schema';
import {
  MasterDevelopment,
  MasterDevelopmentSchema,
} from 'src/masterdevelopment/schema/master-development.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: Project.name, schema: ProjectSchema },
      { name: SubDevelopment.name, schema: SubDevelopmentSchema },
      { name: MasterDevelopment.name, schema: MasterDevelopmentSchema },
      { name: Customer.name, schema: CustomerSchema }, // ✅ Added Customer model
    ]),
  ],
  providers: [InventoryService, CustomerService],
  controllers: [InventoryController, CustomerController],
  exports: [InventoryModule],
})
export class InventoryModule {}

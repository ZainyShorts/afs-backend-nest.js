import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MasterDevelopment,
  MasterDevelopmentSchema,
} from './schema/master-development.schema';
import { MasterDevelopmentService } from './masterdevelopment.service';
import { MasterDevelopmentController } from './masterdevelopment.controller';
import { Project, ProjectSchema } from 'src/project/schema/project.schema'; 
import { Customer, CustomerSchema } from '../customer/schema/customer.schema';
import { CustomerService } from '../customer/customer.service';
import { CustomerController } from '../customer/customer.controller';
import {
  Inventory,
  InventorySchema,
} from 'src/inventory/schema/inventory.schema';
import {
  SubDevelopment,
  SubDevelopmentSchema,
} from 'src/subdevelopment/schema/subdevelopment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MasterDevelopment.name, schema: MasterDevelopmentSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Inventory.name, schema: InventorySchema }, 
            { name: Customer.name, schema: CustomerSchema }, // ✅ Added Customer model
      { name: SubDevelopment.name, schema: SubDevelopmentSchema },
    ]),
  ],
  providers: [MasterDevelopmentService , CustomerService],
  controllers: [MasterDevelopmentController , CustomerController],
  exports: [MasterDevelopmentService],
})
export class MasterDevelopmentModule {}

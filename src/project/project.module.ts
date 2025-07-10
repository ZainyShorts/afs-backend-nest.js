// src/project/project.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { Project, ProjectSchema } from './schema/project.schema'; 
import { Customer, CustomerSchema } from '../customer/schema/customer.schema';
import { CustomerService } from '../customer/customer.service';
import { CustomerController } from '../customer/customer.controller';
import {
  Inventory,
  InventorySchema,
} from 'src/inventory/schema/inventory.schema';
import {
  MasterDevelopment,
  MasterDevelopmentSchema,
} from 'src/masterdevelopment/schema/master-development.schema';
import {
  SubDevelopment,
  SubDevelopmentSchema,
} from 'src/subdevelopment/schema/subdevelopment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MasterDevelopment.name, schema: MasterDevelopmentSchema },
      { name: SubDevelopment.name, schema: SubDevelopmentSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Inventory.name, schema: InventorySchema }, 
      { name: Customer.name, schema: CustomerSchema },
      
    ]),
  ],
  controllers: [ProjectController , CustomerController],
  providers: [ProjectService , CustomerService],
})
export class ProjectModule {}

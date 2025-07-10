import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  SubDevelopment,
  SubDevelopmentSchema,
} from './schema/subdevelopment.schema';
import { SubDevelopmentController } from './subdevelopment.controller';
import { SubDevelopmentService } from './subdevelopment.service';

import { Project, ProjectSchema } from 'src/project/schema/project.schema';
import {
  Inventory,
  InventorySchema,
} from 'src/inventory/schema/inventory.schema';
import {
  MasterDevelopment,
  MasterDevelopmentSchema,
} from 'src/masterdevelopment/schema/master-development.schema';
import {
  Customer,
  CustomerSchema,
} from '../customer/schema/customer.schema';

import { CustomerModule } from '../customer/customer.module';
import { MasterDevelopmentModule } from 'src/masterdevelopment/masterdevelopment.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SubDevelopment.name, schema: SubDevelopmentSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: MasterDevelopment.name, schema: MasterDevelopmentSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
    CustomerModule, 
    MasterDevelopmentModule,
  ],
  controllers: [SubDevelopmentController],
  providers: [SubDevelopmentService],
})
export class SubDevelopmentModule {}

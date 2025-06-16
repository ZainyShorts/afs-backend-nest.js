// src/project/project.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { Project, ProjectSchema } from './schema/project.schema';
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
    ]),
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
})
export class ProjectModule {}

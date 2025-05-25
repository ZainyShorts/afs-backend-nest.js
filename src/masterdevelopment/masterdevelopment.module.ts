import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MasterDevelopment,
  MasterDevelopmentSchema,
} from './schema/master-development.schema';
import { MasterDevelopmentService } from './masterdevelopment.service';
import { MasterDevelopmentController } from './masterdevelopment.controller';
import { Project, ProjectSchema } from 'src/project/schema/project.schema';
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
      { name: SubDevelopment.name, schema: SubDevelopmentSchema },
    ]),
  ],
  providers: [MasterDevelopmentService],
  controllers: [MasterDevelopmentController],
  exports: [MasterDevelopmentService],
})
export class MasterDevelopmentModule {}

import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Inventory, InventorySchema } from './schema/inventory.schema';
import { Project, ProjectSchema } from 'src/project/schema/project.schema';
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
    ]),
  ],
  providers: [InventoryService],
  controllers: [InventoryController],
  exports: [InventoryModule],
})
export class InventoryModule {}

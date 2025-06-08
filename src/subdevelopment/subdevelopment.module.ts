import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SubDevelopment,
  SubDevelopmentSchema,
} from './schema/subdevelopment.schema';
import { SubDevelopmentController } from './subdevelopment.controller';
import { SubDevelopmentService } from './subdevelopment.service';
import { MasterDevelopmentModule } from 'src/masterdevelopment/masterdevelopment.module';
import { Project, ProjectSchema } from 'src/project/schema/project.schema';
import {
  Inventory,
  InventorySchema,
} from 'src/inventory/schema/inventory.schema';

@Module({
  imports: [
    MasterDevelopmentModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Inventory.name, schema: InventorySchema },
      { name: SubDevelopment.name, schema: SubDevelopmentSchema },
    ]),
  ],
  controllers: [SubDevelopmentController],
  providers: [SubDevelopmentService],
})
export class SubDevelopmentModule {}

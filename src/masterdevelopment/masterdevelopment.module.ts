import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  MasterDevelopment,
  MasterDevelopmentSchema,
} from './schema/master-development.schema';
import { MasterDevelopmentService } from './masterdevelopment.service';
import { MasterDevelopmentController } from './masterdevelopment.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MasterDevelopment.name, schema: MasterDevelopmentSchema },
    ]),
  ],
  providers: [MasterDevelopmentService],
  controllers: [MasterDevelopmentController],
})
export class MasterDevelopmentModule {}

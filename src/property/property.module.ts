import { Module } from '@nestjs/common';
import { PropertyService } from './property.service';
import { PropertyController } from './property.controller';
import { PropertyResolver } from './property.resolver';
import { MongooseModule } from '@nestjs/mongoose';
import { Property, PropertySchema } from './schema/property.schema';

@Module({
  imports:[
    MongooseModule.forFeature([{name:Property.name, schema:PropertySchema}])
  ],
  providers: [PropertyService, PropertyResolver],
  controllers: [PropertyController],
  exports:[PropertyModule]
})
export class PropertyModule {}

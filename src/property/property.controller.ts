import { Body, Controller, Post } from '@nestjs/common';
import { AddPropertyDto } from './input/addPropertyInput';
import { PropertyService } from './property.service';

@Controller('property')
export class PropertyController {


    constructor(private readonly prropertyService: PropertyService) {}

    @Post("addSingleRecord")
    async addSingleRecord(@Body() data:AddPropertyDto){
        return this.prropertyService.addSingleRecord(data)
    }

    
}

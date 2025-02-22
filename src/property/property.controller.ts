import { Body, Controller, Delete, Param, Post, Put } from '@nestjs/common';
import { AddPropertyDto } from './input/addPropertyInput';
import { PropertyService } from './property.service';
import { ResponseDto } from 'src/dto/response.dto';
import { UpdatePropertyDto } from './input/updatePropertyInput';

@Controller('property')
export class PropertyController {


    constructor(private readonly prropertyService: PropertyService) {}

    @Post("addSingleRecord")
    async addSingleRecord(@Body() data:AddPropertyDto){
        return this.prropertyService.addSingleRecord(data)
    }

    @Delete(':id')
    async deleteProperty(@Param('id') id: string): Promise<ResponseDto> {
    return this.prropertyService.deleteSingleRecord(id);
    }

    @Put("updateSingleRecord")
    async updateProperty(@Body() updatePropertyDto: UpdatePropertyDto) {
        return this.prropertyService.updateProperty(updatePropertyDto);
    }


    
}

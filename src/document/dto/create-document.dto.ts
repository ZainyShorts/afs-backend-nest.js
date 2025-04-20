import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  refId: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsUrl()
  @IsNotEmpty()
  documentUrl: string;

  @IsString()
  @IsNotEmpty()
  title: string[];
}

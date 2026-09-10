import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';

export class CreateGrievanceDto {
  @IsString()
  category: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsBoolean()
  confidential?: boolean;
}

export class UpdateGrievanceDto {
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])
  status?: string;

  @IsOptional()
  @IsString()
  ownerId?: string;
}

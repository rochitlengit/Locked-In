import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;
}

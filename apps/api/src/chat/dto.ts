import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsBoolean()
  isDM?: boolean;

  @IsOptional()
  @IsArray()
  memberIds?: string[];
}

export class SendMessageDto {
  @IsString()
  content: string;
}

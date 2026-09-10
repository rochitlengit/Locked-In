import { IsOptional, IsString } from 'class-validator';

export class StartTimerDto {
  @IsOptional()
  @IsString()
  taskId?: string;

  @IsOptional()
  @IsString()
  subtaskId?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

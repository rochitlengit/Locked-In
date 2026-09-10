import { IsString, IsInt, IsOptional, IsDateString, IsIn } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  defaultDaysPerYear?: number;
}

export class CreateLeaveRequestDto {
  @IsString()
  leaveTypeId: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class DecideLeaveDto {
  @IsIn(['APPROVED', 'REJECTED'])
  status: 'APPROVED' | 'REJECTED';
}

export class CreatePermissionRequestDto {
  @IsDateString()
  date: string;

  @IsString()
  fromTime: string;

  @IsString()
  toTime: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

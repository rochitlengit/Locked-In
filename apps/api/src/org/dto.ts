import { IsString, IsOptional, IsIn, IsEmail } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  name: string;
}

export class CreateTeamDto {
  @IsString()
  name: string;

  @IsString()
  departmentId: string;

  @IsOptional()
  @IsString()
  leadId?: string;
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  fullName: string;

  @IsString()
  password: string;

  @IsIn(['SUPER_ADMIN', 'HR', 'TEAM_LEAD', 'EMPLOYEE'])
  role: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  managerId?: string;

  @IsOptional()
  @IsIn(['SUPER_ADMIN', 'HR', 'TEAM_LEAD', 'EMPLOYEE'])
  role?: string;

  @IsOptional()
  @IsString()
  title?: string;
}

export class CreateRemarkDto {
  @IsString()
  subjectId: string;

  @IsString()
  content: string;
}

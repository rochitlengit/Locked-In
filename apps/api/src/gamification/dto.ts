import { IsString, IsOptional, IsDateString, IsNumber, Min, Max } from 'class-validator';

export class ScoreQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AwardBadgeDto {
  @IsString()
  userId: string;

  @IsString()
  badgeId: string;
}

export class CreateBadgeDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  rule?: string;
}

export class CreateSkillDto {
  @IsString()
  name: string;
}

export class UpdateScoringConfigDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  timeWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  weightageWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  deadlineWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  latePenaltyPerDay?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  earlyBonusPerDay?: number;
}

export class RunPeriodCloseDto {
  @IsDateString()
  periodStart: string;

  @IsDateString()
  periodEnd: string;
}

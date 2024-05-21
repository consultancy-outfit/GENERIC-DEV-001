import { IsNumber, IsOptional } from 'class-validator';

export class PromotionDto {
  @IsNumber()
  @IsOptional()
  employee?: number;

  @IsNumber()
  @IsOptional()
  percentage?: number;

  @IsNumber()
  @IsOptional()
  totalSpend?: number;
}

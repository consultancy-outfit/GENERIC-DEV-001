import { IsNumber, IsOptional } from 'class-validator';

export class BudgetDto {
  @IsNumber()
  @IsOptional()
  employeePay?: number;

  @IsNumber()
  @IsOptional()
  percentage?: number;

  @IsNumber()
  @IsOptional()
  raise?: number;
}

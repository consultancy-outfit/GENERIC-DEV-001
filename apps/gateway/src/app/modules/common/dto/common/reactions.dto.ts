import { IsArray, IsNotEmpty } from 'class-validator';

export class ReactionDto {
  @IsNotEmpty()
  @IsArray()
  thumbsUp: string[];

  @IsNotEmpty()
  @IsArray()
  heart: string[];

  @IsNotEmpty()
  @IsArray()
  happy: string[];

  @IsNotEmpty()
  @IsArray()
  angry: string[];

  @IsNotEmpty()
  @IsArray()
  shock: string[];
}

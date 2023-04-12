import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class UpdateProfileDto {
  @ApiProperty({ example: 'ivan', description: 'Псевдоним' })
  @IsString({ message: 'Должно быть строкой' })
  readonly username: string;

  @ApiProperty({ example: 'Имя', description: 'Иван' })
  @IsString({ message: 'Должно быть строкой' })
  readonly firstName: string;

  @ApiProperty({ example: 'Фамилия', description: 'Иванов' })
  @IsString({ message: 'Должно быть строкой' })
  readonly lastName: string;
}

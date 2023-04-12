import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, Length } from "class-validator";

export class CreateProfileDto {
  @ApiProperty({ example: 'user@mail.ru', description: 'Почтовый адрес' })
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Некорректный email' })
  readonly email: string;

  @ApiProperty({ example: '1234', description: 'Пароль' })
  @IsString({ message: 'Должно быть строкой' })
  @Length(4, 16, { message: 'Не меньше 4 и не больше 16' })
  readonly password: string;

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

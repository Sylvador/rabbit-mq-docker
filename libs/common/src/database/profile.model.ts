import { ApiProperty } from "@nestjs/swagger";
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { User } from "./user.model";

interface ProfileCreationAttrs {
  username: string;
  firstName: string;
  profilePic: string;
  userId: number;
}

@Table({
  tableName: 'profiles'
})
export class Profile extends Model<Profile, ProfileCreationAttrs> {
  @ApiProperty({example: '1', description: 'Уникальный идентификатор'})
  @Column({type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true})
  id: number;

  @ApiProperty({example: 'any username', description: 'Псевдоним'})
  @Column({type: DataType.STRING, unique: true, allowNull: false})
  username: string;

  @ApiProperty({example: 'Иван', description: 'Имя'})
  @Column({type: DataType.STRING})
  firstName: string;

  @ApiProperty({example: 'Иванов', description: 'Фамилия'})
  @Column({type: DataType.STRING})
  lastName: string;

  @ApiProperty({description: 'Изображение профиля'})
  @Column({type: DataType.STRING})
  profilePic: string;

  @ForeignKey(() => User)
  @Column({type: DataType.INTEGER})
  userId: number;
  
  @BelongsTo(() => User)
  user: User
}
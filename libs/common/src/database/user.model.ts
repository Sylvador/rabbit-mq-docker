import { ApiProperty } from "@nestjs/swagger";
import { Role } from "@app/common/database/roles.model";
import { UserRoles } from "@app/common/database/user-roles.model";
import { BelongsToMany, Column, DataType, HasOne, Model, Table } from "sequelize-typescript";
import { Profile } from "./profile.model";

interface UserCreationAttrs {
  email: string;
  hashedPassword: string;
}

@Table({
  tableName: 'users'
})
export class User extends Model<User, UserCreationAttrs> {
  @ApiProperty({example: '1', description: 'Уникальный идентификатор'})
  @Column({type: DataType.INTEGER, unique: true, autoIncrement: true, primaryKey: true})
  id: number;

  @ApiProperty({example: 'user@mail.ru', description: 'Почтовый адрес'})
  @Column({type: DataType.STRING, unique: true, allowNull: false})
  email: string;

  @ApiProperty({example: '$argon2i$v=19$m=4096,t=3,p=1$SX5sc9gOkbvc4wum7EDYRg$3ZlnlCa8+Si4tqbHAnRqMFvWu3QfH4zysPGX7buE0mI', description: 'Захешированный пароль'})
  @Column({type: DataType.STRING})
  hashedPassword: string;

  @ApiProperty({description: 'Захешированный refreshToken'})
  @Column({type: DataType.STRING})
  hashedRt: string

  @BelongsToMany(() => Role, () => UserRoles)
  roles: Role[];

  @HasOne(() => Profile)
  profile: Profile;
}
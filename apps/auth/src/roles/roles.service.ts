import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoleDto } from "./dto/create-role.dto";
import { InjectModel } from "@nestjs/sequelize";
import { AddRoleDto } from './dto';
import { Role } from '@app/common/database/roles.model';
import { AuthService } from '../auth.service';
import { User } from '@app/common/database/user.model';

@Injectable()
export class RolesService {
  
  constructor(@InjectModel(Role) private roleRepository: typeof Role,
    private authService: AuthService) { }
  
  async createRole(dto: CreateRoleDto) {
    const role: Role = await this.roleRepository.create(dto);
    return role;
  }
  
  async getRoleByValue(value: string) {
    const role: Role = await this.roleRepository.findOne({ where: { value } })
    return role;
  }
  
  async giveRole(dto: AddRoleDto) {
    const user: User = await this.authService.getUserById(dto.userId);
    const role: Role = await this.getRoleByValue(dto.value);
    if (role && user) {
        await user.$add('role', role.id);
        return dto;
    }
    throw new HttpException('Пользователь или роль не найдены', HttpStatus.NOT_FOUND);
}
}
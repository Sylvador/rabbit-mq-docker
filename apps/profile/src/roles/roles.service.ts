import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoleDto } from "./dto/create-role.dto";
import { InjectModel } from "@nestjs/sequelize";
import { AddRoleDto } from './dto';
import { ProfileService } from '../profile.service';
import { Role } from '@app/common/database/roles.model';

@Injectable()
export class RolesService {
  
  constructor(@InjectModel(Role) private roleRepository: typeof Role,
    private profileService: ProfileService) { }
  
  async createRole(dto: CreateRoleDto) {
    const role = await this.roleRepository.create(dto);
    return role;
  }
  
  async getRoleByValue(value: string) {
    const role = await this.roleRepository.findOne({ where: { value } })
    return role;
  }
  
  async giveRole(dto: AddRoleDto) {
    const user = await this.profileService.getUserById(dto.userId);
    const role = await this.getRoleByValue(dto.value);
    if (role && user) {
        await user.user.$add('role', role.id);
        return dto;
    }
    throw new HttpException('Пользователь или роль не найдены', HttpStatus.NOT_FOUND);
}
}
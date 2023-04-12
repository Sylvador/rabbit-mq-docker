import { Controller } from '@nestjs/common';
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { AddRoleDto } from './dto';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller()
export class RolesController {
  constructor(private roleService: RolesService) { }

  @MessagePattern({ cmd: 'create-role' })
  create(@Payload() dto: CreateRoleDto) {
    return this.roleService.createRole(dto);
  }

  @MessagePattern({ cmd: 'get-role-by-value' })
  getByValue(@Payload() value: string) {
    return this.roleService.getRoleByValue(value);
  }

  @MessagePattern({ cmd: 'give-role' })
  giveRole(@Payload() dto: AddRoleDto) {
    return this.roleService.giveRole(dto);
  }
}
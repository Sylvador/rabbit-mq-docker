import { Controller, UseFilters } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { AuthDto } from 'apps/auth/src/dto/auth.dto';
import { Tokens } from '@app/common/types';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { SharedService } from '@app/common/rmq/shared.services';
// import { ExceptionFilter } from '@app/common/exceptions/rpc-exception.filter';
import { HttpExceptionFilter } from '@app/common/exceptions/http-exception.filter';
import { AllExceptionsFilter } from '@app/common/exceptions/all-exceptions.filter';

// @UseFilters(AllExceptionsFilter)
@Controller()
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly sharedService: SharedService
  ) {}

  @MessagePattern({ cmd: 'test' })
  test(@Payload() data: any, @Ctx() ctx: RmqContext) {
    this.sharedService.acknowledgeMessage(ctx);
    return data;
  }
  
  //invoke authService.signup, create user & profile, return tokens
  @MessagePattern({ cmd: 'signup' })
  signup(@Payload('createProfileDto') createProfileDto: CreateProfileDto,
  @Payload('profilePic') profilePic: Buffer,
  @Ctx() ctx: RmqContext): Promise<Tokens> {
    this.sharedService.acknowledgeMessage(ctx);
    return this.profileService.signup(createProfileDto, profilePic);
  }

  @MessagePattern({ cmd: 'signin' })
  signin(@Payload() authDto: AuthDto, @Ctx() ctx: RmqContext): Promise<Tokens> {
    this.sharedService.acknowledgeMessage(ctx);
    return this.profileService.signin(authDto);
  }

  @MessagePattern({ cmd: 'refreshTokens'})
  refreshTokens(@Payload('userId') userId: number, @Payload('refreshToken') refreshToken: string, @Ctx() ctx: RmqContext): Promise<Tokens> {
    this.sharedService.acknowledgeMessage(ctx);
    return this.profileService.refreshTokens(userId, refreshToken);
  }
  
  @MessagePattern({ cmd: 'update-profile' })
  updateProfile(
    @Payload('id') id: string,
    @Payload('updateProfileDto') updateProfileDto: UpdateProfileDto,
    @Payload('updateUserDto') updateUserDto: AuthDto,
    @Ctx() ctx: RmqContext) {
    console.log('PROFILE CONTROLLER')
    this.sharedService.acknowledgeMessage(ctx);
    return this.profileService.update(+id, updateProfileDto, updateUserDto);
  }

  @MessagePattern({ cmd: 'update-profile-pic' })
  updateProfilePic(@Payload('id') id: string,
  @Payload('profilePic') profilePic: Buffer,
  @Ctx() ctx: RmqContext) {
    this.sharedService.acknowledgeMessage(ctx);
    return this.profileService.updateProfilePic(+id, profilePic);
  }

  @MessagePattern({ cmd: 'get-profile-by-id'})
  findOne(@Payload() id: string, @Ctx() ctx: RmqContext) {
    this.sharedService.acknowledgeMessage(ctx);
    return this.profileService.getUserById(+id);
  }

  @MessagePattern({ cmd: 'delete-user' })
  removeUser(@Payload() id: string, @Ctx() ctx: RmqContext) {
    this.sharedService.acknowledgeMessage(ctx);
    return this.profileService.removeUser(+id);
  }

  @MessagePattern({ cmd: 'get-all-profiles' })
  getAllProfiles(@Ctx() ctx: RmqContext) {
    this.sharedService.acknowledgeMessage(ctx);
    return this.profileService.getAllProfiles();
  }
}

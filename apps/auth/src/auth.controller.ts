import { Controller, UseFilters } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Tokens } from '@app/common/types';
import { Ctx, MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProfileDto } from 'apps/profile/src/dto/create-profile.dto';
import { User } from '@app/common/database/user.model';
import { AuthDto } from './dto/auth.dto';
// import { ExceptionFilter } from '@app/common/exceptions/rpc-exception.filter';
import { SharedService } from '@app/common/rmq/shared.services';
import { AllExceptionsFilter } from '@app/common/exceptions/all-exceptions.filter';

// @UseFilters(AllExceptionsFilter)
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService,
    private readonly sharedService: SharedService,
    ) { }

  @MessagePattern({ cmd: 'refreshTokens' })
  refreshTokens(
    @Payload('userId') userId: number,
    @Payload('refreshToken') refreshToken: string,
    @Ctx() ctx,
  ): Promise<Tokens> {
    this.sharedService.acknowledgeMessage(ctx);
    return this.authService.refreshTokens(userId, refreshToken);
  }

  @MessagePattern({ cmd: 'get-user-by-id' })
  getUserById(@Payload() id: string, @Ctx() ctx,): Promise<User> {
    this.sharedService.acknowledgeMessage(ctx);
    return this.authService.getUserById(+id);
  }

  @MessagePattern({ cmd: 'get-all-users' })
  getAllUsers(@Ctx() ctx,): Promise<User[]> {
    this.sharedService.acknowledgeMessage(ctx);
    return this.authService.getAllUsers();
  }

  @MessagePattern({ cmd: 'createUser' })
  createUser(@Payload() profileDto: CreateProfileDto, @Ctx() ctx,): Promise<User> {
    this.sharedService.acknowledgeMessage(ctx);
    return this.authService.createUser(profileDto)
  }
  @MessagePattern({ cmd: 'generateTokens' })
  generateTokens(@Payload('user') user: User, @Payload('email') email, @Ctx() ctx,): Promise<Tokens> {
    this.sharedService.acknowledgeMessage(ctx);
    return this.authService.generateTokens(user, email)
  }
  @MessagePattern({ cmd: 'updateRtHash' })
  updateRtHash(
    @Payload('id') userId: number | string,
    @Payload('refreshToken') refreshToken: string,
    @Ctx() ctx,
  ): Promise<void> {
    this.sharedService.acknowledgeMessage(ctx);
    return this.authService.updateRtHash(+userId, refreshToken);
  }
  @MessagePattern({ cmd: 'signin' })
  signin(
    @Payload('email') email: string,
    @Payload('password') password: string,
    @Ctx() ctx,
  ): Promise<Tokens> {
    this.sharedService.acknowledgeMessage(ctx);
    return this.authService.signin(email, password);
  }
  @MessagePattern({ cmd: 'updateUser' })
  updateUser(
    @Payload('userId') userId: number | string,
    @Payload('updateUserDto') authDto: AuthDto,
    @Ctx() ctx,
  ) {
    this.sharedService.acknowledgeMessage(ctx);
    this.authService.updateUser(+userId, authDto);
  }
  @MessagePattern({ cmd: 'removeUser' })
  removeUser(@Payload() userId, @Ctx() ctx,) {
    this.sharedService.acknowledgeMessage(ctx);
    this.authService.removeUser(userId);
  }
}

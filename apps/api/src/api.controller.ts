import { Body, Headers, Controller, FileTypeValidator, Get, Inject, ParseFilePipe, Post, Req, UploadedFile, UseInterceptors, UseGuards, HttpCode, HttpStatus, Param, Patch, Delete, UseFilters, HttpException } from '@nestjs/common';
import { BaseRpcExceptionFilter, ClientProxy } from '@nestjs/microservices';
import { GetCurrentUser, GetCurrentUserId, Public, Roles } from '@app/common/decorators';
import { Tokens } from '@app/common/types';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AtGuard, RtGuard } from './guards';
import { Observable, catchError, firstValueFrom, map } from 'rxjs';
import { AuthDto } from '../../auth/src/dto/auth.dto';
import { UpdateProfileDto } from '../../profile/src/dto/update-profile.dto';
import { ProfileUpdateGuard } from './guards/profile-update.guard';
import { AddRoleDto, CreateRoleDto } from '../../profile/src/roles/dto';
import { RolesGuard } from './guards/roles.guard';
import { Files } from '../../profile/src/files/files.model';
import { FileDto } from '../../profile/src/files/dto/file.dto';
import { GrpcToHttpInterceptor } from 'nestjs-grpc-exceptions';
import { CreateProfileDto } from '../../profile/src/dto/create-profile.dto';

@UseGuards(AtGuard)
@Controller('api')
export class ApiController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('PROFILE_SERVICE') private readonly profileClient: ClientProxy
  ) {}
  @Public()
  @Get('test') 
  test() {
    return { msg: 'msg' };
  }
  @ApiOperation({ summary: 'Регистрация. Возвращает access и refresh токены' })
  @Post('profile/signup')
  @Public()
  @UseInterceptors(FileInterceptor('profilePic'), GrpcToHttpInterceptor)
  async signup(@Body() createProfileDto: CreateProfileDto,
  @UploadedFile(new ParseFilePipe({
    fileIsRequired: false,
    validators: [
      new FileTypeValidator({ fileType: 'image' }),
    ],
  })) profilePic?: Express.Multer.File) {
    return this.profileClient.send({ cmd: 'signup' }, { createProfileDto, profilePic: profilePic.buffer });
  }

  @ApiOperation({ summary: 'Войти по логину и паролю. Возвращает access и refresh токены' })
  @Public()
  @Post('profile/signin')
  signin(@Body() authDto: AuthDto): Observable<Tokens> {
    return this.profileClient.send({ cmd: 'signin' }, authDto);
  }

  @ApiOperation({ summary: 'Обновить данные профиля. Только админ или владелец(из таблицы users) профиля' })
  @Patch('profile/:id')
  @UseGuards(ProfileUpdateGuard)
  updateProfile(@Param('id') id: string, @Body('updateProfileDto') updateProfileDto: UpdateProfileDto, @Body('updateUserDto') updateUserDto: AuthDto) {
    return this.profileClient.send({ cmd: 'update-profile'}, { id, updateProfileDto, updateUserDto });
  }

  @ApiOperation({ summary: 'Обновить аватарку. Ничего не возвращает' })
  @Patch('profile/profile-pic/:id')
  @UseGuards(ProfileUpdateGuard)
  @UseInterceptors(FileInterceptor('profilePic'))
  updateProfilePic(@Param('id') id: string, @UploadedFile(new ParseFilePipe({
    fileIsRequired: false,
    validators: [
      new FileTypeValidator({ fileType: 'image' }),
    ],
  })) profilePic: Express.Multer.File) {
    return this.profileClient.send({ cmd: 'update-profile-pic' }, { id, profilePic: profilePic.buffer });
  }

  @ApiOperation({ summary: 'Получить профиль по id юзера вместе с самой сущностью user из таблицы users' })
  @Public()
  @Get('profile/:id')
  getProfileById(@Param('id') id: string) {
    return this.profileClient.send({ cmd: 'get-profile-by-id' }, id);
  }

  @Public()
  @Get('profile')
  getAllProfiles() {
    return this.profileClient.send({ cmd: 'get-all-profiles' }, '');
  }

  @ApiOperation({ summary: 'Удалить профиль вместе с пользователем. Только админ или сам юзер' })
  @Delete('profile/:id')
  @Roles('ADMIN')
  @UseGuards(ProfileUpdateGuard)
  removeUser(@Param('id') id: string) {
    return this.profileClient.send({ cmd: 'delete-user' }, id);
  }

  @ApiOperation({ summary: 'Создать роль' })
  @Post('roles')
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  createRole(@Body() dto: CreateRoleDto) {
    return this.profileClient.send({ cmd: 'create-role' }, dto);
  }

  @ApiOperation({ summary: 'Получить роль по названию' })
  @Get('roles/:value')
  getByValue(@Param('value') value: string) {
    return this.profileClient.send({ cmd: 'get-role-by-value' }, value);
  }

  @ApiOperation({ summary: 'Выдать роль' })
  @ApiResponse({ status: 200 })
  @Public()
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('roles/giverole')
  giveRole(@Body() dto: AddRoleDto) {
    return this.profileClient.send({ cmd: 'give-role'}, dto);
  }

  //add image as preview, return file's full path
  @ApiOperation({ summary: 'Добавляет превью в форму создания фильма. Пункт 6 домашнего задания.' })
  @Post('files/add-preview-image')
  @Public()
  @UseInterceptors(FileInterceptor('image'))
  addImageAsPreview(@UploadedFile(new ParseFilePipe({
    fileIsRequired: false,
    validators: [
      new FileTypeValidator({ fileType: 'image' }),
    ],
  })) image: Express.Multer.File): Observable<string> {
    return this.profileClient.send({ cmd: 'add-preview-image' }, image.buffer);
  }

  //bind image to essence
  @ApiOperation({ summary: 'Связать уже добавленное превью с сущностью в таблице' })
  @Post('files/bind-image-to-essence')
  @Public()
  @UseInterceptors(FileInterceptor('image'))
  bindImageToEssence(@Body() fileDto: FileDto): Observable<Files> {
    return this.profileClient.send({ cmd: 'bind-image-to-essence' }, fileDto);
  }

  @ApiOperation({ summary: 'Очистить папку превью от изображений, с момента добавления которых прошло больше часа и которые не связаны ни с одной сущностью' })
  @Get('files/clean-preview-folder')
  @Public()
  cleanPreviewFolder() {
    return this.profileClient.send({ cmd: 'clean-preview-folder'}, '')
  }

  @ApiOperation({ summary: 'Обновить токены. Возвращает access и refresh токены' })
  @Public()
  @UseGuards(RtGuard)
  @Post('auth/refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(
    @GetCurrentUserId() userId: number,
    @GetCurrentUser('refreshToken') refreshToken: string,
  ): Observable<Tokens> {
    return this.authClient.send({ cmd: 'refresh' }, { userId, refreshToken });
  }

  @Get('auth/:id')
  @Public()
  getUserById(@Param('id') id: string) {
    return this.authClient.send({ cmd: 'get-user-by-id' }, id);
  }

  @Get('auth')
  @Public()
  getAllUsers() {
    return this.authClient.send({ cmd: 'get-all-users' }, '');
  }
}

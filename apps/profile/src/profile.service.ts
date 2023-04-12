import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateProfileDto } from './dto/create-profile.dto';
import { ValidationError } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { AuthDto } from 'apps/auth/src/dto/auth.dto';
import { FilesService } from './files/files.service';
import { Profile } from '@app/common/database/profile.model';
import { User } from '@app/common/database/user.model';
import { Tokens } from '@app/common/types';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProfileService {
  
  constructor(@InjectModel(Profile) private profileRepository: typeof Profile,
  @Inject('AUTH_SERVICE') private authClient: ClientProxy,
  private fileService: FilesService) {}
  
  //create user, invoke createProfile, get tokens
  async signup(profileDto: CreateProfileDto, profilePic?: Buffer): Promise<Tokens> {
    let user: User;
    try {
      const usernameTaken = await this.profileRepository.findOne({ where: { username: profileDto.username }});
      if (usernameTaken) {
        throw new RpcException({message: 'Пользователь с таким username уже существует', statusCode: HttpStatus.BAD_REQUEST});
      }
      //Через 2 сервиса из authClient до api RpcException не долетает, приходит 500 ошибка, надеюсь в данном задании это не слишком критично, так как сервер хотя бы не падает
      user = await firstValueFrom(this.authClient.send({ cmd: 'createUser' }, profileDto));
      //generate tokens
      const tokens: Tokens = await firstValueFrom(this.authClient.send<Tokens>({ cmd: 'generateTokens' }, { user, email: profileDto.email }));
      this.authClient.send({ cmd: 'updateRtHash' }, { id: user.id, refreshToken: tokens.refreshToken} );
      //bind profile to user
      const profile: Profile = await this.createProfile(profileDto, user.id, profilePic);
      await user.$set('profile', profile);
      user.profile = profile

      return tokens;
    } catch (error) {
      console.log('Ошибка')
      if (user) {
        console.log(error)
        user.destroy();
      }
      throw error;
    }
  }
  
  async signin(authDto: AuthDto): Promise<Tokens> {
    const tokens = await firstValueFrom(this.authClient.send({ cmd: 'signin' }, { email: authDto?.email, password: authDto?.password }));
    return tokens;
  }
  
  async refreshTokens(userId: number, refreshToken: string): Promise<Tokens> {
    return await firstValueFrom(this.authClient.send({ cmd: 'refreshTokens' }, { userId, refreshToken }));
  }
  //create profile for userId
  async createProfile(profileDto: CreateProfileDto, userId: number, profilePic?: Buffer,): Promise<Profile> {
    const profile = await this.profileRepository.create({...profileDto, userId });
    
    if (profilePic) {
      const fileName = await this.fileService.createFile(profilePic, {folderName: 'profile-pictures', essenceId: profile.id, essenceTable: 'profiles'});
      profile.profilePic = fileName;
      profile.save();
    }
    
    return profile;
  }

  async updateProfilePic(userId: number, profilePic: Buffer) {
    const profile = await this.profileRepository.findOne({ where: { userId }});
    
    if(profile.profilePic) {
      await this.fileService.deleteFile(profile.profilePic);
    }

    const fileName = await this.fileService.createFile(profilePic, {folderName: 'profile-pictures', essenceId: profile.id, essenceTable: 'profiles'});

    profile.profilePic = fileName;

    profile.save();
  }

  async update(userId: number, profileDto: UpdateProfileDto, updateUserDto: AuthDto) {
    const user = await this.profileRepository.findOne({ where: { userId }, include: User});
    if (!user) throw new HttpException('Пользователь не найден', HttpStatus.BAD_REQUEST);
    
    //update profile
    if (profileDto) {
      for (const [key, value] of Object.entries(profileDto)) {
        if ((key in user) && key !== 'user') {
          user[key] = value;
        }
      }
    }
    //update email and password
    if (updateUserDto) {
      console.log({ cmd: 'updateUser' })
      const error = await firstValueFrom(this.authClient.send({ cmd: 'updateUser'}, {userId, updateUserDto}));
      if (error) {
        throw new HttpException(error.errors[0].message, HttpStatus.BAD_REQUEST);
      }
    }
    try {
      await user.save();
    } catch (error) {
      if (error instanceof ValidationError) throw new HttpException(error.errors[0].message, HttpStatus.BAD_REQUEST);
    }

    //bug?: returns not updated email and password, but has it actually updated
    return user;
  }
  
  async getUserById(userId: number) {
    return await this.profileRepository.findOne({ where: { userId }, include: { all: true }});
  }

  async getAllProfiles() {
    return await this.profileRepository.findAll({ include: { all: true }});
  }

  async removeUser(userId: number) {
    const user = await this.profileRepository.findByPk(userId);
    this.authClient.send({ cmd: 'removeUser' }, userId);
    user.destroy();
    this.fileService.deleteFile(user.profilePic);
  }
}

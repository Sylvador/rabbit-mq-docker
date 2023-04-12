import { ForbiddenException, HttpException, HttpStatus, Injectable, UseFilters } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import *  as argon from 'argon2'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config';
import { AuthDto } from './dto/auth.dto';
import { ValidationError } from 'sequelize';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from '@app/common/database/user.model';
import { JwtPayload, Tokens } from '@app/common/types';
import { RpcException } from '@nestjs/microservices';
import { ExceptionFilter } from '@app/common/exceptions/rpc-exception.filter';

@Injectable()
export class AuthService {
  constructor(@InjectModel(User) private userRepository: typeof User,
  private jwtService: JwtService,
  private config: ConfigService) { }
  //create user instance, return userId
  async createUser(userDto: CreateUserDto): Promise<User> {
    const candidate = await this.userRepository.findOne({ where: { email: userDto.email } });
    // А вот отсюда, к сожалению, rpcException пока не долетает до api, приходит 500 ошибка
    if (candidate) {
      throw new RpcException({ message: 'Пользователь с таким email уже существует', statusCode: HttpStatus.BAD_REQUEST});
    }

    const hashedPassword = await argon.hash(userDto.password);
    const newUser = await this.userRepository.create({ ...userDto, hashedPassword })
    return newUser;
  }

  async signin(email: string, password: string): Promise<Tokens> {
    const user = await this.userRepository.findOne({ where: { email }, include: { all: true } });

    if (!user) {
      throw new ForbiddenException('Access Denied');
    }

    const passwordMatch = await argon.verify(user.hashedPassword, password);
    if(!passwordMatch) {
      throw new ForbiddenException('Неверный логин или пароль');
    }

    const tokens = await this.generateTokens(user, email);
    
    await this.updateRtHash(user.id, tokens.refreshToken);
    
    return tokens;
  }
  
  async generateTokens(user: User, email: string): Promise<Tokens> {
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email,
      roles: user.roles
    }
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        jwtPayload,
        {
          expiresIn: '15m',
          secret: this.config.get<string>('ACCESS_TOKEN_SECRET_KEY'),
        }),
      this.jwtService.signAsync(
        jwtPayload,
        {
          expiresIn: '7d',
          secret: this.config.get<string>('REFRESH_TOKEN_SECRET_KEY'),
        }
        )
      ]);
      return {
      accessToken,
      refreshToken
    };
  }

  async refreshTokens(userId: number, rt: string): Promise<Tokens> {
    const user = await this.userRepository.findByPk(userId);
    if (!user?.hashedRt) {
      console.log(userId)
      throw new ForbiddenException('Access Denied');
    }
    const rtMatches = argon.verify(user.hashedRt, rt);
    if (!rtMatches) {
      throw new ForbiddenException('Access Denied');
    }
    const tokens = await this.generateTokens(user, user.email);
    await this.updateRtHash(userId, tokens.refreshToken);

    return tokens;
  }

  async updateRtHash(userId: number, rt: string): Promise<void> {
    const hashedRt = await argon.hash(rt);
    await this.userRepository.update({ hashedRt }, { where: { id: userId } });
  
  }

  async updateUser(userId: number, authDto: AuthDto) {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
  
      if (authDto.password) {
        await this.changePassword(userId, authDto.password);
      }
  
      for (const [key, value] of Object.entries(authDto)) {
        if (key in user) {
          console.log('true')
          user[key] = value;
        }
      }
  
      await user.save();
    } catch (error) {
      if (error instanceof ValidationError) return error;
      throw error;
    }
  }

  async changePassword(userId: number, password: string) {
    const hashedPassword = await argon.hash(password);

    await this.userRepository.update({ hashedPassword }, { where: { id: userId } });
  }

  async removeUser(userId: number) {
    await this.userRepository.destroy({ where: { id: userId }});
  }

  async getUserById(userId: number) {
    return await this.userRepository.findByPk(userId);
  }

  async getAllUsers() {
    return await this.userRepository.findAll();
  }
}

import { Test } from '@nestjs/testing';
import { JwtModule, JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { getModelToken } from '@nestjs/sequelize';
import { CreateProfileDto } from 'apps/profile/src/dto/create-profile.dto';
import { Tokens } from '@app/common/types';
import { ForbiddenException } from '@nestjs/common';
import * as argon from 'argon2';
import { AuthDto } from '../src/dto/auth.dto';

describe('AuthService', () => {
  let jwtService: JwtService;
  type User = {
    id: number;
    email: string;
    password: string;
    hashedRt: string | null;
  }
  let userRepository = {
    db: [
      {
        id: 1,
        email: 'user@mail.ru',
        password: '1234',
        hashedRt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsImVtYWlsIjoidXNlckBtYWlsLnJ1In0.zC0XPQ8poO_X3SZE4g70-0UeI1KZxqOm-t-GyyUFgoE'
      },
      {
        id: 2,
        email: 'user2@mail.ru',
        password: '2345',
        hashedRt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjIsImVtYWlsIjoidXNlcjJAbWFpbC5ydSJ9.y4FX5O3qyGHXBq6mwZBRkr9vd3U7YDxKjUzFkpSPhg8'
      },
      {
        id: 3,
        email: 'user3@mail.ru',
        password: '3456',
        hashedRt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoidXNlcjNAbWFpbC5ydSJ9.mA_7QxvkpERcj6PyM5RnLYRzaIZNzrT0JbtRKwEjPs0'
      },
      {
        id: 4,
        email: 'user4@mail.ru',
        password: '4567',
        hashedRt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsImVtYWlsIjoidXNlcjRAbWFpbC5ydSJ9.Li3BBslk66zcWxIrYGa9iiRmclCl5tC5A8LPMVdDx-4'
      },
    ] as User[],
    findByPk: jest.fn((pk: number) => userRepository.db.find(user => user.id == pk) as User),
    findByEmail: jest.fn((email: string): User => userRepository.db.find(user => user.email === email)),
    createUser: jest.fn((dto: AuthDto) => {
      userRepository.db.push({ ...dto, id: userRepository.db.length + 1, hashedRt: ''});
      return userRepository.db.at(-1);
    }),
  }
  const mockAuthService = {
    generateTokens: jest.fn(async (userId: number, email: string) => {
      const jwtPayload = {
        sub: userId,
        email,
      }
      const [accessToken, refreshToken] = await Promise.all([
        jwtService.signAsync(
          jwtPayload,
          {
            expiresIn: '15m',
            secret: 'at-secret',
          }),
        jwtService.signAsync(
          jwtPayload,
          {
            expiresIn: '7d',
            secret: 'rt-secret',
          }
          )
        ]);
        return { accessToken, refreshToken };
    }),
    signup: jest.fn(async dto => {
      const user = userRepository.createUser(dto);
      const tokens = await mockAuthService.generateTokens(user.id, user.email);
      user.hashedRt = tokens.refreshToken;
      return tokens;
    }),
    signin: jest.fn(async (dto: AuthDto): Promise<Tokens> => {
      const user = userRepository.findByEmail(dto.email);
      if (user?.password === dto.password) {
        return mockAuthService.generateTokens(user.id, user.email);
      }
      throw new ForbiddenException('Access Denied');
    }),
    refreshTokens: jest.fn(async (userId: number, rt: string): Promise<Tokens> => {
      const user = userRepository.findByPk(userId);
      if (!user?.hashedRt) {
        console.log(userId)
        throw new ForbiddenException('Access Denied');
      }
      const rtMatches = argon.verify(user.hashedRt, rt);
      if (!rtMatches) {
        throw new ForbiddenException('Access Denied');
      }
      const tokens = await mockAuthService.generateTokens(user.id, user.email);
      user.hashedRt = tokens.refreshToken;

      return tokens;
    }),
  };
  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [],
      controllers: [],
      providers: [
        JwtService,
        ],
    })
    .compile();

    jwtService = await moduleRef.resolve<JwtService>(JwtService);
  });

  describe('signup', () => {
    let tokens: Tokens;
    it('should register a new user and return access and refresh tokens', async () => {
      const authDto: AuthDto = {
        email: 'user@mail.ru',
        password: '1234'
      };

      tokens = await mockAuthService.signup(authDto);
      
      const user = jwtService.verify(tokens.accessToken, {secret: 'at-secret'});
      expect(userRepository.createUser).toHaveBeenCalled();
      expect(user.email).toEqual(authDto.email);
    });
    it('tokens returned', () => {
      expect(tokens).toBeDefined();
    })
  })

  describe('signin', () => {
    it('should return tokens with correct credentials provided', async () => {
      const authDto: AuthDto = {
        email: 'user@mail.ru',
        password: '1234'
      };
      const tokens: Tokens = await mockAuthService.signin(authDto);

      expect(tokens).toBeDefined();
    });

    it('should deny access with wrong credentials', async () => {
      const authDto: AuthDto = {
        email: 'user@mail.ru',
        password: '432323'
      };
      let tokens: Tokens;
      try {
        tokens = await mockAuthService.signin(authDto);
      } catch (error) {
        tokens = undefined;
      }

      expect(tokens).not.toBeDefined();
    })
  })
});

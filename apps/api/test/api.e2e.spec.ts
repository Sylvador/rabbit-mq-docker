import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ApiModule } from '../src/api.module';
import { SharedModule } from '@app/common/rmq/shared.module';
import { ClientProxy, ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { AuthDto } from '../../auth/src/dto/auth.dto';
import { AtGuard } from '../src/guards';
import { ProfileUpdateGuard } from '../src/guards/profile-update.guard';
import { RolesGuard } from '../src/guards/roles.guard';

describe('ApiController (e2e)', () => {
  let app: INestApplication;
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
  let profileClient = { 
    send: jest.fn().mockReturnValueOnce(userRepository.db)
  }
  
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ApiModule,
      ],
    })
    .overrideProvider('PROFILE_SERVICE')
    .useValue(profileClient)
    .overrideGuard(AtGuard)
    .useValue({})
    .overrideGuard(ProfileUpdateGuard)
    .useValue({})
    .overrideGuard(RolesGuard)
    .useValue({})
    .compile();
    app = moduleFixture.createNestApplication();

    app.startAllMicroservices();
    await app.init();
  });
  
  it('/api/profile (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/profile')
      .expect(200)
      .expect(userRepository.db)
  });

  it('Получить пользователя по id', () => {
    profileClient.send.mockImplementationOnce(id => userRepository.db.find(user => user.id == 1));

    return request(app.getHttpServer())
      .get('/api/profile/1')
      .expect(200)
      .expect(userRepository.db[0])
  })

  it('Удаление пользователя по id', () => {
    profileClient.send.mockImplementationOnce(id => {
      const index = userRepository.db.find((user, index) => user.id == 1 ? index : false)
      userRepository.db.splice(index, 1);
    })

    return request(app.getHttpServer())
      .delete('/api/profile/1')
      .expect(200)
      .then(() => expect(userRepository.findByPk(1)).toBeUndefined())
  })

  it('Создать роль', () => {
    let roles = [
      { value: 'ADMIN' , description: 'Администратор' },
    ]
    const role = { value: 'USER', description: 'Пользователь' };
    profileClient.send.mockImplementationOnce(jest.fn(() => {
      roles.push(role)
      return role;
    }));
    return request(app.getHttpServer())
      .post('/api/roles')
      .send(role)
      .expect(201)
      .expect(role)
      .then(() => expect(roles[1]).toEqual(role));
  })
});

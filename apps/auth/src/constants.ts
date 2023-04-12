import { ConfigService } from "@nestjs/config";
const config = new ConfigService();
export const jwtConstants = {
  rtSecret: config.get<string>('REFRESH_TOKEN_SECRET_KEY'),
  atSecret: config.get<string>('ACCESS_TOKEN_SECRET_KEY'),
};
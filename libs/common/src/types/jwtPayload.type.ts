import { Role } from "@app/common/database/roles.model";

export type JwtPayload = {
  email: string;
  sub: number;
  roles: Role[];
}
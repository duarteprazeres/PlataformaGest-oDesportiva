export interface JwtPayload {
  email: string;
  sub: string;
  clubId: string;
  role: string;
  globalParentId?: string;
}

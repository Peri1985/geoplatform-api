export interface AuthConfig {
  jwtSecret: string;
  // Access token lifetime in seconds
  accessTokenTtl: number;
  refreshTokenTtlDays: number;
}

// Read at startup: the api refuses to start without a proper JWT_SECRET
export function authConfig(): AuthConfig {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set to at least 32 characters (see apps/api/.env.example)',
    );
  }
  return {
    jwtSecret,
    accessTokenTtl: Number(process.env.ACCESS_TOKEN_TTL ?? 900),
    refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),
  };
}

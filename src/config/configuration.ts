export type Configuration = {
  nodeEnv: string;
  port: number;
  database: {
    url: string;
    poolSize: number;
  };
  redis: {
    url: string;
  };
  jwt: {
    secretKey: string;
    algorithm: string;
    accessTokenExpireMinutes: number;
    refreshTokenExpireDays: number;
  };
  cors: {
    origins: string[];
  };
};

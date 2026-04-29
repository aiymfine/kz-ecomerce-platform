import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { StorefrontController } from './storefront.controller';
import { StorefrontService } from './storefront.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: `${config.get<number>('JWT_ACCESS_TOKEN_EXPIRE_MINUTES', 30)}m` },
      }),
    }),
  ],
  controllers: [StorefrontController],
  providers: [StorefrontService],
})
export class StorefrontModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AbandonedCartsController } from './abandoned-carts.controller';
import { AbandonedCartsService } from './abandoned-carts.service';

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
  controllers: [AbandonedCartsController],
  providers: [AbandonedCartsService],
})
export class AbandonedCartsModule {}

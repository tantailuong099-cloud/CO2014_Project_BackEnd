import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DatabaseModule } from 'src/database/database.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        DatabaseModule,
        JwtModule.register({
            global: true,
            secret: 'MY_SECRET_KEY_123', // Nên để trong .env, nhưng để đây test cho nhanh
            signOptions: { expiresIn: '1d' }, // Token hết hạn sau 1 ngày
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule {}
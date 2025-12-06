import { Module } from '@nestjs/common';
import { AdministratorController } from './administrator.controller';
import { AdministratorService } from './administrator.service';
import { DatabaseModule } from 'src/database/database.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [DatabaseModule, UserModule],
  controllers: [AdministratorController],
  providers: [AdministratorService],
})
export class AdministratorModule {}

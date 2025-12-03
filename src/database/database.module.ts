import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { DatabaseInstallService } from './database-install.service';

import { Administrator } from './entities/administrator.entity';
import { User } from './entities/user.entity';
import { Location } from './entities/location.entity';
import { Guest } from './entities/guest.entity';
import { Host } from './entities/host.entity';
import { AccommodationType } from './entities/accommodation-type.entity';
import { AccommodationSubtype } from './entities/accommodation-subtype.entity';
import { Accommodation } from './entities/accommodation.entity';
import { Contact } from './entities/contact.entity';
import { Reviews } from './entities/reviews.entity';
import { Post } from './entities/post.entity';
import { Booking } from './entities/booking.entity';
import { Payment } from './entities/payment.entity';
import { Cancellation } from './entities/cancellation.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [
          Administrator,
          User,
          Guest,
          Host,
          Location,
          AccommodationType,
          AccommodationSubtype,
          Accommodation,
          Contact,
          Reviews,
          Post,
          Booking,
          Payment,
          Cancellation,
        ],
        synchronize: false,
        extra: { multipleStatements: true },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [DatabaseService, DatabaseInstallService],
  exports: [DatabaseService],
})
export class DatabaseModule implements OnModuleInit {
  constructor(private installer: DatabaseInstallService) {}

  async onModuleInit() {
    // await this.installer.runSQLFile('init_data.sql');
    await this.installer.runSQLFile('procedures.sql');
    await this.installer.runSQLFile('functions.sql');
    await this.installer.runSQLFile('triggers.sql');

    console.log('📌 SQL scripts executed successfully!');
  }
}

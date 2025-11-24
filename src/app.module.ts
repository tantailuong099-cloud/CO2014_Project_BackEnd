import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { ReviewsModule } from './reviews/reviews.module';
import { PostModule } from './post/post.module';
import { PaymentModule } from './payment/payment.module';
import { LocationModule } from './location/location.module';
import { HostModule } from './host/host.module';
import { GuestModule } from './guest/guest.module';
import { ContactModule } from './contact/contact.module';
import { CancellationModule } from './cancellation/cancellation.module';
import { BookingModule } from './booking/booking.module';
import { AdministratorModule } from './administrator/administrator.module';
import { AccommodationModule } from './accommodation/accommodation.module';
import { AccommodationTypeModule } from './accommodation-type/accommodation-type.module';
import { AccommodationSubtypeModule } from './accommodation-subtype/accommodation-subtype.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    ReviewsModule,
    PostModule,
    PaymentModule,
    LocationModule,
    HostModule,
    GuestModule,
    ContactModule,
    CancellationModule,
    BookingModule,
    AdministratorModule,
    AccommodationModule,
    AccommodationTypeModule,
    AccommodationSubtypeModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

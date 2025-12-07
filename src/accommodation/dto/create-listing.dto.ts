// export class CreateListingDto {
//     hostId: string;

//     // Phần Location
//     address: string;
//     city: string;

//     // Phần Accommodation
//     title: string;
//     description: string;
//     typeId: string; // Frontend phải gửi ID của loại nhà (VD: Apartment, Villa)
//     pricePerNight: number;
//     maxGuests: number;
//     numBeds: number;
//     numBedrooms: number;
//     numBathrooms: number;
//     amenities: string; // Chuỗi JSON hoặc CSV
//     imageUrl: string;
// }

import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateListingDto {
  @IsNotEmpty() @IsString() title: string;
  @IsNotEmpty() @IsString() description: string;

  @IsNotEmpty() @IsString() city: string; // Chỉ lưu: "Vung Tau", "Hanoi"...

  @IsNotEmpty() @IsString() typeId: string; // <--- MỚI: Nhận 'A01', 'B02'...

  @IsNotEmpty() pricePerNight: number | string;
  @IsNotEmpty() maxGuests: number | string;

  @IsArray() amenities: string[];
  @IsOptional() 
  numBeds?: number | string;

  @IsOptional() 
  numBedrooms?: number | string;

  @IsOptional() 
  numBathrooms?: number | string;
}

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
  MinLength,
  Min,
} from 'class-validator';

export class CreateListingDto {
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  @MinLength(10, { message: 'Tiêu đề phải dài ít nhất 10 ký tự' })
  title: string;
  @IsNotEmpty({ message: 'Mô tả không được để trống' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Vui lòng chọn thành phố' }) @IsString() city: string; // Chỉ lưu: "Vung Tau", "Hanoi"...

  @IsNotEmpty({ message: 'Vui lòng chọn loại nhà' }) @IsString() typeId: string; // <--- MỚI: Nhận 'A01', 'B02'...

  @IsNotEmpty()
  @Min(100, { message: 'Giá phòng tối thiểu là 100đ' })
  pricePerNight: number | string;

  @IsNotEmpty()
  @Min(1, { message: 'Số khách tối thiểu là 1' })
  maxGuests: number | string;

  @IsArray() amenities: string[];
  @IsOptional()
  numBeds?: number | string;

  @IsOptional()
  numBedrooms?: number | string;

  @IsOptional()
  numBathrooms?: number | string;
}

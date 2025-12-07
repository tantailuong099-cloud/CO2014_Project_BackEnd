// export class UpdateListingDto {
//     title?: string;
//     description?: string;
//     pricePerNight?: number;
//     status?: 'Active' | 'Inactive'; // Cần thêm cột này trong DB hoặc xử lý logic ẩn
//     amenities?: string;
// }

import { PartialType } from '@nestjs/mapped-types';
import { CreateListingDto } from './create-listing.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdateListingDto extends PartialType(CreateListingDto) {
    @IsOptional() @IsString() status?: 'Active' | 'Inactive';
}
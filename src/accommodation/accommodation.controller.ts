import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { AccommodationService } from './accommodation.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchAccommodationDto } from './dto/search-accommodation.dto';

@Controller('accommodations')
export class AccommodationController {
  constructor(private readonly accService: AccommodationService) { }

  // 1. HOST: Đăng nhà mới (Transaction 3 bảng)
  // API: POST /accommodations
  @Post()
  create(@Body() dto: CreateListingDto) {
    return this.accService.create(dto);
  }

  // 2. GUEST: Tìm kiếm & Lọc nhà
  // API: GET /accommodations?city=Hanoi&numGuests=2
  @Get()
  findAll(@Query() filters: SearchAccommodationDto) {
    return this.accService.findAll(filters);
  }

  // 3. COMMON: Lấy danh sách Loại nhà (Type/Subtype) để điền vào Dropdown
  // API: GET /accommodations/types
  @Get('types')
  getTypes() {
    return this.accService.getTypes();
  }

  // 4. HOST: Lấy danh sách nhà của tôi (My Listings)
  // API: GET /accommodations/host/:hostId
  @Get('host/:hostId')
  getHostListings(@Param('hostId') hostId: string) {
    return this.accService.getHostListings(hostId);
  }

  // 5. COMMON: Xem chi tiết một căn nhà
  // API: GET /accommodations/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accService.findOne(id);
  }

  // 6. HOST: Cập nhật thông tin nhà
  // API: PUT /accommodations/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
    return this.accService.update(id, dto);
  }

  // 7. HOST: Xóa nhà
  // API: DELETE /accommodations/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accService.remove(id);
  }
}
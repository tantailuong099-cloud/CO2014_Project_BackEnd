import { AccommodationService } from './accommodation.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchAccommodationDto } from './dto/search-accommodation.dto';
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('accommodation')
export class AccommodationController {
  constructor(private readonly accommodationService: AccommodationService) {}

  // // 1. HOST: Đăng nhà mới (Transaction 3 bảng)
  // // API: POST /accommodations
  // @Post()
  // create(@Body() dto: CreateListingDto) {
  //   return this.accService.create(dto);
  // }

  // // 2. GUEST: Tìm kiếm & Lọc nhà
  // // API: GET /accommodations?city=Hanoi&numGuests=2
  // @Get()
  // findAll(@Query() filters: SearchAccommodationDto) {
  //   return this.accService.findAll(filters);
  // }

  // // 3. COMMON: Lấy danh sách Loại nhà (Type/Subtype) để điền vào Dropdown
  // // API: GET /accommodations/types
  // @Get('types')
  // getTypes() {
  //   return this.accService.getTypes();
  // }

  // // 4. HOST: Lấy danh sách nhà của tôi (My Listings)
  // // API: GET /accommodations/host/:hostId
  // @Get('host/:hostId')
  // getHostListings(@Param('hostId') hostId: string) {
  //   return this.accService.getHostListings(hostId);
  // }

  // // 5. COMMON: Xem chi tiết một căn nhà
  // // API: GET /accommodations/:id
  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.accService.findOne(id);
  // }

  // // 6. HOST: Cập nhật thông tin nhà
  // // API: PUT /accommodations/:id
  // @Put(':id')
  // update(@Param('id') id: string, @Body() dto: UpdateListingDto) {
  //   return this.accService.update(id, dto);
  // }

  // // 7. HOST: Xóa nhà
  // // API: DELETE /accommodations/:id
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.accService.remove(id);
  // }


  @Get('types')
  getTypes() {
    return this.accommodationService.getAccommodationTypes();
  }
  @UseGuards(JwtAuthGuard)
  @Get('host/my-listings')
  getMyListings(@Request() req) {
    return this.accommodationService.getHostListings(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateListingDto, @Request() req) {
    return this.accommodationService.createListing(req.user.userId, dto);
  }

  // Lấy chi tiết để Edit (Check quyền Host)
  @UseGuards(JwtAuthGuard)
  @Get('host/edit/:id')
  findOneForEdit(@Param('id') id: string, @Request() req) {
    return this.accommodationService.findOneForEdit(id, req.user.userId);
  }

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('guests') guests?: string,
    @Query('checkIn') checkIn?: string,
    @Query('checkOut') checkOut?: string
  ) {
    // Chuyển đổi guests từ string sang number (mặc định là 1)
    const guestCount = guests ? parseInt(guests, 10) : 1;

    return this.accommodationService.findAll(
      search,
      guestCount,
      checkIn,
      checkOut
    );
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accommodationService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
    @Request() req
  ) {
    return this.accommodationService.updateListing(id, req.user.userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @Request() req) {
    return this.accommodationService.deleteListing(id, req.user.userId);
  }
}

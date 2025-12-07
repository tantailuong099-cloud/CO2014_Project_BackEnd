import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  // // API: POST /reviews
  // // Mục đích: Khách viết đánh giá sau khi đi
  // @Post()
  // create(@Body() dto: CreateReviewDto) {
  //   return this.reviewsService.create(dto);
  // }

  // // API: DELETE /reviews/:id
  // // Mục đích: Admin xóa review spam
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.reviewsService.remove(id);
  // }

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReviewDto, @Request() req) {
    return this.reviewsService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Query('accommodation_id') accId?: string) {
    if (accId) {
      return this.reviewsService.findByAccommodation(accId);
    }
    return this.reviewsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
  ) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reviewsService.remove(id);
  }
}

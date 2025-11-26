import { Controller, Post, Delete, Body, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  // API: POST /reviews
  // Mục đích: Khách viết đánh giá sau khi đi
  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  // API: DELETE /reviews/:id
  // Mục đích: Admin xóa review spam
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
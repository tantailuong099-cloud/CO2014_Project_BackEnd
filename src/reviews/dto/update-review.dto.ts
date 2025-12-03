// Sử dụng @nestjs/swagger như đã thảo luận ở bài trước để tránh lỗi
import { PartialType } from '@nestjs/swagger';
import { CreateReviewDto } from './create-review.dto';

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}

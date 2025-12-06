import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly databaseService: DatabaseService) {}

  // ======================================================
  // 1. CREATE REVIEW
  // ======================================================
  async create(createReviewDto: CreateReviewDto) {
    const { guestId, accommodationId, comment, rating } = createReviewDto;

    // Logic nghiệp vụ thực tế: Nên kiểm tra xem Guest đã từng Book phòng này chưa và đã Check-out chưa.
    // Tuy nhiên ở mức độ CRUD cơ bản, ta chỉ insert.

    const sql = `
      INSERT INTO reviews (guestId, accommodationId, Review_Date, comment, rating)
      VALUES (?, ?, CURRENT_DATE(), ?, ?);
    `;

    try {
      const result = await this.databaseService.query(sql, [
        guestId,
        accommodationId,
        comment || null,
        rating,
      ]);

      return {
        Review_ID: result.insertId,
        message: 'Review posted successfully',
      };
    } catch (error) {
      // Bắt lỗi nếu guestId hoặc accommodationId không tồn tại
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new BadRequestException(
          'Guest ID or Accommodation ID does not exist.',
        );
      }
      throw new BadRequestException(error.message);
    }
  }

  // ======================================================
  // 2. FIND ALL (Admin xem toàn bộ)
  // ======================================================
  async findAll() {
    const sql = `
      SELECT 
        r.Review_ID, r.rating, r.comment, r.Review_Date,
        u.Name AS Guest_Name,
        a.Title AS Accommodation_Title
      FROM reviews r
      JOIN guest g ON r.guestId = g.guestId
      JOIN user u ON g.guestId = u.User_ID
      JOIN accommodation a ON r.accommodationId = a.accommodationId
      ORDER BY r.Review_Date DESC;
    `;
    return await this.databaseService.query(sql);
  }

  // ======================================================
  // 3. FIND BY ACCOMMODATION (Quan trọng: Xem đánh giá của 1 phòng)
  // ======================================================
  async findByAccommodation(accId: string) {
    const sql = `
      SELECT 
        r.Review_ID, r.rating, r.comment, r.Review_Date,
        u.Name AS Guest_Name, u.ProfilePicture
      FROM reviews r
      JOIN user u ON r.guestId = u.User_ID
      WHERE r.accommodationId = ?
      ORDER BY r.Review_Date DESC;
    `;
    return await this.databaseService.query(sql, [accId]);
  }

  // ======================================================
  // 4. FIND ONE
  // ======================================================
  async findOne(id: number) {
    const sql = `SELECT * FROM reviews WHERE Review_ID = ?`;
    const results = await this.databaseService.query(sql, [id]);

    if (!results || results.length === 0) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return results[0];
  }

  // ======================================================
  // 5. UPDATE
  // ======================================================
  async update(id: number, updateReviewDto: UpdateReviewDto) {
    await this.findOne(id); // Check tồn tại

    const { comment, rating } = updateReviewDto;

    const sql = `
      UPDATE reviews
      SET 
        comment = COALESCE(?, comment),
        rating = COALESCE(?, rating)
      WHERE Review_ID = ?;
    `;

    await this.databaseService.query(sql, [comment, rating, id]);
    return this.findOne(id);
  }

  // ======================================================
  // 6. REMOVE
  // ======================================================
  async remove(id: number) {
    const sqlCheck = `SELECT Review_ID FROM reviews WHERE Review_ID = ?`;
    const check = await this.databaseService.query(sqlCheck, [id]);

    if (check.length === 0) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    const sql = `DELETE FROM reviews WHERE Review_ID = ?`;
    await this.databaseService.query(sql, [id]);

    return { message: `Review #${id} deleted successfully` };
  }
}

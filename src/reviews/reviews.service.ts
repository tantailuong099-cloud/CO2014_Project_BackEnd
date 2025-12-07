import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
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
  async create(guestId: string, dto: CreateReviewDto) {
    // 1. CHECK QUYỀN: Guest này có booking nào "Completed" tại nhà này chưa?
    // Nếu chưa ở xong thì không được review.
    const checkSql = `
      SELECT Booking_ID 
      FROM booking 
      WHERE Guest_ID = ? 
        AND Accommodation_ID = ? 
        AND Status = 'Completed'
      LIMIT 1
    `;

    const bookings = await this.databaseService.query(checkSql, [
      guestId,
      dto.accommodationId,
    ]);

    if (bookings.length === 0) {
      throw new ForbiddenException(
        'Bạn chỉ có thể đánh giá sau khi đã hoàn thành chuyến đi tại đây.'
      );
    }

    // 2. CHECK TRÙNG: (Optional) Mỗi booking chỉ được 1 review?
    // Hoặc mỗi Guest chỉ review nhà đó 1 lần?
    // Ở đây mình cho phép review thoải mái, trigger sẽ tự cộng dồn.

    // 3. INSERT REVIEW
    const insertSql = `
      INSERT INTO reviews (Guest_ID, Accommodation_ID, Review_Date, Comments, Ratings)
      VALUES (?, ?, CURDATE(), ?, ?)
    `;

    try {
      await this.databaseService.query(insertSql, [
        guestId,
        dto.accommodationId,
        dto.comment,
        dto.rating,
      ]);

      return { message: 'Đánh giá thành công!' };
    } catch (error) {
      throw new BadRequestException('Lỗi khi lưu đánh giá: ' + error.message);
    }
  }

  // ======================================================
  // GET REVIEWS BY ACCOMMODATION (Để hiện ở trang chi tiết)
  // ======================================================
  async findByAccommodation(accId: string) {
    const sql = `
      SELECT 
        r.Review_ID as id,
        r.Ratings as rating,
        r.Comments as comment,
        r.Review_Date as date,
        u.Name as guestName,
        -- Giả lập avatar nếu DB không có
        CONCAT('https://i.pravatar.cc/150?u=', r.Guest_ID) as avatar
      FROM reviews r
      JOIN user u ON r.Guest_ID = u.User_ID
      WHERE r.Accommodation_ID = ?
      ORDER BY r.Review_Date DESC
    `;
    return this.databaseService.query(sql, [accId]);
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
  // async findByAccommodation(accId: string) {
  //   const sql = `
  //     SELECT
  //       r.Review_ID, r.rating, r.comment, r.Review_Date,
  //       u.Name AS Guest_Name, u.ProfilePicture
  //     FROM reviews r
  //     JOIN user u ON r.guestId = u.User_ID
  //     WHERE r.accommodationId = ?
  //     ORDER BY r.Review_Date DESC;
  //   `;
  //   return await this.databaseService.query(sql, [accId]);
  // }

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

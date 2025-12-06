import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateHostDto } from './dto/update-host.dto';
import { CreateHostDto } from './dto/create-host.dto';

@Injectable()
export class HostService {
  constructor(private readonly databaseService: DatabaseService) {}

  // ======================================================
  // 1. GET ALL HOSTS (Kết hợp thông tin từ bảng User)
  // ======================================================
  async findAll() {
    // JOIN bảng host và user để lấy cả tên và email
    const sql = `
      SELECT 
        h.Host_ID, h.Tax_ID, h.Response_Time, h.Acceptance_Rate, h.Is_Superhost, h.Listings_Count,
        u.Name, u.Email, u.PhoneNumber, u.Joined_Date
      FROM host h
      JOIN user u ON h.Host_ID = u.User_ID;
    `;
    return await this.databaseService.query(sql);
  }

  // ======================================================
  // 2. GET ONE HOST BY ID
  // ======================================================
  async findOne(id: string) {
    const sql = `
      SELECT 
        h.Host_ID, h.Tax_ID, h.Response_Time, h.Acceptance_Rate, h.Is_Superhost, h.Listings_Count,
        u.Name, u.Email, u.PhoneNumber, u.ProfilePicture
      FROM host h
      JOIN user u ON h.Host_ID = u.User_ID
      WHERE h.Host_ID = ?;
    `;

    const results = await this.databaseService.query(sql, [id]);

    if (!results || results.length === 0) {
      throw new NotFoundException(`Host with ID ${id} not found`);
    }

    return results[0];
  }

  // ======================================================
  // 3. CREATE (Nâng cấp một User thành Host)
  // ======================================================
  async create(createHostDto: CreateHostDto) {
    const { Host_ID, Tax_ID, Response_Time, Acceptance_Rate, Is_Superhost } =
      createHostDto;

    // 1. Kiểm tra xem User_ID có tồn tại trong bảng User chưa
    const checkUserSql = `SELECT User_ID FROM user WHERE User_ID = ?`;
    const userExists = await this.databaseService.query(checkUserSql, [
      Host_ID,
    ]);

    if (userExists.length === 0) {
      throw new NotFoundException(
        `User ID ${Host_ID} does not exist. Cannot create host.`,
      );
    }

    // 2. Kiểm tra xem User này đã là Host chưa
    const checkHostSql = `SELECT Host_ID FROM host WHERE Host_ID = ?`;
    const hostExists = await this.databaseService.query(checkHostSql, [
      Host_ID,
    ]);

    if (hostExists.length > 0) {
      throw new ConflictException(`User ${Host_ID} is already a host.`);
    }

    // 3. Insert vào bảng host
    const sql = `
      INSERT INTO host (Host_ID, Tax_ID, Response_Time, Acceptance_Rate, Is_Superhost, Listings_Count)
      VALUES (?, ?, ?, ?, ?, 0);
    `;

    try {
      await this.databaseService.query(sql, [
        Host_ID,
        Tax_ID || null,
        Response_Time || 'unknown',
        Acceptance_Rate || null,
        Is_Superhost ? 1 : 0,
      ]);

      return this.findOne(Host_ID);
    } catch (error) {
      // Xử lý lỗi trùng lặp Tax_ID nếu có
      if (error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Tax ID already exists');
      }
      throw new BadRequestException(error.message);
    }
  }

  // ======================================================
  // 4. UPDATE HOST
  // ======================================================
  async update(id: string, updateHostDto: UpdateHostDto) {
    // Kiểm tra tồn tại trước
    await this.findOne(id);

    const {
      Tax_ID,
      Response_Time,
      Acceptance_Rate,
      Is_Superhost,
      Listings_Count,
    } = updateHostDto;

    // Sử dụng COALESCE (hoặc IFNULL) trong SQL để giữ nguyên giá trị cũ nếu tham số truyền vào là null/undefined
    const sql = `
      UPDATE host
      SET 
        Tax_ID = COALESCE(?, Tax_ID),
        Response_Time = COALESCE(?, Response_Time),
        Acceptance_Rate = COALESCE(?, Acceptance_Rate),
        Is_Superhost = COALESCE(?, Is_Superhost),
        Listings_Count = COALESCE(?, Listings_Count)
      WHERE Host_ID = ?;
    `;

    try {
      await this.databaseService.query(sql, [
        Tax_ID,
        Response_Time,
        Acceptance_Rate,
        Is_Superhost,
        Listings_Count,
        id,
      ]);

      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException(
        'Could not update host details: ' + error.message,
      );
    }
  }

  // ======================================================
  // 5. DELETE HOST (Hạ cấp Host về User thường)
  // ======================================================
  async remove(id: string) {
    // Kiểm tra tồn tại
    await this.findOne(id);

    // Vì thiết kế ON DELETE CASCADE ở bảng Guest/Booking trỏ tới User,
    // nhưng đây là xóa trong bảng HOST. User gốc vẫn còn, chỉ mất quyền Host.
    const sql = `DELETE FROM host WHERE Host_ID = ?`;

    await this.databaseService.query(sql, [id]);

    return {
      message: `Host rights revoked for user ${id}. User account remains.`,
    };
  }

  // ======================================================
  // 6. TÍNH NĂNG PHỤ: GET TOP HOSTS (Superhosts)
  // ======================================================
  async findSuperHosts() {
    const sql = `
      SELECT h.*, u.Name 
      FROM host h
      JOIN user u ON h.Host_ID = u.User_ID
      WHERE h.Is_Superhost = 1
      ORDER BY h.Acceptance_Rate DESC;
    `;
    return await this.databaseService.query(sql);
  }
}

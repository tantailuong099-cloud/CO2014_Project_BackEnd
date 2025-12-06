import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { GetUsersDto } from './dto/get-users.dto';
import { CreateAdminUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AdministratorService {
  constructor(
    private readonly db: DatabaseService,
    private userService: UserService
  ) {}

  async findAll(query: GetUsersDto, adminId: string) {
    const { search, role, sortBy = 'Joined_Date', sortOrder = 'DESC' } = query;

    let sql = `
      SELECT 
        u.User_ID, u.Name, u.Email, u.Joined_Date, u.PhoneNumber,
        CASE 
          WHEN h.Host_ID IS NOT NULL THEN 'HOST' 
          ELSE 'GUEST' 
        END as Role
      FROM user u
      LEFT JOIN host h ON u.User_ID = h.Host_ID
      LEFT JOIN guest g ON u.User_ID = g.Guest_ID
      WHERE u.Admin_ID = ?
    `;

    const params: any[] = [adminId];

    // SEARCH
    if (search) {
      sql += ` AND (u.Name LIKE ? OR u.Email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role && role.toUpperCase() !== 'ALL') {
      const roleUpper = role.toUpperCase();

      if (roleUpper === 'HOST') {
        sql += ` AND h.Host_ID IS NOT NULL`;
      } else if (roleUpper === 'GUEST') {
        sql += ` AND h.Host_ID IS NULL`;
      }
    }

    // SORT
    const sortMapping = {
      name: 'u.Name',
      email: 'u.Email',
      joined_date: 'u.Joined_Date',
      role: 'Role',
    };

    const inputSort = (sortBy || 'joined_date').toString().toLowerCase();
    const dbColumn = sortMapping[inputSort] || 'u.Joined_Date';

    const inputOrder = (sortOrder || 'DESC').toString().trim().toUpperCase();
    const safeOrder = ['ASC', 'DESC'].includes(inputOrder)
      ? inputOrder
      : 'DESC';

    sql += ` ORDER BY ${dbColumn} ${safeOrder}, u.User_ID ${safeOrder}`;
    return this.db.query(sql, params);
  }

  async findOne(id: string, adminId: string) {
    const sql = `
      SELECT u.*, 
        CASE WHEN h.Host_ID IS NOT NULL THEN 'Host' ELSE 'Guest' END as Role,
        h.Listings_Count,  
        h.Listings_Count,
        h.Tax_ID,
        h.Response_Time,
        h.Acceptance_Rate,
        h.Is_Superhost,
        g.Bookings_Count, 
        g.Reviews_Count,
        g.Preferred_Payment,
        g.Travel_Interests
      FROM user u
      LEFT JOIN host h ON u.User_ID = h.Host_ID
      LEFT JOIN guest g ON u.User_ID = g.Guest_ID
      WHERE u.User_ID = ? AND u.Admin_ID = ?
    `;
    const rows = await this.db.query(sql, [id, adminId]);
    if (rows.length === 0) throw new NotFoundException('User not found');
    return rows[0];
  }

  async deleteUser(id: string, adminId: string) {
    const sql = `DELETE FROM user WHERE User_ID = ? AND Admin_ID = ?`;
    const result = await this.db.query(sql, [id, adminId]);

    if (result.affectedRows === 0) {
      throw new NotFoundException('User not found to delete');
    }
    return { message: 'User deleted successfully' };
  }

  async createUser(dto: CreateAdminUserDto, adminId: string) {
    const nextId = await this.userService.generateUserId(dto.role);

    // Hash password mặc định (vd: 123456)
    const salt = await bcrypt.genSalt();
    const defaultPassword = '123456';
    const hashPass = await bcrypt.hash(defaultPassword, salt);

    const sqlUser = `INSERT INTO user (User_ID, Name, Email, Password, Joined_Date, Admin_ID) VALUES (?, ?, ?, ?, CURDATE(), ?)`;

    const sqlRole =
      dto.role === 'HOST'
        ? `INSERT INTO host (Host_ID) VALUES (?)`
        : `INSERT INTO guest (Guest_ID) VALUES (?)`;

    try {
      await this.db.query(sqlUser, [
        nextId,
        dto.name,
        dto.email,
        hashPass,
        adminId,
      ]);
      await this.db.query(sqlRole, [nextId]);
      return {
        mmessage: 'User created successfully',
        user: {
          id: nextId,
          email: dto.email,
          role: dto.role,
          defaultPassword: defaultPassword,
        },
      };
    } catch (e) {
      throw new BadRequestException('Create failed: ' + e.message);
    }
  }

  async getStats(adminId: string) {
    const sql = `
      SELECT 
        (SELECT COUNT(*) FROM user WHERE Admin_ID = ?) as totalUsers,

        (SELECT COUNT(*) 
         FROM accommodation a
         JOIN post p ON a.Accommodation_ID = p.Accommodation_ID
         JOIN user u ON p.Host_ID = u.User_ID
         WHERE u.Admin_ID = ?) as totalListings,

        (SELECT COUNT(*) 
         FROM booking b
         JOIN user u ON b.Guest_ID = u.User_ID
         WHERE u.Admin_ID = ?) as totalBookings
    `;

    // Truyền adminId vào 3 vị trí dấu ?
    const result = await this.db.query(sql, [adminId, adminId, adminId]);
    return result[0];
  }

  async syncSystemData() {
    await this.db.query(`CALL sp_SyncSystemData('ALL', @msg)`);
    const result = await this.db.query(`SELECT @msg as message`);
    return result[0];
  }
}

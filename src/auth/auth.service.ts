import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  // private async generateUserId(role: string): Promise<string> {
  //   let prefix = '';

  //   const roleUpper = role.toUpperCase();

  //   if (roleUpper === 'HOST') prefix = 'HST-';
  //   else if (roleUpper === 'GUEST') prefix = 'GST-';
  //   else throw new BadRequestException('Role không hợp lệ');

  //   const sql = `
  //     SELECT User_ID
  //     FROM user
  //     WHERE User_ID LIKE '${prefix}%'
  //     ORDER BY CAST(SUBSTRING(User_ID, 5) AS UNSIGNED) DESC
  //     LIMIT 1
  //   `;

  //   const result = await this.db.query(sql);

  //   let nextNumber = 1;
  //   if (result.length > 0) {
  //     const currentId = result[0].User_ID;
  //     const currentNumber = parseInt(currentId.substring(4));
  //     nextNumber = currentNumber + 1;
  //   }

  //   const nextId = prefix + nextNumber.toString().padStart(6, '0');

  //   return nextId;
  // }

  async register(dto: RegisterDto) {
    const existingUser = await this.userService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email đã tồn tại');
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // gọi hàm tạo prefix user_id
    const userId = await this.userService.generateUserId(dto.role);

    const sqlFindAdmin = `SELECT Admin_ID FROM administrator ORDER BY RAND() LIMIT 1`;
    const adminResult = await this.db.query(sqlFindAdmin);
    const assignedAdminId =
      adminResult.length > 0 ? adminResult[0].Admin_ID : null;

    const sqlUser = `
      INSERT INTO user (
        User_ID, Name, BirthDate, Nationality, Email, Password, PhoneNumber, SSN, Bank_Account, Admin_ID
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Dùng Transaction để đảm bảo an toàn (nếu insert Guest lỗi thì rollback User)
    // Nhưng với DatabaseService của bạn chưa hỗ trợ transaction wrapper,
    // ta chạy query bình thường, chấp nhận rủi ro nhỏ (hoặc bạn tự viết START TRANSACTION)

    try {
      await this.db.query(sqlUser, [
        userId,
        dto.name,
        dto.birthDate || null,
        dto.nationality || null,
        dto.email,
        hashedPassword,
        dto.phoneNumber || null,
        dto.ssn || null,
        dto.bankAccount || null,
        assignedAdminId,
      ]);

      if (dto.role === 'HOST') {
        const sqlHost = `
        INSERT INTO host (Host_ID, Tax_ID) 
        VALUES (?, ?)
      `;
        await this.db.query(sqlHost, [userId, dto.taxId || null]);
      } else {
        const sqlGuest = `
        INSERT INTO guest (
            Guest_ID, Preferred_Payment, Travel_Interests, Bookings_Count, Reviews_Count
        ) VALUES (?, ?, ?, 0, 0)
      `;
        await this.db.query(sqlGuest, [
          userId,
          dto.preferredPayment || 'Cash',
          dto.travelInterests || null,
        ]);
      }

      return { message: 'Đăng ký thành công', userId, role: dto.role };
    } catch (error) {
      await this.db.query(`DELETE FROM user WHERE User_ID = ?`, [userId]);
      throw new BadRequestException('Đăng ký thất bại: ' + error.message);
    }
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email);
    if (user) {
      const isMatch = await bcrypt.compare(dto.password, user.Password);
      if (!isMatch) {
        throw new UnauthorizedException('Sai email hoặc mật khẩu');
      }

      const role = await this.userService.getUserRole(user.User_ID);

      const payload = {
        sub: user.User_ID,
        email: user.Email,
        role: role,
        name: user.Name,
      };
      const access_token = await this.jwtService.signAsync(payload);

      return {
        access_token,
        user: {
          id: user.User_ID,
          name: user.Name,
          email: user.Email,
          role: role,
        },
      };
    }

    const admins = await this.db.query(
      'SELECT * FROM administrator WHERE Email = ?',
      [dto.email]
    );

    if (admins.length > 0) {
      const admin = admins[0];

      // ⚠️ QUAN TRỌNG: Dữ liệu mẫu Admin của bạn là password thường (alice123)
      // Nên ta so sánh trực tiếp string (chỉ dành cho Admin trong bài tập này)
      if (admin.Password !== dto.password) {
        throw new UnauthorizedException('Sai mật khẩu Admin');
      }

      // Tạo Token cho Admin (Role cứng là 'Admin')
      const payload = {
        sub: admin.Admin_ID,
        email: admin.Email,
        role: 'ADMIN',
        name: admin.Name,
      };
      const access_token = await this.jwtService.signAsync(payload);

      return {
        access_token,
        user: {
          id: admin.Admin_ID,
          name: admin.Name,
          email: admin.Email,
          role: 'ADMIN',
        },
      };
    }

    throw new UnauthorizedException('Email không tồn tại trong hệ thống');
  }

  async logout() {
    return { message: 'Đăng xuất thành công' };
  }
}

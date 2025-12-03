import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly databaseService: DatabaseService) {}

  // ======================================================
  // 1. CREATE CONTACT
  // ======================================================
  async create(createContactDto: CreateContactDto) {
    const { guestId, hostId } = createContactDto;

    // Kiểm tra Guest và Host có tồn tại không (Optional, vì FK trong DB đã chặn rồi,
    // nhưng check ở đây để trả về lỗi rõ ràng hơn)

    const sql = `
      INSERT INTO contact (guestId, hostId)
      VALUES (?, ?);
    `;

    try {
      const result = await this.databaseService.query(sql, [guestId, hostId]);
      // Trả về contact vừa tạo
      return {
        Contact_ID: result.insertId, // MySQL trả về insertId
        guestId,
        hostId,
        message: 'Contact created successfully',
      };
    } catch (error) {
      // Bắt lỗi khóa ngoại (Foreign Key)
      if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        throw new BadRequestException('guestId or hostId does not exist.');
      }
      throw new BadRequestException(error.message);
    }
  }

  // ======================================================
  // 2. FIND ALL (Kèm thông tin chi tiết tên User)
  // ======================================================
  async findAll() {
    // Chúng ta cần JOIN với bảng User 2 lần:
    // Lần 1: u_guest cho thông tin người khách
    // Lần 2: u_host cho thông tin người chủ nhà
    const sql = `
      SELECT 
        c.Contact_ID,
        c.guestId, 
        u_guest.Name AS Guest_Name, 
        u_guest.Email AS Guest_Email,
        c.hostId, 
        u_host.Name AS Host_Name,
        u_host.Email AS Host_Email
      FROM contact c
      JOIN guest g ON c.guestId = g.guestId
      JOIN user u_guest ON g.guestId = u_guest.User_ID
      JOIN host h ON c.hostId = h.hostId
      JOIN user u_host ON h.hostId = u_host.User_ID;
    `;
    return await this.databaseService.query(sql);
  }

  // ======================================================
  // 3. FIND ONE
  // ======================================================
  async findOne(id: number) {
    const sql = `
      SELECT 
        c.Contact_ID,
        c.guestId, u_guest.Name AS Guest_Name, u_guest.PhoneNumber AS Guest_Phone,
        c.hostId, u_host.Name AS Host_Name, u_host.PhoneNumber AS Host_Phone
      FROM contact c
      JOIN user u_guest ON c.guestId = u_guest.User_ID
      JOIN user u_host ON c.hostId = u_host.User_ID
      WHERE c.Contact_ID = ?;
    `;

    const results = await this.databaseService.query(sql, [id]);

    if (!results || results.length === 0) {
      throw new NotFoundException(`Contact with ID ${id} not found`);
    }

    return results[0];
  }

  // ======================================================
  // 4. FIND BY GUEST (Lấy danh sách contact của 1 khách)
  // ======================================================
  async findByGuest(guestId: string) {
    const sql = `
      SELECT c.Contact_ID, c.hostId, u.Name AS Host_Name, u.Email AS Host_Email
      FROM contact c
      JOIN user u ON c.hostId = u.User_ID
      WHERE c.guestId = ?;
    `;
    return await this.databaseService.query(sql, [guestId]);
  }

  // ======================================================
  // 5. UPDATE
  // ======================================================
  async update(id: number, updateContactDto: UpdateContactDto) {
    // Kiểm tra tồn tại
    await this.findOne(id);

    const { guestId, hostId } = updateContactDto;

    const sql = `
      UPDATE contact 
      SET 
        guestId = COALESCE(?, guestId),
        hostId = COALESCE(?, hostId)
      WHERE Contact_ID = ?;
    `;

    try {
      await this.databaseService.query(sql, [guestId, hostId, id]);
      return this.findOne(id);
    } catch (error) {
      throw new BadRequestException('Update failed: ' + error.message);
    }
  }

  // ======================================================
  // 6. REMOVE
  // ======================================================
  async remove(id: number) {
    const checkSql = `SELECT Contact_ID FROM contact WHERE Contact_ID = ?`;
    const check = await this.databaseService.query(checkSql, [id]);

    if (check.length === 0) {
      throw new NotFoundException(`Contact ID ${id} not found`);
    }

    const sql = `DELETE FROM contact WHERE Contact_ID = ?`;
    await this.databaseService.query(sql, [id]);

    return { message: `Contact #${id} deleted successfully` };
  }
}

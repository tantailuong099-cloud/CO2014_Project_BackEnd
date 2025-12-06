// import { Injectable } from '@nestjs/common';
// import { DatabaseService } from 'src/database/database.service';

// @Injectable()
// export class UserService {
//   constructor(private readonly databaseService: DatabaseService) {}

//   async getAllUsers() {
//     return this.databaseService.query(`SELECT * FROM cancellation`);
//   }

//   async testfunction(id: string) {
//     return this.databaseService.callFunction('fn_CalculateAnnualRevenue', [id]);
//   }

//   async testprocedure() {
//     return this.databaseService.callProcedure('sp_RecalculateAllCounts');
//   }
// }

import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { UpdateUserProfileDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private db: DatabaseService) {}

  async findByEmail(email: string): Promise<any> {
    const users = await this.db.query(`SELECT * FROM user WHERE Email = ?`, [
      email,
    ]);
    return users[0];
  }

  async getUserRole(userId: string): Promise<string> {
    const hosts = await this.db.query(
      `SELECT Host_ID FROM host WHERE Host_ID = ?`,
      [userId]
    );
    if (hosts.length > 0) return 'HOST';
    return 'GUEST';
  }

  async getProfile(userId: string) {
    const userQuery = `SELECT * FROM user WHERE User_ID = ?`;
    const users = await this.db.query(userQuery, [userId]);

    if (users.length === 0) return null;
    const user = users[0];

    delete user.Password;

    const hostQuery = `SELECT * FROM host WHERE Host_ID = ?`;
    const hosts = await this.db.query(hostQuery, [userId]);

    if (hosts.length > 0) {
      return { ...user, role: 'HOST', hostDetails: hosts[0] };
    } else {
      const guestQuery = `SELECT * FROM guest WHERE Guest_ID = ?`;
      const guests = await this.db.query(guestQuery, [userId]);
      return { ...user, role: 'GUEST', guestDetails: guests[0] || {} };
    }
  }

  async generateUserId(role: string): Promise<string> {
    let prefix = '';

    const roleUpper = role.toUpperCase();

    if (roleUpper === 'HOST') prefix = 'HST-';
    else if (roleUpper === 'GUEST') prefix = 'GST-';
    else throw new BadRequestException('Role không hợp lệ');

    const sql = `
        SELECT User_ID 
        FROM user 
        WHERE User_ID LIKE '${prefix}%'
        ORDER BY CAST(SUBSTRING(User_ID, 5) AS UNSIGNED) DESC
        LIMIT 1
      `;

    const result = await this.db.query(sql);

    let nextNumber = 1;
    if (result.length > 0) {
      const currentId = result[0].User_ID;
      const currentNumber = parseInt(currentId.substring(4));
      nextNumber = currentNumber + 1;
    }

    const nextId = prefix + nextNumber.toString().padStart(6, '0');

    return nextId;
  }

  async updateProfile(userId: string, dto: UpdateUserProfileDto) {
    const sql = `
      UPDATE user 
      SET 
        Name = COALESCE(?, Name),
        PhoneNumber = COALESCE(?, PhoneNumber),
        BirthDate = COALESCE(?, BirthDate),
        Nationality = COALESCE(?, Nationality),
        SSN = COALESCE(?, SSN),
        Bank_Account = COALESCE(?, Bank_Account)
      WHERE User_ID = ?
    `;

    try {
      await this.db.query(sql, [
        dto.name || null,
        dto.phoneNumber || null,
        dto.birthDate || null,
        dto.nationality || null,
        dto.ssn || null,
        dto.bankAccount || null,
        userId,
      ]);

      const role = await this.getUserRole(userId);

      if (role === 'HOST') {
        const sqlHost = `
            UPDATE host 
            SET 
                Tax_ID = COALESCE(?, Tax_ID),
                Response_Time = COALESCE(?, Response_Time)
            WHERE Host_ID = ?
        `;
        await this.db.query(sqlHost, [
          dto.taxId || null,
          dto.responseTime || null,
          userId,
        ]);
      } else {
        const sqlGuest = `
            UPDATE guest 
            SET 
                Preferred_Payment = COALESCE(?, Preferred_Payment),
                Travel_Interests = COALESCE(?, Travel_Interests)
            WHERE Guest_ID = ?
        `;
        await this.db.query(sqlGuest, [
          dto.preferredPayment || null,
          dto.travelInterests || null,
          userId,
        ]);
      }
      return this.getProfile(userId);
    } catch (error) {
      throw new Error('Update failed: ' + error.message);
    }
  }
}

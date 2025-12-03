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

import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

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
}

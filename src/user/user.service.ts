import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class UserService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getAllUsers() {
    return this.databaseService.query(`SELECT * FROM cancellation`);
  }

  async testfunction(id: string) {
    return this.databaseService.callFunction('fn_CalculateAnnualRevenue', [id]);
  }

  async testprocedure() {
    return this.databaseService.callProcedure('sp_RecalculateAllCounts');
  }
}

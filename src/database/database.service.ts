// CO2014_Project_BackEnd\src\database\database.service.ts

import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
  constructor(private dataSource: DataSource) {}

  // Query SQL trực tiếp
  async query(sql: string, params?: any[]) {
    return await this.dataSource.query(sql, params);
  }

  // Gọi stored procedure
  async callProcedure(name: string, params: any[] = []) {
    const placeholders = params.map(() => '?').join(',');
    const sql = `CALL ${name}(${placeholders});`;
    return await this.dataSource.query(sql, params);
  }

  async callFunction(name: string, params: any[] = []) {
    const placeholders = params.map(() => '?').join(',');
    const sql = `SELECT ${name}(${placeholders}) AS result;`;
    const result: any[] = await this.dataSource.query(sql, params);
    return result[0].result;
  }
}

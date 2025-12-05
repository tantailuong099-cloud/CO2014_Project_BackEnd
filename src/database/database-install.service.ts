// CO2014_Project_BackEnd\src\database\database-install.service.ts

import { Injectable } from '@nestjs/common';
import { DatabaseService } from './database.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseInstallService {
  constructor(private db: DatabaseService) {}

  // async runSQLFile(fileName: string) {
  //   const fullPath = path.join(process.cwd(), 'src/database/scripts', fileName);
  //   const sql = fs.readFileSync(fullPath, 'utf8');
  //   return this.db.query(sql);
  // }

  // async runSQLFile(fileName: string) {
  //   const fullPath = path.join(process.cwd(), 'src/database/scripts', fileName);
  //   const sql = fs.readFileSync(fullPath, 'utf8');

  //   // Tách từng câu SQL theo dấu ;
  //   const statements = sql
  //     .split(/;\s*$/m)
  //     .map((s) => s.trim())
  //     .filter((s) => s.length > 0);

  //   for (const stmt of statements) {
  //     await this.db.query(stmt);
  //   }

  //   console.log(`✔ Executed SQL file: ${fileName}`);
  // }

  // async runSQLFile(fileName: string) {
  //   const fullPath = path.join(process.cwd(), 'src/database/scripts', fileName);
  //   let sql = fs.readFileSync(fullPath, 'utf8');

  //   // Loại bỏ các dòng DELIMITER
  //   sql = sql.replace(/DELIMITER\s+\S+/g, '');

  //   // Muốn chạy như 1 lệnh duy nhất → không split
  //   await this.db.query(sql);

  //   console.log(`✔ Executed SQL file: ${fileName}`);
  // }
  // async runSQLFile(fileName: string) {
  //   const fullPath = path.join(process.cwd(), 'src/database/scripts', fileName);
  //   let sql = fs.readFileSync(fullPath, 'utf8');

  //   // Remove DELIMITER lines
  //   sql = sql.replace(/DELIMITER\s+.+/g, '');

  //   // Split multiple CREATE PROCEDURE/FUNCTION/TRIGGER
  //   const blocks = sql
  //     .split(/END\s*;/i)
  //     .map((block) => block.trim())
  //     .filter((block) => block.length > 0);

  //   for (let block of blocks) {
  //     block = block + ' END;'; // add END back

  //     console.log('\nRunning SQL Block:\n', block.slice(0, 100), '...');

  //     await this.db.query(block);
  //   }

  //   console.log(`✔ Executed SQL file: ${fileName}`);
  // }
  // async runSQLFile(fileName: string) {
  //   const fullPath = path.join(process.cwd(), 'src/database/scripts', fileName);
  //   let sql = fs.readFileSync(fullPath, 'utf8');

  //   // Loại bỏ DELIMITER nếu có
  //   sql = sql.replace(/DELIMITER\s+.+/g, '');

  //   // Tách câu lệnh theo dấu ;
  //   // Nhưng vẫn giữ các câu LOAD DATA INFILE (vì chúng không chứa dấu ;)
  //   const statements = sql
  //     .split(/;\s*\n/) // split theo dấu ; cuối dòng
  //     .map((stmt) => stmt.trim())
  //     .filter((stmt) => stmt.length > 0);

  //   for (const stmt of statements) {
  //     console.log('\nRunning SQL Statement:\n', stmt.slice(0, 120), '...');

  //     try {
  //       await this.db.query(stmt);
  //     } catch (err) {
  //       console.error('\n❌ SQL ERROR in statement:\n', stmt);
  //       throw err;
  //     }
  //   }

  //   console.log(`✔ Executed SQL file: ${fileName}`);
  // }
  async runSQLFile(fileName: string) {
    const fullPath = path.join(process.cwd(), 'src/database/scripts', fileName);
    let sql = fs.readFileSync(fullPath, 'utf8');

    // remove DELIMITER commands
    sql = sql.replace(/DELIMITER\s+.*\n/g, '');

    const statements: string[] = [];
    let buffer = '';
    let inProcedure = false;

    for (const line of sql.split('\n')) {
      const trimmed = line.trim();

      // detect start of stored procedure/function/trigger/event
      if (/^CREATE\s+(PROCEDURE|FUNCTION|TRIGGER|EVENT)/i.test(trimmed)) {
        inProcedure = true;
      }

      buffer += line + '\n';

      // detect end of BEGIN ... END;
      if (inProcedure && trimmed === 'END;') {
        statements.push(buffer.trim());
        buffer = '';
        inProcedure = false;
        continue;
      }

      // normal SQL ending with semicolon
      if (!inProcedure && trimmed.endsWith(';')) {
        statements.push(buffer.trim());
        buffer = '';
      }
    }

    // execute all collected statements
    for (const stmt of statements) {
      console.log('\n▶ Running SQL:\n', stmt.slice(0, 150), '...\n');
      try {
        await this.db.query(stmt);
      } catch (err) {
        console.error('\n❌ ERROR in SQL:\n', stmt, '\n');
        throw err;
      }
    }

    console.log(`✔ Executed SQL file: ${fileName}`);
  }
}

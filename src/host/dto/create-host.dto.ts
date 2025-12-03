export class CreateHostDto {
  Host_ID: string; // Phải trùng với User_ID đã có trong bảng user
  Tax_ID?: string;
  Response_Time?: string; // 'within an hour', 'within a day', ...
  Acceptance_Rate?: number;
  Is_Superhost?: boolean;
}

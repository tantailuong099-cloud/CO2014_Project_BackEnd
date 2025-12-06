import { IsEmail, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateAdminUserDto {
  @IsNotEmpty({ message: 'Tên không được để trống' })
  name: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsEnum(['GUEST', 'HOST'], { message: 'Role phải là GUEST hoặc HOST' })
  role: 'GUEST' | 'HOST';
}
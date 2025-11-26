export class RegisterDto {
    email: string;
    password: string;
    name: string;
    phoneNumber: string;
    birthDate: string; // YYYY-MM-DD
    role: 'Guest' | 'Host'; // Để biết insert vào bảng nào
}
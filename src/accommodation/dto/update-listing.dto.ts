export class UpdateListingDto {
    title?: string;
    description?: string;
    pricePerNight?: number;
    status?: 'Active' | 'Inactive'; // Cần thêm cột này trong DB hoặc xử lý logic ẩn
    amenities?: string;
}
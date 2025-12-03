export class CreateListingDto {
    hostId: string;

    // Phần Location
    address: string;
    city: string;

    // Phần Accommodation
    title: string;
    description: string;
    typeId: string; // Frontend phải gửi ID của loại nhà (VD: Apartment, Villa)
    pricePerNight: number;
    maxGuests: number;
    numBeds: number;
    numBedrooms: number;
    numBathrooms: number;
    amenities: string; // Chuỗi JSON hoặc CSV
    imageUrl: string;
}
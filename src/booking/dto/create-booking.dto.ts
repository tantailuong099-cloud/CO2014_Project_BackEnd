export class CreateBookingDto {
    guestId: string;
    accommodationId: string;
    checkIn: string;  // Format: YYYY-MM-DD
    checkOut: string; // Format: YYYY-MM-DD
    numGuests: number;
}
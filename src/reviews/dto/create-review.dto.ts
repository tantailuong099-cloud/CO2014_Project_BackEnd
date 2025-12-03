export class CreateReviewDto {
    guestId: string;
    accommodationId: string;
    rating: number; // 1-5
    comment: string;
}
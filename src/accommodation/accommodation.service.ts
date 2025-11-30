import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accommodation } from '../database/entities/accommodation.entity';

@Injectable()
export class AccommodationService {
  constructor(
    @InjectRepository(Accommodation)
    private accommodationRepository: Repository<Accommodation>,
  ) {}

  // 1. GET ALL (SEARCH + FILTER)
  async findAll(keyword?: string, guests?: number, checkIn?: string, checkOut?: string) {
    // Khởi tạo QueryBuilder
    // 'acc' là alias cho bảng accommodation
    const query = this.accommodationRepository.createQueryBuilder('acc')
      .leftJoinAndSelect('acc.location', 'loc') // Join bảng Location
      .leftJoinAndSelect('acc.reviews', 'reviews') // Join bảng Reviews
      .take(100); // Limit kết quả

    // --- LOGIC 1: TÌM KIẾM KEYWORD (Title hoặc City) ---
    if (keyword && keyword.trim() !== '') {
      query.andWhere(
        '(acc.Title LIKE :keyword OR loc.City LIKE :keyword)', 
        { keyword: `%${keyword}%` }
      );
    }

    // --- LOGIC 2: SỐ LƯỢNG KHÁCH ---
    // Dựa vào cột Max_Guests trong entity bạn gửi
    if (guests && guests > 1) {
      query.andWhere('acc.maxGuests >= :guests', { guests });
    }

    // --- LOGIC 3: LỌC THEO NGÀY (Nâng cao) ---
    // Logic: Tìm những phòng KHÔNG có booking nào trùng với khoảng ngày khách chọn
    if (checkIn && checkOut) {
      // Lưu ý: Phần này yêu cầu bạn phải có Entity Booking chuẩn.
      // Nếu chưa chạy được phần Date, bạn có thể comment đoạn này lại.
      query.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('booking.accommodationId')
          .from('Booking', 'booking') // Tên bảng Booking trong DB
          .where('booking.accommodationId = acc.accommodationId')
          .andWhere('(booking.checkIn < :checkOut AND booking.checkOut > :checkIn)')
          .getQuery();
        return `NOT EXISTS ${subQuery}`;
      }, { checkIn, checkOut });
    }

    const items = await query.getMany();
    return items.map((item) => this.mapAccommodationData(item));
  }

  // 2. GET DETAIL (Giữ nguyên logic cũ của bạn)
  async findOne(id: string) {
    const item = await this.accommodationRepository.findOne({
      where: { accommodationId: id },
      relations: [
        'location',
        'type',
        'reviews',
        'reviews.guest',
        'reviews.guest.user',
        'posts',
        'posts.host',
        'posts.host.user',
      ],
      order: {
        reviews: { reviewDate: 'DESC' }, 
      },
    });

    if (!item) throw new NotFoundException(`Không tìm thấy nhà ID: ${id}`);

    return this.mapAccommodationData(item);
  }

  // --- MAP DATA HELPER ---
  private mapAccommodationData(item: Accommodation) {
    // Tính Rating
    let avgRating: string | number = 'New';
    if (item.reviews && item.reviews.length > 0) {
      const total = item.reviews.reduce((sum, r) => sum + r.Ratings, 0);
      avgRating = (total / item.reviews.length).toFixed(1);
    }

    // Lấy Host info
    const post = item.posts && item.posts.length > 0 ? item.posts[0] : null;
    const hostUser = post?.host?.user;

    // Xử lý Amenities
    let amenitiesArray: string[] = []; 
    try {
      if (item.Amenities) {
        const parsed = JSON.parse(item.Amenities);
        amenitiesArray = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      amenitiesArray = item.Amenities ? item.Amenities.split(',') : [];
    }

    return {
      ...item,
      rating: avgRating,
      reviewCount: item.totalReviews,
      image: '/image/ACC_001.jpg', // Placeholder image
      amenitiesArray: amenitiesArray,

      hostData: {
        name: hostUser?.Name || 'Chủ nhà',
        joinedDate: hostUser?.joinedDate,
        isSuperhost: post?.host?.isSuperhost || false,
        responseRate: post?.host?.responseTime || 'Vài giờ',
      },

      reviewsList: item.reviews?.map((r) => ({
        id: r.reviewId, 
        date: r.reviewDate, 
        comment: r.Comments,
        rating: r.Ratings,
        guestName: r.guest?.user?.Name || 'Người dùng ẩn danh',
      })),
    };
  }
}
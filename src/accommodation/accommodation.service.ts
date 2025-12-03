import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { SearchAccommodationDto } from './dto/search-accommodation.dto';

@Injectable()
export class AccommodationService {
  constructor(
    @InjectRepository(Accommodation)
    private accommodationRepository: Repository<Accommodation>,
  ) {}

  // --- 1. GET ALL (FULL FILTER) ---
  async findAll(keyword?: string, guests?: number, checkIn?: string, checkOut?: string) {
    const query = this.accommodationRepository.createQueryBuilder('acc')
      .leftJoinAndSelect('acc.location', 'loc')
      .leftJoinAndSelect('acc.reviews', 'reviews')
      
      // JOIN ĐỂ LẤY TYPE & SUBTYPE
      .leftJoinAndSelect('acc.type', 'type')          // Lấy loại hình hiện tại
      .leftJoinAndSelect('type.parent', 'parentType') // Lấy loại hình cha (nếu có)
      
      .take(100); // Giới hạn lấy 100 kết quả

    // A. TÌM KIẾM KEYWORD
    if (keyword && keyword.trim() !== '') {
      query.andWhere(
        '(acc.Title LIKE :keyword OR loc.City LIKE :keyword)', 
        { keyword: `%${keyword}%` }
      );
    }

    // B. LỌC SỐ LƯỢNG KHÁCH (Dùng cột Max_Guests từ entity)
    if (guests && guests > 1) {
      query.andWhere('acc.maxGuests >= :guests', { guests });
    }

    // C. LỌC NGÀY TRỐNG (CHECK-IN/CHECK-OUT)
    // Logic: Loại bỏ những phòng có Booking trùng với khoảng ngày khách chọn
    if (checkIn && checkOut) {
      // *LƯU Ý*: Đảm bảo bạn đã có Entity Booking trong code
      query.andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('booking.accommodationId')
          .from('Booking', 'booking') // Tên bảng Booking trong DB
          .where('booking.accommodationId = acc.accommodationId')
          // Logic trùng lịch: (StartA < EndB) AND (EndA > StartB)
          .andWhere('(booking.checkIn < :checkOut AND booking.checkOut > :checkIn)')
          .getQuery();
        return `NOT EXISTS ${subQuery}`;
      }, { checkIn, checkOut });
    }

    const items = await query.getMany();
    return items.map((item) => this.mapAccommodationData(item));
  }

  // --- 2. GET DETAIL ---
  async findOne(id: string) {
    const item = await this.accommodationRepository.findOne({
      where: { accommodationId: id },
      relations: [
        'location',
        'type',
        'type.parent', // Lấy thêm parent để hiện đúng subtype chi tiết
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

  // --- 3. HÀM MAP DỮ LIỆU ---
  private mapAccommodationData(item: Accommodation) {
    // Tính Rating
    let avgRating: string | number = 'New';
    if (item.reviews && item.reviews.length > 0) {
      const total = item.reviews.reduce((sum, r) => sum + r.Ratings, 0);
      avgRating = (total / item.reviews.length).toFixed(1);
    }

    // Lấy Host
    const post = item.posts && item.posts.length > 0 ? item.posts[0] : null;
    const hostUser = post?.host?.user;

    // Amenities
    let amenitiesArray: string[] = []; 
    try {
      if (item.Amenities) {
        const parsed = JSON.parse(item.Amenities);
        amenitiesArray = Array.isArray(parsed) ? parsed : [];
      }
    } catch (e) {
      amenitiesArray = item.Amenities ? item.Amenities.split(',') : [];
    }

    // LOGIC TYPE & SUBTYPE
    // Nếu type hiện tại có parent -> Parent là Loại chính (vd: Nhà), Type hiện tại là Loại phụ (vd: Nhà trên cây)
    // Nếu không có parent -> Type hiện tại là Loại chính
    const mainType = item.type?.parent ? item.type.parent.typeName : (item.type?.typeName || 'Nhà ở');
    const subType = item.type?.parent ? item.type.typeName : '';

    return {
      ...item,
      rating: avgRating,
      reviewCount: item.totalReviews,
      image: '/image/ACC_001.jpg', // Ảnh mặc định
      amenitiesArray: amenitiesArray,
      
      // Type trả về frontend
      typeName: mainType, 
      subTypeName: subType, 

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
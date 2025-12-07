import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common'; // import { DatabaseService } from 'src/database/database.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto } from './dto/update-listing.dto';
import { DatabaseService } from 'src/database/database.service';

// import { SearchAccommodationDto } from './dto/search-accommodation.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Accommodation } from '../database/entities/accommodation.entity';

@Injectable()
export class AccommodationService {
  constructor(
    @InjectRepository(Accommodation)
    private accommodationRepository: Repository<Accommodation>,
    private readonly db: DatabaseService
  ) {}

  // --- 1. GET ALL (FULL FILTER) ---
  async findAll(
    keyword?: string,
    guests?: number,
    checkIn?: string,
    checkOut?: string
  ) {
    const query = this.accommodationRepository
      .createQueryBuilder('acc')
      .leftJoinAndSelect('acc.location', 'loc')
      .leftJoinAndSelect('acc.reviews', 'reviews')

      // JOIN ĐỂ LẤY TYPE & SUBTYPE
      .leftJoinAndSelect('acc.type', 'type') // Lấy loại hình hiện tại
      .leftJoinAndSelect('type.parent', 'parentType') // Lấy loại hình cha (nếu có)

      .take(100); // Giới hạn lấy 100 kết quả

    // A. TÌM KIẾM KEYWORD
    if (keyword && keyword.trim() !== '') {
      query.andWhere('(acc.Title LIKE :keyword OR loc.City LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    // B. LỌC SỐ LƯỢNG KHÁCH (Dùng cột Max_Guests từ entity)
    if (guests && guests > 1) {
      query.andWhere('acc.maxGuests >= :guests', { guests });
    }

    // C. LỌC NGÀY TRỐNG (CHECK-IN/CHECK-OUT)
    // Logic: Loại bỏ những phòng có Booking trùng với khoảng ngày khách chọn
    if (checkIn && checkOut) {
      // *LƯU Ý*: Đảm bảo bạn đã có Entity Booking trong code
      query.andWhere(
        (qb) => {
          const subQuery = qb
            .subQuery()
            .select('booking.accommodationId')
            .from('Booking', 'booking') // Tên bảng Booking trong DB
            .where('booking.accommodationId = acc.accommodationId')
            // Logic trùng lịch: (StartA < EndB) AND (EndA > StartB)
            .andWhere(
              '(booking.checkIn < :checkOut AND booking.checkOut > :checkIn)'
            )
            .getQuery();
          return `NOT EXISTS ${subQuery}`;
        },
        { checkIn, checkOut }
      );
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
    const mainType = item.type?.parent
      ? item.type.parent.typeName
      : item.type?.typeName || 'Nhà ở';
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

  private async generateId(
    prefix: string,
    tableName: string,
    columnName: string
  ): Promise<string> {
    // Logic: Tìm ID lớn nhất hiện tại (ví dụ ACC-000005), cắt lấy số 5, cộng 1 -> 6 -> ACC-000006
    // SUBSTRING(..., 5) vì Prefix 'ACC-' hay 'LOC-' đều dài 4 ký tự, số bắt đầu từ ký tự thứ 5
    const sql = `
        SELECT ${columnName} as id
        FROM ${tableName} 
        WHERE ${columnName} LIKE '${prefix}%'
        ORDER BY CAST(SUBSTRING(${columnName}, 5) AS UNSIGNED) DESC
        LIMIT 1
    `;

    const result = await this.db.query(sql);

    let nextNumber = 1;
    if (result.length > 0) {
      const currentId = result[0].id;
      // Cắt từ vị trí thứ 4 (index 4 trong JS = ký tự thứ 5 trong chuỗi)
      const currentNumber = parseInt(currentId.substring(4));
      nextNumber = currentNumber + 1;
    }

    // Pad thêm số 0 cho đủ 6 chữ số
    const nextId = prefix + nextNumber.toString().padStart(5, '0');
    return nextId;
  }

  LISTING_IMAGES = [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', // Căn hộ
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80', // Nhà phố
    'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80', // Biệt thự
    'https://images.unsplash.com/photo-1600596542815-2a4d9f0152ba?w=800&q=80', // Villa
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80', // Cottage
  ];

  async getHostListings(hostId: string) {
    const sql = `
      SELECT 
        a.Accommodation_ID as id, 
        a.Title as title, 
        a.Price_Per_Night as price,
        a.Total_Reviews as views,
        l.City as city
      FROM accommodation a
      JOIN post p ON a.Accommodation_ID = p.Accommodation_ID
      JOIN location l ON a.Location_ID = l.Location_ID
      WHERE p.Host_ID = ?
      ORDER BY p.Post_Date DESC
    `;

    const results = await this.db.query(sql, [hostId]);

    // Xử lý gán ảnh dựa trên ID (để ID nào thì ảnh đó, không bị đổi khi F5)
    return results.map((item: any) => {
      // Thuật toán đơn giản: Cộng tổng mã ASCII của các ký tự trong ID để ra 1 số
      let idSum = 0;
      if (item.id) {
        for (let i = 0; i < item.id.length; i++) {
          idSum += item.id.charCodeAt(i);
        }
      }
      // Lấy phần dư để chọn index trong mảng ảnh
      const imgIndex = idSum % this.LISTING_IMAGES.length;

      return {
        ...item,
        imageUrl: this.LISTING_IMAGES[imgIndex], // Ảnh cố định theo ID
      };
    });
  }

  // --- 2. GET DETAIL FOR EDIT ---
  async findOneForEdit(accId: string, hostId: string) {
    const sql = `
      SELECT a.*, l.City
      FROM accommodation a
      JOIN post p ON a.Accommodation_ID = p.Accommodation_ID
      JOIN location l ON a.Location_ID = l.Location_ID
      WHERE a.Accommodation_ID = ? AND p.Host_ID = ?
    `;
    const res = await this.db.query(sql, [accId, hostId]);
    if (res.length === 0) throw new NotFoundException('Not found');

    const item = res[0];
    try {
      item.Amenities = JSON.parse(item.Amenities);
    } catch {
      item.Amenities = [];
    }
    return item;
  }

  // --- 3. CREATE LISTING (TRANSACTION) ---
  async createListing(hostId: string, dto: CreateListingDto) {
    const accId = await this.generateId(
      'ACC-',
      'accommodation',
      'Accommodation_ID'
    );
    const locId = await this.generateId('LOC-', 'location', 'Location_ID');

    const amenitiesStr = JSON.stringify(dto.amenities);
    const price = Number(dto.pricePerNight);
    const guests = Number(dto.maxGuests);

    const randLat = (Math.random() * 180 - 90).toFixed(6);
    const randLong = (Math.random() * 360 - 180).toFixed(6);

    // Check Type ID
    const typeCheck = await this.db.query(
      `SELECT Type_ID FROM accommodation_type WHERE Type_ID = ?`,
      [dto.typeId]
    );
    if (typeCheck.length === 0)
      throw new BadRequestException(`Loại nhà không tồn tại.`);

    await this.db.query('START TRANSACTION');

    try {
      // 1. Insert Location
      // Chỉ lưu chuỗi "City, State" vào cột City.
      // Cột Address nếu lỡ tạo rồi thì kệ nó (nó sẽ NULL), hoặc bạn xóa khỏi câu SQL này.
      await this.db.query(
        `INSERT INTO location (Location_ID, City, Latitude, Longitude) VALUES (?, ?, ?, ?)`,
        [locId, dto.city, randLat, randLong]
      );

      // 2. Insert Accommodation
      // Description giữ nguyên, không cần nối địa chỉ vào nữa
      await this.db.query(
        `INSERT INTO accommodation (
            Accommodation_ID, Title, Description, Location_ID, Type_ID, 
            Max_Guests, Price_Per_Night, Amenities, Total_Reviews, Annual_Revenue_Estimated,
            Num_Beds, Num_Bedrooms, Num_Bathrooms 
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?)`,
        [
          accId,
          dto.title,
          dto.description,
          locId,
          dto.typeId,
          dto.maxGuests,
          dto.pricePerNight,
          amenitiesStr,
          dto.numBeds || 0,
          dto.numBedrooms || 0,
          dto.numBathrooms || 0,
        ]
      );

      await this.db.query(
        `INSERT INTO post (Accommodation_ID, Host_ID, Post_Date) VALUES (?, ?, CURDATE())`,
        [accId, hostId]
      );

      await this.db.query('COMMIT');
      return { message: 'Created successfully', id: accId };
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw new InternalServerErrorException('Lỗi tạo nhà: ' + error.message);
    }
  }

  // --- 4. UPDATE LISTING ---
  async updateListing(accId: string, hostId: string, dto: UpdateListingDto) {
    await this.findOneForEdit(accId, hostId);
    const amenitiesStr = JSON.stringify(dto.amenities);
    await this.db.query('START TRANSACTION');
    try {
      await this.db.query(
        `UPDATE accommodation SET 
            Title = ?, Description = ?, Price_Per_Night = ?, Max_Guests = ?, Amenities = ?,
            Num_Beds = ?, Num_Bedrooms = ?, Num_Bathrooms = ?, Type_ID = ?  
         WHERE Accommodation_ID = ?`,
        [
          dto.title,
          dto.description,
          Number(dto.pricePerNight),
          Number(dto.maxGuests),
          amenitiesStr,
          Number(dto.numBeds || 0),
          Number(dto.numBedrooms || 0),
          Number(dto.numBathrooms || 0),
          dto.typeId,
          accId,
        ]
      );

      // Update Location
      const locRes = await this.db.query(
        `SELECT Location_ID FROM accommodation WHERE Accommodation_ID = ?`,
        [accId]
      );

      if (locRes.length > 0) {
        const locId = locRes[0].Location_ID;
        await this.db.query(
          `UPDATE location SET City = ? WHERE Location_ID = ?`,
          [dto.city, locId]
        );
      }

      await this.db.query('COMMIT');
      return { message: 'Updated successfully' };
    } catch (error) {
      await this.db.query('ROLLBACK');
      throw error;
    }
  }

  // --- 5. DELETE LISTING ---
  async deleteListing(accId: string, hostId: string) {
    await this.findOneForEdit(accId, hostId);

    // Xóa Accommodation -> Cascade Delete trong DB sẽ xóa Post
    // Trigger trg_post_after_delete sẽ tự chạy để -1 Listings_Count
    await this.db.query(
      `DELETE FROM accommodation WHERE Accommodation_ID = ?`,
      [accId]
    );

    return { message: 'Deleted successfully' };
  }

  async getAccommodationTypes() {
    // Chỉ lấy các loại con (Subtypes) để user chọn (VD: A01, A02...)
    // Loại cha (A, B) thường chỉ để gom nhóm
    const sql = `
      SELECT Type_ID, Type_Name, Base_Price 
      FROM accommodation_type 
      WHERE Parent_Type_ID != 'ROOT' OR Parent_Type_ID IS NOT NULL
      ORDER BY Type_ID ASC
    `;
    return this.db.query(sql);
  }
}

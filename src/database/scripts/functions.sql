-- ===========================================================
-- Function 1: Calculate Annual Revenue ( for the previous year (2024))
-- ===========================================================
DROP FUNCTION IF EXISTS fn_CalculateAnnualRevenue;


CREATE FUNCTION fn_CalculateAnnualRevenue(p_AccommodationID VARCHAR(10))
RETURNS DECIMAL(12,2)
DETERMINISTIC
BEGIN
    DECLARE v_TotalRevenue DECIMAL(12,2) DEFAULT 0;

    -- Tính tổng tiền các booking:
    -- 1. Của Accommodation đó
    -- 2. Trạng thái là 'Confirmed' hoặc 'Completed'
    -- 3. Ngày Check-out nằm trong NĂM TRƯỚC ĐÓ (Năm hiện tại - 1)
    SELECT SUM(Total_Price)
    INTO v_TotalRevenue
    FROM booking
    WHERE Accommodation_ID = p_AccommodationID
      AND Status IN ('Confirmed', 'Completed') 
      -- Lệnh này sẽ lấy toàn bộ booking có check-out trong năm 2024
      AND YEAR(Check_out) = YEAR(CURDATE()) - 1; 

    -- Nếu không có doanh thu năm ngoái thì trả về 0
    IF v_TotalRevenue IS NULL THEN
        SET v_TotalRevenue = 0;
    END IF;

    RETURN v_TotalRevenue;
END;



-- ===========================================================
-- Function 2: Calculate average rating of a accommodation
-- ===========================================================
DROP FUNCTION IF EXISTS fn_get_average_rating;


CREATE FUNCTION fn_get_average_rating(p_accommodation_id VARCHAR(10))
RETURNS DECIMAL(4,2)
DETERMINISTIC
BEGIN
    DECLARE v_avg_rating DECIMAL(4,2) DEFAULT 0.00;
    DECLARE v_exists INT DEFAULT 0;

    -- Kiểm tra accommodation có tồn tại không
    SELECT COUNT(*) INTO v_exists
    FROM accommodation
    WHERE Accommodation_ID = p_accommodation_id;

    IF v_exists = 0 THEN
        RETURN -1;
    END IF;

    -- Tính trung bình
    SELECT ROUND(AVG(Ratings), 2)
    INTO v_avg_rating
    FROM reviews
    WHERE Accommodation_ID = p_accommodation_id;

    IF v_avg_rating IS NULL THEN
        SET v_avg_rating = 0.00;
    END IF;

    RETURN v_avg_rating;
END;


-- ===========================================================
-- Function 3: Calculate total host accommodation
-- ===========================================================
DROP FUNCTION IF EXISTS fn_count_accommodations_by_host;


CREATE FUNCTION fn_count_accommodations_by_host(p_HostID VARCHAR(20))
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE v_count INT DEFAULT 0;

    -- Dùng bảng 'post' để đếm số nhà host đã đăng
    SELECT COUNT(*) INTO v_count
    FROM post
    WHERE Host_ID = p_HostID;

    RETURN v_count;
END;


-- ===========================================================
-- Function 4: Calculate host average rating
-- ===========================================================

DROP FUNCTION IF EXISTS fn_get_host_average_rating;


CREATE FUNCTION fn_get_host_average_rating(p_host_id VARCHAR(20))
RETURNS DECIMAL(4,2)
DETERMINISTIC
BEGIN
    DECLARE v_avg_rating DECIMAL(4,2) DEFAULT 0.00;
    DECLARE v_exists INT DEFAULT 0;

    -- 1. Kiểm tra Host có tồn tại không
    SELECT COUNT(*) INTO v_exists
    FROM host
    WHERE Host_ID = p_host_id;

    IF v_exists = 0 THEN
        RETURN -1; -- Trả về -1 nếu Host không tồn tại
    END IF;

    -- 2. Tính trung bình rating
    -- LOGIC ĐÚNG: Join Reviews -> Post (Bảng Post liên kết Accommodation với Host)
    SELECT ROUND(AVG(r.Ratings), 2)
    INTO v_avg_rating
    FROM reviews r
    JOIN post p ON r.Accommodation_ID = p.Accommodation_ID
    WHERE p.Host_ID = p_host_id;

    -- 3. Xử lý trường hợp NULL
    IF v_avg_rating IS NULL THEN
        SET v_avg_rating = 0.00;
    END IF;

    RETURN v_avg_rating;
END;

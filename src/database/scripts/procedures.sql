-- ===========================================================
-- Procedure 1: ReCalculate all counts after import csv
-- ===========================================================-- 
DROP PROCEDURE IF EXISTS sp_SyncSystemData;
CREATE PROCEDURE sp_SyncSystemData(
    IN p_TargetType VARCHAR(20),   -- Input: 'HOST', 'GUEST', 'ACCOMMODATION', 'ALL'
    OUT p_Message VARCHAR(255)     -- Output: Status message
)
BEGIN
    -- 1. Validate Input
    IF p_TargetType NOT IN ('HOST', 'GUEST', 'ACCOMMODATION', 'ALL') THEN
        SET p_Message = 'Error: Invalid Target Type. Use HOST, GUEST, ACCOMMODATION or ALL.';
    ELSE
        -- 2. Update Host Listings Count
        IF p_TargetType = 'HOST' OR p_TargetType = 'ALL' THEN
            UPDATE host h
            SET Listings_Count = (SELECT COUNT(*) FROM post p WHERE p.Host_ID = h.Host_ID);
        END IF;

        -- 3. Update Guest Counts (Booking & Review)
        IF p_TargetType = 'GUEST' OR p_TargetType = 'ALL' THEN
            UPDATE guest g
            SET Bookings_Count = (SELECT COUNT(*) FROM booking b WHERE b.Guest_ID = g.Guest_ID);
            
            UPDATE guest g
            SET Reviews_Count = (SELECT COUNT(*) FROM reviews r WHERE r.Guest_ID = g.Guest_ID);
        END IF;

        -- 4. Update Accommodation Stats (Review & Revenue)
        IF p_TargetType = 'ACCOMMODATION' OR p_TargetType = 'ALL' THEN
            UPDATE accommodation a
            SET Total_Reviews = (SELECT COUNT(*) FROM reviews r WHERE r.Accommodation_ID = a.Accommodation_ID);
            
            -- Gọi function tính doanh thu (tái sử dụng code)
            UPDATE accommodation
            SET Annual_Revenue_Estimated = fn_CalculateAnnualRevenue(Accommodation_ID);
        END IF;

        -- 5. Set Output Message
        SET p_Message = CONCAT('Successfully synchronized data for: ', p_TargetType);
    END IF;
END;


-- SET SQL_SAFE_UPDATES = 0;
-- CALL sp_SyncSystemData('ALL', @ResultMsg);
-- SELECT @ResultMsg; 
-- SET SQL_SAFE_UPDATES = 1;

-- ===========================================================
-- PROCEDURE 2: Create Booking
-- ===========================================================
DROP PROCEDURE IF EXISTS sp_CreateBooking;
CREATE PROCEDURE sp_CreateBooking(
    IN p_GuestID VARCHAR(20),
    IN p_AccommodationID VARCHAR(10),
    IN p_CheckIn DATE,
    IN p_CheckOut DATE,
    IN p_NumGuests INT,
	OUT v_TotalPrice DECIMAL(10,2),
	OUT v_NewBookingID INT
)
BEGIN
    DECLARE v_PricePerNight DECIMAL(10,2);
    DECLARE v_Days INT;
    
    -- 1. Validate ngày
    IF p_CheckIn >= p_CheckOut THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Check-out date must be after check-in date.';
    END IF;
    
    -- 2. Lấy giá tiền
    SELECT Price_Per_Night INTO v_PricePerNight 
    FROM accommodation WHERE Accommodation_ID = p_AccommodationID;

    -- 3. Tính tổng tiền
    SET v_Days = DATEDIFF(p_CheckOut, p_CheckIn);
    SET v_TotalPrice = v_PricePerNight * v_Days;

    -- 4. INSERT BOOKING (Không truyền Booking_ID, để nó tự tăng)
    -- Trigger check availability sẽ chạy ở đây
    INSERT INTO booking (Accommodation_ID, Guest_ID, Check_in, Check_out, Status, Num_Guests, Total_Price, Created_At)
    VALUES (p_AccommodationID, p_GuestID, p_CheckIn, p_CheckOut, 'Pending', p_NumGuests, v_TotalPrice, CURDATE());

    -- 5. Lấy ID vừa tạo
    SET v_NewBookingID = LAST_INSERT_ID();

END;

-- ===========================================================
-- Procedure 3: Complete booking payment
-- ===========================================================
DROP PROCEDURE IF EXISTS sp_CompleteBookingPayment;
CREATE PROCEDURE sp_CompleteBookingPayment(
    IN p_BookingID INT,          -- ID đơn hàng
    IN p_GuestID VARCHAR(20),    -- ID khách thanh toán
    IN p_PaymentMethod VARCHAR(20), -- Cách thanh toán
    OUT p_PaymentID INT,
    OUT p_PaidAmount DECIMAL(10,2),
    OUT p_Message VARCHAR(100)
)
BEGIN
    DECLARE v_CurrentStatus VARCHAR(20);
    DECLARE v_TotalToPay DECIMAL(10,2); 

    -- 1. Lấy thông tin trạng thái và giá tiền từ bảng Booking
    SELECT Status, Total_Price
    INTO v_CurrentStatus, v_TotalToPay
    FROM booking 
    WHERE Booking_ID = p_BookingID;

    -- 2. Validate (Kiểm tra lỗi)
    IF v_CurrentStatus IS NULL THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Booking ID not found.';
    END IF;

    IF v_CurrentStatus = 'Cancelled' THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Cannot pay for a cancelled booking.';
    ELSEIF v_CurrentStatus = 'Confirmed' THEN
         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Booking is already confirmed and paid.';
    END IF;

    START TRANSACTION;
        
        INSERT INTO payment (Booking_ID, Guest_ID, Payment_Method, Amount, Currency, Payment_Status, Paid_At)
        VALUES (p_BookingID, p_GuestID, p_PaymentMethod, v_TotalToPay, 'USD', 'Completed', CURDATE());
		
		SET p_PaymentID = LAST_INSERT_ID();

        -- Update trạng thái Booking
        UPDATE booking 
        SET Status = 'Confirmed' 
        WHERE Booking_ID = p_BookingID;

    COMMIT;
    
    SET p_PaidAmount = v_TotalToPay;
    SET p_Message = 'Payment Successful';
    
END;



-- ===========================================================
-- Procedure 4: Cancel Booking
-- ===========================================================
DROP PROCEDURE IF EXISTS sp_CancelBooking;
CREATE PROCEDURE sp_CancelBooking(
    IN p_BookingID INT, -- Đã đổi thành INT
    IN p_Reason VARCHAR(100),
	OUT v_RefundAmount DECIMAL(10,2)
)
BEGIN
    DECLARE v_CheckInDate DATE;
    DECLARE v_Status VARCHAR(20);
    DECLARE v_TotalPrice DECIMAL(10,2);
    DECLARE v_RefundRate DECIMAL(4,2);
    DECLARE v_DaysUntilCheckIn INT;

    SELECT Check_in, Status, Total_Price 
    INTO v_CheckInDate, v_Status, v_TotalPrice
    FROM booking WHERE Booking_ID = p_BookingID;

    IF v_Status = 'Cancelled' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Booking is already cancelled.';
    END IF;

    SET v_DaysUntilCheckIn = DATEDIFF(v_CheckInDate, CURDATE());

    -- Logic hoàn tiền
    IF v_DaysUntilCheckIn >= 7 THEN
        SET v_RefundRate = 1.00;
    ELSEIF v_DaysUntilCheckIn > 0 THEN
        SET v_RefundRate = 0.50;
    ELSE
        SET v_RefundRate = 0.00;
    END IF;

    SET v_RefundAmount = v_TotalPrice * v_RefundRate;

    START TRANSACTION;
        UPDATE booking SET Status = 'Cancelled' WHERE Booking_ID = p_BookingID;

        -- Insert Cancellation (Không truyền Cancellation_ID)
        INSERT INTO cancellation (Booking_ID, Cancel_Date, Reason, Refund_Rate, Refund_Amount)
        VALUES (p_BookingID, CURDATE(), p_Reason, v_RefundRate, v_RefundAmount);
    COMMIT;

END;


-- ===========================================================
-- Procedure 5: Get favorite accommodation
-- ===========================================================
DROP PROCEDURE IF EXISTS sp_FindGuestFavorites;
CREATE PROCEDURE sp_FindGuestFavorites(
    IN p_MinRating DECIMAL(2,1),  
    IN p_MinReviewCount INT     
)
BEGIN
    IF p_MinRating < 1 OR p_MinRating > 5 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Rating must be between 1 and 5.';
    END IF;

    SELECT 
        a.Accommodation_ID,
        a.Title,
        a.Price_Per_Night,
        COUNT(r.Review_ID) AS TotalReviews,
        ROUND(AVG(r.Ratings), 2) AS AverageScore
    FROM accommodation a
    JOIN reviews r ON a.Accommodation_ID = r.Accommodation_ID
    GROUP BY a.Accommodation_ID, a.Title, a.Price_Per_Night -- Gom nhóm theo từng nhà
    HAVING 
        ROUND(AVG(r.Ratings), 2) >= p_MinRating       -- Param trong HAVING
        AND COUNT(r.Review_ID) >= p_MinReviewCount    -- Param trong HAVING
    ORDER BY AverageScore DESC;
END;
DELIMITER 

-- ===========================================================
-- Procedure 6: Find accommodation with price budget for 1 night
-- ===========================================================
DROP PROCEDURE IF EXISTS sp_FindBudgetStays;
CREATE PROCEDURE sp_FindBudgetStays(
    IN p_CityName VARCHAR(100),
    IN p_MaxPrice DECIMAL(10,2)
)
BEGIN
    IF p_MaxPrice <= 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Error: Max price must be greater than 0.';
    END IF;

    IF p_CityName IS NULL OR TRIM(p_CityName) = '' THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Error: City name cannot be empty.';
    END IF;

    SELECT 
        a.Accommodation_ID,
        a.Title,
        l.City,
        a.Price_Per_Night,
        a.Total_Reviews
    FROM accommodation a
    JOIN location l ON a.Location_ID = l.Location_ID
    WHERE l.City LIKE CONCAT('%', p_CityName, '%') -- Tìm theo tên thành phố
      AND a.Price_Per_Night <= p_MaxPrice           
    ORDER BY a.Price_Per_Night ASC;                
    
END;

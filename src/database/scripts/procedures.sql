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
    DECLARE v_GuestExists INT;
    DECLARE v_AccomExists INT;
    DECLARE v_MaxGuests INT;
    DECLARE v_PricePerNight DECIMAL(10,2);
    DECLARE v_Days INT;
    DECLARE v_ConflictCount INT;
    DECLARE v_IsInstant BOOL;
    DECLARE v_InitialStatus VARCHAR(20);

    -- ----------------------------------------------------
    -- 0. Validate guest exists
    -- ----------------------------------------------------
    SELECT COUNT(*) INTO v_GuestExists
    FROM guest 
    WHERE Guest_ID = p_GuestID;

    IF v_GuestExists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Guest not found.';
    END IF;

    -- ----------------------------------------------------
    -- 1. Validate accommodation exists
    -- ----------------------------------------------------
    SELECT COUNT(*) INTO v_AccomExists
    FROM accommodation 
    WHERE Accommodation_ID = p_AccommodationID;

    IF v_AccomExists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Accommodation not found.';
    END IF;

    -- Get max guests + price + instant flag
    SELECT Max_Guests, Price_Per_Night, Is_Instant_Bookable
    INTO v_MaxGuests, v_PricePerNight, v_IsInstant
    FROM accommodation
    WHERE Accommodation_ID = p_AccommodationID;

    -- ----------------------------------------------------
    -- 2. Validate date range
    -- ----------------------------------------------------
    IF p_CheckIn >= p_CheckOut THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Check-out must be after check-in.';
    END IF;

    -- ----------------------------------------------------
    -- 3. Get max guests + price
    -- ----------------------------------------------------
    IF p_NumGuests > v_MaxGuests THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Guest count exceeds accommodation capacity.';
    END IF;

    -- ----------------------------------------------------
    -- 4. Check availability (Confirmed bookings only)
    -- ----------------------------------------------------
    SELECT COUNT(*) INTO v_ConflictCount
    FROM booking
    WHERE Accommodation_ID = p_AccommodationID
      AND Status = 'Confirmed'
      AND (p_CheckIn < Check_out AND p_CheckOut > Check_in);

    IF v_ConflictCount > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Accommodation is not available for these dates.';
    END IF;

    -- ----------------------------------------------------
    -- 5. Compute price and Determine initial status
    -- ----------------------------------------------------
    SET v_Days = DATEDIFF(p_CheckOut, p_CheckIn);
    SET v_TotalPrice = v_PricePerNight * v_Days;

    IF v_IsInstant = 1 THEN
        SET v_InitialStatus = 'WaitingPayment';
    ELSE
        SET v_InitialStatus = 'Pending';
    END IF;

    -- ----------------------------------------------------
    -- 6. Insert booking
    -- ----------------------------------------------------
    INSERT INTO booking (
        Accommodation_ID, 
        Guest_ID, 
        Check_in, 
        Check_out, 
        Status, 
        Num_Guests, 
        Total_Price, 
        Created_At
    )
    VALUES (
        p_AccommodationID,
        p_GuestID,
        p_CheckIn,
        p_CheckOut,
        v_InitialStatus,
        p_NumGuests,
        v_TotalPrice,
        NOW()
    );

    SET v_NewBookingID = LAST_INSERT_ID();

    -- ----------------------------------------------------
    -- 7. Return result to NestJS
    -- ----------------------------------------------------
    SELECT 
        v_NewBookingID AS bookingId, 
        v_TotalPrice AS totalPrice;

END;


-- ===========================================================
-- Procedure 3: Complete booking payment
-- ===========================================================
DROP PROCEDURE IF EXISTS sp_CompleteBookingPayment;
CREATE PROCEDURE sp_CompleteBookingPayment(
    IN  p_BookingID INT,
    IN  p_PaymentMethod VARCHAR(20),
    IN  p_Currency VARCHAR(10),
    OUT p_PaymentID INT,
    OUT p_PaidAmount DECIMAL(10,2),
    OUT p_Message VARCHAR(100)
)
BEGIN
    DECLARE v_CurrentStatus VARCHAR(20);
    DECLARE v_TotalToPay DECIMAL(10,2);
    DECLARE v_GuestID VARCHAR(20);

    -- 1) Get booking info
    SELECT Status, Total_Price, Guest_ID
    INTO v_CurrentStatus, v_TotalToPay, v_GuestID
    FROM booking
    WHERE Booking_ID = p_BookingID;

    -- 2) Validate
    IF v_CurrentStatus IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Booking not found.';
    END IF;

    IF v_CurrentStatus = 'Cancelled' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: This booking has been cancelled and cannot be paid.';
    END IF;

    IF v_CurrentStatus = 'Pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Your booking is waiting for host approval. You cannot make a payment yet.';
    END IF;

    IF v_CurrentStatus = 'Confirmed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: This booking has already been paid and confirmed.';
    END IF;

    IF v_CurrentStatus <> 'WaitingPayment' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Payment is not allowed in the current booking status.';
    END IF;

    START TRANSACTION;

        INSERT INTO payment (
            Booking_ID, Guest_ID, Payment_Method,
            Amount, Currency, Payment_Status, Paid_At
        )
        VALUES (
            p_BookingID, v_GuestID, p_PaymentMethod,
            v_TotalToPay, p_Currency, 'Completed', NOW()
        );

        SET p_PaymentID = LAST_INSERT_ID();

        UPDATE booking
        SET Status = 'Confirmed'
        WHERE Booking_ID = p_BookingID;

    COMMIT;

    SET p_PaidAmount = v_TotalToPay;
    SET p_Message = 'Payment Successful';

    SELECT p_PaymentID AS paymentId, p_PaidAmount AS amount, p_Message AS message;

END;


-- ===========================================================
-- Procedure 4: Cancel Booking
-- ===========================================================
DROP PROCEDURE IF EXISTS sp_CancelBooking;
CREATE PROCEDURE sp_CancelBooking(
    IN p_BookingID INT,
    IN p_GuestID VARCHAR(20),
    IN p_Reason VARCHAR(100),
    OUT p_RefundAmount DECIMAL(10,2)    -- OUT param renamed
)
BEGIN
    DECLARE v_CheckInDate DATE;
    DECLARE v_Status VARCHAR(20);
    DECLARE v_TotalPrice DECIMAL(10,2);
    DECLARE v_Owner VARCHAR(20);
    DECLARE v_RefundRate DECIMAL(4,2);
    DECLARE v_DaysUntilCheckIn INT;
    DECLARE v_RefundAmountLocal DECIMAL(10,2);  -- renamed

    SELECT Check_in, Status, Total_Price, Guest_ID
    INTO v_CheckInDate, v_Status, v_TotalPrice, v_Owner
    FROM booking
    WHERE Booking_ID = p_BookingID;

    IF v_Status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Booking not found.';
    END IF;

    IF v_Owner <> p_GuestID THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Unauthorized booking.';
    END IF;

    IF v_Status = 'Cancelled' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Booking already cancelled.';
    END IF;

    IF v_Status = 'Completed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Completed stays cannot be cancelled.';
    END IF;

    SET v_DaysUntilCheckIn = DATEDIFF(v_CheckInDate, CURDATE());

    IF v_Status = 'Pending' THEN
        SET v_RefundRate = 0.00;
        SET v_RefundAmountLocal = 0.00;
    ELSEIF v_Status = 'Confirmed' THEN
        IF v_DaysUntilCheckIn >= 7 THEN
            SET v_RefundRate = 1.00;
        ELSEIF v_DaysUntilCheckIn > 0 THEN
            SET v_RefundRate = 0.50;
        ELSE
            SET v_RefundRate = 0.00;
        END IF;

        SET v_RefundAmountLocal = v_TotalPrice * v_RefundRate;
    END IF;

    START TRANSACTION;
        UPDATE booking
        SET Status = 'Cancelled'
        WHERE Booking_ID = p_BookingID;

        INSERT INTO cancellation (Booking_ID, Cancel_Date, Reason, Refund_Rate, Refund_Amount)
        VALUES (p_BookingID, CURDATE(), p_Reason, v_RefundRate, v_RefundAmountLocal);
    COMMIT;

    -- Assign to OUT param
    SET p_RefundAmount = v_RefundAmountLocal;
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
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Rating must be between 1 and 5.';
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


-- ===========================================================
-- Procedure 7: Host approves Pending Bookings
-- ===========================================================
DROP PROCEDURE IF EXISTS sp_ApproveBooking;
CREATE PROCEDURE sp_ApproveBooking(
    IN p_BookingID INT,
    IN p_HostID VARCHAR(20),
    OUT p_Message VARCHAR(100)
)
BEGIN
    DECLARE v_Status VARCHAR(20);
    DECLARE v_AccommodationHost VARCHAR(20);

    -- Get booking status & host of accommodation
    SELECT b.Status, p.Host_ID
    INTO v_Status, v_AccommodationHost
    FROM booking b
    JOIN accommodation a ON a.Accommodation_ID = b.Accommodation_ID
    JOIN post p ON p.Accommodation_ID = a.Accommodation_ID
    WHERE b.Booking_ID = p_BookingID;

    IF v_Status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Booking not found.';
    END IF;

    IF v_AccommodationHost <> p_HostID THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Unauthorized: Host does not own this accommodation.';
    END IF;

    IF v_Status = 'Cancelled' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Cannot approve a cancelled booking.';
    END IF;

    IF v_Status = 'Confirmed' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Booking already confirmed.';
    END IF;

    IF v_Status <> 'Pending' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Only pending bookings can be approved.';
    END IF;

    UPDATE booking
    SET Status = 'WaitingPayment'
    WHERE Booking_ID = p_BookingID;

    SET p_Message = 'Booking approved. Waiting for guest payment.';

    SELECT p_Message AS message;
END;

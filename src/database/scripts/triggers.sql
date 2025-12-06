-- CO2014_Project_BackEnd\src\database\scripts\triggers.sql

-- ===========================================================
-- Trigger 1: Administrator (Before Insert)
-- ===========================================================
DROP TRIGGER IF EXISTS trg_administrator_before_insert;
CREATE TRIGGER trg_administrator_before_insert
BEFORE INSERT ON administrator
FOR EACH ROW
BEGIN
    
    DECLARE next_id INT;
    
    SELECT AUTO_INCREMENT INTO next_id
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'administrator';
      
    IF NEW.Admin_ID IS NULL THEN
        SET NEW.Admin_ID = CONCAT('ADM-', LPAD(next_id, 6, '0'));
    END IF;
END;


-- ===========================================================
-- Trigger 2: Post (After Insert)
-- ===========================================================
DROP TRIGGER IF EXISTS trg_post_after_insert;
CREATE TRIGGER trg_post_after_insert
AFTER INSERT ON post
FOR EACH ROW
BEGIN
    -- Purpose: To update the derived Listings_Count in the 'host' table.
            
    UPDATE host
    SET Listings_Count = Listings_Count + 1
    WHERE Host_ID = NEW.Host_ID;
END;


-- ===========================================================
-- Trigger 3: Booking (After Insert)
-- ===========================================================
DROP TRIGGER IF EXISTS trg_booking_after_insert;
CREATE TRIGGER trg_booking_after_insert
AFTER INSERT ON booking
FOR EACH ROW
BEGIN
    -- Purpose: To update the derived Bookings_Count in the 'guest' table.
            
    UPDATE guest
    SET Bookings_Count = Bookings_Count + 1
    WHERE Guest_ID = NEW.Guest_ID;
END;


-- ===========================================================
-- Trigger 4: Review (After Insert)
-- ===========================================================
DROP TRIGGER IF EXISTS trg_reviews_after_insert;

CREATE TRIGGER trg_reviews_after_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    -- Purpose: To update the derived counts in 'guest' and 'accommodation' tables.
            
    -- 1. Increment the Reviews_Count for the guest who posted the review.
    UPDATE guest
    SET Reviews_Count = Reviews_Count + 1
    WHERE Guest_ID = NEW.Guest_ID;
            
    -- 2. Increment the Total_Reviews for the accommodation that was reviewed.
    UPDATE accommodation
    SET Total_Reviews = Total_Reviews + 1
    WHERE Accommodation_ID = NEW.Accommodation_ID;
END;


-- ===========================================================
-- Trigger 5: Check Availability
-- ===========================================================
DROP TRIGGER IF EXISTS trg_BeforeBookingInsert_CheckAvailability;
CREATE TRIGGER trg_BeforeBookingInsert_CheckAvailability
BEFORE INSERT ON booking
FOR EACH ROW
BEGIN
    DECLARE v_conflict_count INT;
    SELECT COUNT(*) INTO v_conflict_count
    FROM booking
    WHERE Accommodation_ID = NEW.Accommodation_ID
      AND Status IN ('Confirmed', 'Pending')
      AND (NEW.Check_in < Check_out AND NEW.Check_out > Check_in);
    
    IF v_conflict_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Dates are not available.';
    END IF;
END;

-- ===========================================================
-- Trigger 6: Delete Review_Count and Total_Review
-- ===========================================================
DROP TRIGGER IF EXISTS trg_reviews_after_delete;
CREATE TRIGGER trg_reviews_after_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    UPDATE guest SET Reviews_Count = Reviews_Count - 1 WHERE Guest_ID = OLD.Guest_ID;
    UPDATE accommodation SET Total_Reviews = Total_Reviews - 1 WHERE Accommodation_ID = OLD.Accommodation_ID;
END;


-- ===========================================================
-- Trigger 7: Delete Booking_Count
-- ===========================================================
DROP TRIGGER IF EXISTS trg_booking_after_delete;

CREATE TRIGGER trg_booking_after_delete
AFTER DELETE ON booking
FOR EACH ROW
BEGIN
    -- Mục đích: Cập nhật Bookings_Count trong bảng Guest sau khi xóa một booking
    UPDATE guest
    SET Bookings_Count = Bookings_Count - 1
    WHERE Guest_ID = OLD.Guest_ID;
END;


-- ===========================================================
-- Trigger 8: Delete Listing Count
-- ===========================================================
DROP TRIGGER IF EXISTS trg_post_after_delete; 

CREATE TRIGGER trg_post_after_delete
AFTER DELETE ON post
FOR EACH ROW
BEGIN
    -- Mục đích: Cập nhật Listings_Count trong bảng Host sau khi một bài đăng bị xóa
    UPDATE host
    SET Listings_Count = Listings_Count - 1
    WHERE Host_ID = OLD.Host_ID;
END;

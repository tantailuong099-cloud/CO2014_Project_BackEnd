-- ===========================================================
-- Procedure 1: ReCalculate all counts after import csv
-- ===========================================================
DROP PROCEDURE IF EXISTS sp_RecalculateAllCounts;

CREATE PROCEDURE sp_RecalculateAllCounts()
BEGIN
    -- 1. Cập nhật Listings_Count cho HOST
    UPDATE host h
    SET Listings_Count = (
        SELECT COUNT(*) 
        FROM accommodation a 
        WHERE a.Host_ID = h.Host_ID
    );

    -- 2. Cập nhật Bookings_Count cho GUEST
    UPDATE guest g
    SET Bookings_Count = (
        SELECT COUNT(*) 
        FROM booking b 
        WHERE b.Guest_ID = g.Guest_ID
    );

    -- 3. Cập nhật Reviews_Count cho GUEST
    UPDATE guest g
    SET Reviews_Count = (
        SELECT COUNT(*) 
        FROM reviews r 
        WHERE r.Guest_ID = g.Guest_ID
    );

    -- 4. Cập nhật Total_Reviews cho ACCOMMODATION
    UPDATE accommodation a
    SET Total_Reviews = (
        SELECT COUNT(*) 
        FROM reviews r 
        WHERE r.Accommodation_ID = a.Accommodation_ID
    );

    -- 5. Cập nhật Annual_Revenue_Estimated cho ACCOMMODATION
    -- Gọi function fn_CalculateAnnualRevenue cho từng dòng
    UPDATE accommodation
    SET Annual_Revenue_Estimated = fn_CalculateAnnualRevenue(Accommodation_ID);

    SELECT 'All counts and revenues have been recalculated successfully.' AS Status;
END;
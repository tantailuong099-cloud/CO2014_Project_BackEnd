-- ===========================================================
-- Function 1: Calculate Annual Revenue
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


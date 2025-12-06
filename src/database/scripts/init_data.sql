-- ===========================================================
--  Part 1: Create Database and Tables
-- ===========================================================

DROP DATABASE IF EXISTS updated_airbnb;
CREATE DATABASE updated_airbnb CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_ci;
USE updated_airbnb;

-- ===========================================================
--  Administrator Table
-- ===========================================================
DROP TABLE IF EXISTS administrator;
CREATE TABLE administrator (
    id_num INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    Admin_ID VARCHAR(12) NOT NULL UNIQUE,
    Name VARCHAR(100) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    BirthDate DATE DEFAULT NULL,
    Nationality VARCHAR(50) DEFAULT NULL,
    Email VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(20) DEFAULT NULL,
    ProfilePicture VARCHAR(255) DEFAULT NULL,
    UNIQUE KEY UQ_Admin_Email (Email)
) ENGINE=InnoDB;


CREATE TRIGGER administrator_before_insert
BEFORE INSERT ON administrator
FOR EACH ROW
BEGIN
    IF NEW.Admin_ID IS NULL THEN
        SET NEW.Admin_ID = CONCAT('ADM-', LPAD((SELECT IFNULL(MAX(id_num),0)+1 FROM administrator), 6, '0'));
    END IF;
END;


-- Sample Data
INSERT INTO administrator (Name, Password, BirthDate, Nationality, Email, PhoneNumber, ProfilePicture)
VALUES
('Alice Nguyen','alice123','1985-04-12','Vietnam','alice1@gmail.com','0901234561','alice1.jpg'),
('John Smith','johnpass','1978-11-30','USA','john1@gmail.com','0012345671','john1.png'),
('Marie Curie','mariepass','1990-06-25','France','marie1@gmail.com','0033123451','marie1.jpg'),
('Helen Keller','helenpass','1994-04-23','Germany','helen1@gmail.com','0903893561','helen1.jpg'),
('David Lee','davidpass','1982-03-10','Canada','david1@gmail.com','1415555010','david1.jpg'),
('Sofia Rossi','sofiapass','1991-07-18','Italy','sofia1@gmail.com','390612345678','sofia1.png'),
('Liam O Connor','liampass','1988-09-05','Ireland','liam1@gmail.com','353851234567','liam1.jpg'),
('Emma Chen','emmapass','1993-02-27','China','emma1@gmail.com','8613812345678','emma1.jpg'),
('Noah Johnson','noahpass','1985-12-01','USA','noah1@gmail.com','0015551234567','noah1.png'),
('Isabella Martinez','isabellapass','1990-08-15','Spain','isabella1@gmail.com','34612345678','isabella1.jpg'),
('Oliver Brown','oliverpass','1987-11-22','UK','oliver1@gmail.com','447912345678','oliver1.png'),
('Mia Wilson','miapass','1992-05-30','Australia','mia1@gmail.com','61412345678','mia1.jpg'),
('Ethan Kim','ethanpass','1989-10-12','Korea','ethan1@gmail.com','821012345678','ethan1.png'),
('Charlotte Dubois','charlottepass','1994-03-19','France','charlotte1@gmail.com','33123456789','charlotte1.jpg'),
('Lucas Schmidt','lucaspass','1983-06-07','Germany','lucas1@gmail.com','491512345678','lucas1.png');

-- ===========================================================
--  User Table (shared attributes)
-- ===========================================================
DROP TABLE IF EXISTS user;
CREATE TABLE user (
    User_ID          	VARCHAR(20)     NOT NULL,
    Name             	VARCHAR(100)    NOT NULL,
    BirthDate        	DATE            DEFAULT NULL,
    Nationality      	VARCHAR(50)     DEFAULT NULL,
    Email            	VARCHAR(100)    NOT NULL,
    Password         	VARCHAR(255)    NOT NULL,
    PhoneNumber      	VARCHAR(20)     DEFAULT NULL,
    SSN              	VARCHAR(30)     DEFAULT NULL,
    Joined_Date      	DATE            DEFAULT (CURRENT_DATE),
    Bank_Account     	VARCHAR(30)     DEFAULT NULL,
	Admin_ID          	VARCHAR(12)     DEFAULT NULL,

    PRIMARY KEY (User_ID),
    UNIQUE KEY UQ_User_Email (Email),
    UNIQUE KEY UQ_User_PhoneNumber (PhoneNumber),
    UNIQUE KEY UQ_User_SSN (SSN),

    -- Semantic constraint: must be >= 18 years old
    CHECK (BirthDate <= '2007-10-30'),
    
        -- Foreign key to administrator
    CONSTRAINT fk_user_admin
        FOREIGN KEY (Admin_ID)
        REFERENCES administrator(Admin_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Load data from combined CSV
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/user.csv'
INTO TABLE user
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(User_ID, Name, BirthDate, Nationality, Email, Password, PhoneNumber, SSN, Joined_Date, Bank_Account, Admin_ID);


-- ===========================================================
--  Guest Table (guest-specific attributes)
-- ===========================================================
DROP TABLE IF EXISTS guest;
CREATE TABLE guest (
    Guest_ID           		VARCHAR(20)    NOT NULL,
    Preferred_Payment  		VARCHAR(50)    DEFAULT 'Cash',
    Travel_Interests   		TEXT           DEFAULT NULL,
    Bookings_Count     		INT            DEFAULT 0 CHECK (Bookings_Count >= 0),
    Reviews_Count      		INT            DEFAULT 0 CHECK (Reviews_Count >= 0),

    PRIMARY KEY (Guest_ID),
    CONSTRAINT fk_guest_user
        FOREIGN KEY (Guest_ID)
        REFERENCES user(User_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (Preferred_Payment IN ('Cash', 'Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer'))
) ENGINE=InnoDB;

-- Load guest-specific CSV
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/guest_extra.csv'
INTO TABLE guest
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Guest_ID, Preferred_Payment, Travel_Interests, Bookings_Count, Reviews_Count);


-- ===========================================================
--  Host Table (host-specific attributes)
-- ===========================================================
DROP TABLE IF EXISTS host;
CREATE TABLE host (
    Host_ID           		VARCHAR(20)    NOT NULL,
    Tax_ID            		VARCHAR(30)    DEFAULT NULL UNIQUE,
    Response_Time     		VARCHAR(50)    DEFAULT 'unknown',
    Acceptance_Rate   		DECIMAL(5,2)   DEFAULT NULL 			CHECK (Acceptance_Rate BETWEEN 0 AND 100),
    Is_Superhost      		BOOLEAN        DEFAULT FALSE,
    Listings_Count    		INT            DEFAULT 0 			CHECK (Listings_Count >= 0),

    PRIMARY KEY (Host_ID),
    CONSTRAINT fk_host_user
        FOREIGN KEY (Host_ID)
        REFERENCES user(User_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CHECK (Response_Time IN ('within an hour', 'within a few hours', 'within a day', 'a few days or more', 'unknown'))
) ENGINE=InnoDB;

-- Load host-specific CSV
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/host_extra.csv'
INTO TABLE host
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Host_ID, Tax_ID, @Response_Time, @Acceptance_Rate, @Is_Superhost, Listings_Count)
SET
    Response_Time = NULLIF(@Response_Time, ''),
    Acceptance_Rate = NULLIF(@Acceptance_Rate, ''),
    Is_Superhost = CASE
        WHEN LOWER(TRIM(@Is_Superhost)) IN ('true', '1', 'yes') THEN TRUE
        ELSE FALSE
    END;


-- ===========================================================
--  Location Table
-- ===========================================================

DROP TABLE IF EXISTS location;
CREATE TABLE location (
    Location_ID      VARCHAR(10) 	PRIMARY KEY,
    Latitude         DECIMAL(9,6) 	NOT NULL,
    Longitude        DECIMAL(9,6) 	NOT NULL,
    City             VARCHAR(100)   NOT NULL,

    UNIQUE KEY UQ_Location_Coordinates (Latitude, Longitude)
);

-- ===========================================================
--  Load data from CSV (skip header row)
-- ===========================================================
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/location.csv'
INTO TABLE location
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(
    Location_ID,
    Latitude,
    Longitude,
    City
);

-- ===========================================================
--  Accommodation Type Table
-- ===========================================================
DROP TABLE IF EXISTS accommodation_type;
CREATE TABLE accommodation_type (
    Type_ID             VARCHAR(10)     PRIMARY KEY,
    Type_Name           VARCHAR(100)    NOT NULL,
    Parent_Type_ID      VARCHAR(10)     DEFAULT NULL,
    Base_Price          DECIMAL(10,2)   DEFAULT 0 CHECK (Base_Price >= 0),
    Room_Type           VARCHAR(50)     DEFAULT NULL,

    CONSTRAINT fk_type_parent
        FOREIGN KEY (Parent_Type_ID)
        REFERENCES accommodation_type(Type_ID)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    -- Semantic constraint for room type consistency
    CHECK (Room_Type IN ('Entire home/apt', 'Private room', 'Shared room', 'Hotel room', '', NULL))
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 0;

-- Load data from CSV
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/accommodationType.csv'
INTO TABLE accommodation_type
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(Type_ID, Type_Name, Parent_Type_ID, Base_Price, Room_Type);

SET FOREIGN_KEY_CHECKS = 1;
UPDATE accommodation_type
SET Parent_Type_ID = NULL
WHERE Parent_Type_ID = '';

-- ===========================================================
--  Accommodation Subtype Table
-- ===========================================================
DROP TABLE IF EXISTS accommodation_subtype;
CREATE TABLE accommodation_subtype (
    Parent_Type_ID      VARCHAR(10) NOT NULL,
    Subtype_ID          VARCHAR(10) NOT NULL,

    PRIMARY KEY (Parent_Type_ID, Subtype_ID),

    CONSTRAINT fk_subtype_parent
        FOREIGN KEY (Parent_Type_ID)
        REFERENCES accommodation_type(Type_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_subtype_child
        FOREIGN KEY (Subtype_ID)
        REFERENCES accommodation_type(Type_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 0;

-- Load data from CSV
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/accommodationSubtype.csv'
INTO TABLE accommodation_subtype
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(Parent_Type_ID, Subtype_ID);

SET FOREIGN_KEY_CHECKS = 1;


-- ===========================================================
--  Accommodation Table
-- ===========================================================
DROP TABLE IF EXISTS accommodation;
CREATE TABLE accommodation (
    Accommodation_ID        VARCHAR(10)		PRIMARY KEY,
    Title                   VARCHAR(255)	NOT NULL,
    Description             TEXT           	NOT NULL,
    Location_ID             VARCHAR(10)    	NOT NULL,
    Neighborhood            VARCHAR(50) 	DEFAULT NULL,
    Type_ID                 VARCHAR(10)     NOT NULL,
	Max_Guests              INT 			DEFAULT 1 		CHECK (Max_Guests > 0),
    Num_Beds                INT 			DEFAULT 0 		CHECK (Num_Beds >= 0),
    Num_Bedrooms            INT 			DEFAULT 0 		CHECK (Num_Bedrooms >= 0),
    Num_Bathrooms           INT 			DEFAULT 0 		CHECK (Num_Bathrooms >= 0),
    Amenities               TEXT 			DEFAULT NULL,
    Price_Per_Night         DECIMAL(10,2) 	DEFAULT NULL 	CHECK (Price_Per_Night >= 0),
    Is_Instant_Bookable     BOOLEAN        	DEFAULT FALSE,
    Total_Reviews           INT            	DEFAULT 0		CHECK (Total_Reviews >= 0),
    Annual_Revenue_Estimated DECIMAL(12,2) 	DEFAULT NULL 	CHECK (Annual_Revenue_Estimated >= 0),
    
    -- Referential integrity        
    CONSTRAINT fk_accommodation_location
        FOREIGN KEY (Location_ID)
        REFERENCES location(Location_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

	CONSTRAINT fk_accommodation_type
        FOREIGN KEY (Type_ID)
        REFERENCES accommodation_type(Type_ID)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- ===========================================================
--  Load data from CSV (skip header row)
-- ===========================================================
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/accommodation.csv'
INTO TABLE accommodation
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(
    Accommodation_ID,
    Title,
    Description,
    Location_ID,
	Type_ID,
    Neighborhood,
    Max_Guests,
    Num_Beds,
    Num_Bedrooms,
    Num_Bathrooms,
    Amenities,
    @Price_Per_Night,
    @Is_Instant_Bookable,
    Total_Reviews,
    @Annual_Revenue_Estimated
)
SET
    Is_Instant_Bookable = CASE 
        WHEN LOWER(TRIM(@Is_Instant_Bookable)) IN ('true', '1', 'yes') THEN TRUE
        ELSE FALSE
    END,
	Price_Per_Night = NULLIF(@Price_Per_Night, ''),
	Annual_Revenue_Estimated = NULLIF(@Annual_Revenue_Estimated, '');

-- ===========================================================
-- Post Table
-- ===========================================================
DROP TABLE IF EXISTS post;
CREATE TABLE post (
    Accommodation_ID  VARCHAR(10) NOT NULL,
    Host_ID           VARCHAR(10) NOT NULL,
    Post_Date         DATE NOT NULL,
    
	PRIMARY KEY (Accommodation_ID, Host_ID),

    CONSTRAINT fk_post_accommodation
        FOREIGN KEY (Accommodation_ID)
        REFERENCES accommodation(Accommodation_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_post_host
        FOREIGN KEY (Host_ID)
        REFERENCES host(Host_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===========================================================
-- Load post data
-- ===========================================================
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/post.csv'
INTO TABLE post
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(Accommodation_ID, Host_ID, Post_Date);

-- ===========================================================
-- Contact Table
-- ===========================================================
DROP TABLE IF EXISTS contact;
CREATE TABLE contact (
    Contact_ID    		INT           	NOT NULL 	AUTO_INCREMENT PRIMARY KEY,
    Guest_ID      		VARCHAR(10)   	NOT NULL,
    Host_ID       		VARCHAR(10)   	NOT NULL,

    -- Referential integrity
    CONSTRAINT fk_contact_guest
        FOREIGN KEY (Guest_ID)
        REFERENCES guest(Guest_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_contact_host
        FOREIGN KEY (Host_ID)
        REFERENCES host(Host_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

-- ===========================================================
-- Load sampled CSV (Guest_ID, Host_ID only)
-- ===========================================================
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/contact.csv'
INTO TABLE contact
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(
    Guest_ID,
    Host_ID
);


-- ===========================================================
-- Reviews Table
-- ===========================================================
DROP TABLE IF EXISTS reviews;

CREATE TABLE reviews (
    Review_ID          		INT NOT NULL AUTO_INCREMENT,
    Guest_ID           		VARCHAR(10)     NOT NULL,
    Accommodation_ID   		VARCHAR(10)     NOT NULL,
    Review_Date        		DATE            NOT NULL,
    Comments           		TEXT            DEFAULT NULL,
    Ratings            		INT             NOT NULL 			CHECK (Ratings BETWEEN 1 AND 5),

    PRIMARY KEY (Review_ID),

    -- Referential integrity
    CONSTRAINT fk_review_guest
        FOREIGN KEY (Guest_ID)
        REFERENCES guest(Guest_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_review_accommodation
        FOREIGN KEY (Accommodation_ID)
        REFERENCES accommodation(Accommodation_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===========================================================
-- Load CSV into Reviews
-- ===========================================================
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/reviews.csv'
INTO TABLE reviews
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(
    @Review_ID,
    Guest_ID,
    Accommodation_ID,
    @Review_Date,
    Comments,
    Ratings
)
SET
    Review_Date = STR_TO_DATE(@Review_Date, '%Y-%m-%d');

-- ===========================================================
-- Booking Table
-- ===========================================================
DROP TABLE IF EXISTS booking;

CREATE TABLE booking (
    Booking_ID          INT NOT NULL AUTO_INCREMENT,
    Accommodation_ID    VARCHAR(10)    NOT NULL,
    Guest_ID            VARCHAR(10)    NOT NULL,
    Check_in            DATE           NOT NULL,
    Check_out           DATE           NOT NULL,
    Status              VARCHAR(20)    NOT NULL,
    Num_Guests          INT            NOT NULL,
    Total_Price         DECIMAL(10,2)  DEFAULT NULL,
    Created_At          DATE           NOT NULL,

    PRIMARY KEY (Booking_ID),

    CONSTRAINT fk_booking_guest
        FOREIGN KEY (Guest_ID)
        REFERENCES guest(Guest_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_booking_accommodation
        FOREIGN KEY (Accommodation_ID)
        REFERENCES accommodation(Accommodation_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===========================================================
-- Load Booking CSV
-- ===========================================================
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/booking.csv'
INTO TABLE booking
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(
    @Booking_ID,
    Accommodation_ID,
    Guest_ID,
    @Check_in,
    @Check_out,
    Status,
    Num_Guests,
    @Total_Price,
    @Created_At
)
SET
    Check_in = STR_TO_DATE(@Check_in, '%Y-%m-%d'),
    Check_out = STR_TO_DATE(@Check_out, '%Y-%m-%d'),
	Total_Price = ROUND(NULLIF(TRIM(@Total_Price), ''), 2),
    Created_At = STR_TO_DATE(@Created_At, '%Y-%m-%d');


-- ===========================================================
-- Payment Table
-- ===========================================================
DROP TABLE IF EXISTS payment;

CREATE TABLE payment (
    Payment_ID          INT 			NOT NULL AUTO_INCREMENT,
    Booking_ID          INT    			NOT NULL,
    Guest_ID            VARCHAR(10)    	NOT NULL,
    Payment_Method      VARCHAR(20)    	NOT NULL,
    Amount              DECIMAL(10,2)  	DEFAULT NULL,
    Currency            VARCHAR(5)     	NOT NULL DEFAULT 'USD',
    Payment_Status      VARCHAR(20)    	NOT NULL,
    Paid_At             DATE           	NOT NULL,

    PRIMARY KEY (Payment_ID),

    CONSTRAINT fk_payment_booking
        FOREIGN KEY (Booking_ID)
        REFERENCES booking(Booking_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_payment_guest
        FOREIGN KEY (Guest_ID)
        REFERENCES guest(Guest_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ===========================================================
-- Load Payment CSV
-- ===========================================================
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/payment.csv'
INTO TABLE payment
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(
    @Payment_ID,
    Booking_ID,
    Guest_ID,
    Payment_Method,
    @Amount,
    Currency,
    Payment_Status,
    @Paid_At
)
SET
    Paid_At = STR_TO_DATE(@Paid_At, '%Y-%m-%d'),
	Amount = ROUND(NULLIF(TRIM(@Amount), ''), 2);


-- ===========================================================
-- Cancellation Table with Auto-generated ID
-- ===========================================================
DROP TABLE IF EXISTS cancellation;

CREATE TABLE cancellation (
    Cancellation_ID     INT             NOT NULL AUTO_INCREMENT,
    Booking_ID          INT 		    NOT NULL,
    Cancel_Date         DATE            NOT NULL,
    Reason              VARCHAR(100),
    Refund_Rate         DECIMAL(4,2)    NOT NULL,
    Refund_Amount       DECIMAL(10,2)   NOT NULL,

    PRIMARY KEY (Cancellation_ID),

    CONSTRAINT fk_cancellation_booking
        FOREIGN KEY (Booking_ID)
        REFERENCES booking(Booking_ID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ===========================================================
-- Load Cancellation CSV
-- ===========================================================
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/cancellations.csv'
INTO TABLE cancellation
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"'
LINES TERMINATED BY '\r\n'
IGNORE 1 ROWS
(
    Booking_ID,
    @Accommodation_ID,
    @Guest_ID,
    @Check_in,
    @Check_out,
    @Status,
    @Num_Guests,
    @Total_Price,
    @Cancel_Date,
    @Reason,
    @Refund_Rate,
    @Refund_Amount
)
SET
    Cancel_Date = STR_TO_DATE(@Cancel_Date, '%Y-%m-%d'),
    Reason = @Reason,
    Refund_Rate = NULLIF(@Refund_Rate,''),
    Refund_Amount = NULLIF(@Refund_Amount,'');










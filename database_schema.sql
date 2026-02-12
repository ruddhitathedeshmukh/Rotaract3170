
-- SQL SERVER DATABASE SCHEMA FOR RID 3170
-- Run this script in your SQL Server Management Studio (SSMS)

CREATE TABLE Clubs (
    Id NVARCHAR(50) PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Username NVARCHAR(100) UNIQUE NOT NULL,
    Password NVARCHAR(255) NOT NULL,
    Zone NVARCHAR(50),
    Status NVARCHAR(20) DEFAULT 'active',
    CharterDate DATE,
    SponsoredBy NVARCHAR(255),
    CharterNo NVARCHAR(100),
    ClubId NVARCHAR(100),
    LogoUrl NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);

CREATE TABLE ClubOfficers (
    ClubId NVARCHAR(50) FOREIGN KEY REFERENCES Clubs(Id) ON DELETE CASCADE,
    Role NVARCHAR(50), -- 'president', 'secretary', etc.
    Name NVARCHAR(255),
    PhotoUrl NVARCHAR(MAX),
    PRIMARY KEY (ClubId, Role)
);

CREATE TABLE ClubMetrics (
    ClubId NVARCHAR(50) PRIMARY KEY FOREIGN KEY REFERENCES Clubs(Id) ON DELETE CASCADE,
    CommunityCapital NVARCHAR(100) DEFAULT '₹0',
    ServiceHours NVARCHAR(100) DEFAULT '0',
    LivesTouched NVARCHAR(100) DEFAULT '0',
    RotaractersInAction NVARCHAR(100) DEFAULT '0',
    TotalPoints NVARCHAR(100) DEFAULT '0'
);

CREATE TABLE Members (
    Id NVARCHAR(50) PRIMARY KEY,
    ClubId NVARCHAR(50) FOREIGN KEY REFERENCES Clubs(Id) ON DELETE CASCADE,
    Name NVARCHAR(255) NOT NULL,
    RI_ID NVARCHAR(100),
    Designation NVARCHAR(100),
    Email NVARCHAR(255),
    Phone NVARCHAR(50),
    JoinedDate DATE,
    Occupation NVARCHAR(255),
    BloodGroup NVARCHAR(20),
    Gender NVARCHAR(20),
    Status NVARCHAR(20) DEFAULT 'Active',
    IsOfficer BIT DEFAULT 0
);

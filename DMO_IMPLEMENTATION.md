# Designated Monthly Observation (DMO) Implementation

## Overview
This document describes the implementation of the Designated Monthly Observation (DMO) category for the Rotaract District 3170 project reporting system.

## Features Implemented

### 1. Form Fields
The DMO form includes the following fields:

#### Basic Information
- **Date**: Date of the project (required)
- **Venue**: Location where the project was conducted (required)
- **Project Name**: Name of the DMO project (required)
- **Project Chair**: Name of the person leading the project (required)
- **Description**: Detailed description of the project (~100 words) with AI rewrite option (required)
- **Community Capital Deployed**: Amount spent on the project (required)
- **Lives Touched**: Number of beneficiaries (required, numeric)
- **Service Hours**: Total hours invested in the project (required, numeric)

#### Attendance Section
The form includes checkboxes for different attendance categories with auto-calculation:
- **Club Rotaractors**: 200 points per person
- **Visiting Rotaractors**: No points (counted in total attendance only)
- **Rotarians**: 300 points per person
- **Interactors**: 100 points per person
- **Others**: No points (counted in total attendance only)
- **Total Attendance**: Auto-calculated sum of all categories

#### Photo Upload
- Maximum 5 photos can be uploaded
- Total size limit: 1MB for all photos combined
- Error message displayed if limits are exceeded
- Supported formats: All image formats

#### News Coverage (Optional)
Two toggle options with conditional fields:

**News Publication** (+100 points):
- Toggle to enable/disable
- When enabled, shows:
  - Upload News Article: Single image upload (max 1MB)
  - News Link: URL field for news article link
  - At least one field (image or link) required when enabled

**News Telecasting on Local Channel** (+300 points):
- Toggle to enable/disable
- When enabled, shows:
  - Telecasting Link: URL field (required)
  - Placeholder text guides users to upload offline videos to social media first

#### Additional Categories
Checkboxes for project categorization with associated points:
- **Women Empowerment**: +400 points
- **Organizing Club Service Project**: +200 points
- **Organizing Community Service Project**: +500 points
- **Organizing Professional Service Project**: +500 points
- **Organizing International Service Project**: +300 points

Multiple categories can be selected simultaneously.

### 2. Point System

#### Base Points
- DMO projects receive **800 base points** when approved by admin

#### Attendance Points
- Club Rotaractors: 200 points × count
- Rotarians: 300 points × count
- Interactors: 100 points × count

#### News Coverage Points
- News Publication: +100 points (when enabled)
- News Telecasting: +300 points (when enabled)

#### Category Points
Points are cumulative based on selected categories:
- Women Empowerment: +400 points
- Organizing Club Service: +200 points
- Organizing Community Service: +500 points
- Organizing Professional Service: +500 points
- Organizing International Service: +300 points

#### Total Points Calculation
```
Total Points = Base Points (800) 
             + Attendance Points 
             + News Coverage Points 
             + Category Points
```

### 3. Declaration and Submission
- **Declaration Checkbox**: Required before submission
- Text: "I hereby declare the above information is true to the best of my knowledge"
- Submit button is disabled until declaration is checked
- Form is submitted for admin approval
- Points are claimed only after admin approval

### 4. Data Storage

#### Database Schema
New fields added to the `Project` model:

```python
# DMO specific checkboxes
organizing_club_service = models.BooleanField(default=False)
organizing_community_service = models.BooleanField(default=False)
organizing_professional_service = models.BooleanField(default=False)
organizing_international_service = models.BooleanField(default=False)

# Points tracking
category_points = models.IntegerField(default=0)
```

#### Category Addition
Added 'dmo' to PROJECT_CATEGORY_CHOICES:
```python
('dmo', 'Designated Monthly Observation')
```

### 5. Backend Logic

#### Point Calculation (in models.py save method)
```python
# Calculate DMO category points
self.category_points = 0
if self.organizing_club_service:
    self.category_points += 200
if self.organizing_community_service:
    self.category_points += 500
if self.organizing_professional_service:
    self.category_points += 500
if self.organizing_international_service:
    self.category_points += 300

# Set base points for DMO
if self.category == 'dmo':
    self.base_points = 800

# Include category_points in total
self.total_points = (
    self.base_points +
    self.attendance_points +
    self.additional_points +
    self.news_points +
    self.women_empowerment_points +
    self.mahadhan_points +
    self.general_public_points +
    self.category_points
)
```

### 6. Frontend Integration

#### Component Structure
- **DMOForm.tsx**: Main form component for DMO projects
- **Reporting.tsx**: Updated to include DMO form routing

#### Form Validation
- All required fields must be filled
- Photo size validation (max 1MB total)
- News image size validation (max 1MB per image)
- Declaration must be checked before submission
- News publication/telecasting validation when enabled

#### User Experience
- Clean, modern UI with gradient backgrounds
- Color-coded sections for easy navigation
- Real-time point calculation display
- AI description generation feature
- Toggle switches for news coverage options
- Responsive design for mobile and desktop

## Files Modified/Created

### Created Files
1. `DMOForm.tsx` - Main DMO form component
2. `backend/clubs/migrations/0007_add_dmo_fields.py` - Database migration
3. `DMO_IMPLEMENTATION.md` - This documentation file

### Modified Files
1. `backend/clubs/models.py` - Added DMO fields and point calculation logic
2. `Reporting.tsx` - Integrated DMO form into project reporting system

## Usage Instructions

### For Clubs
1. Navigate to Reporting section
2. Select the month for reporting
3. Click "Add Project"
4. Select "Designated Monthly Observation" category
5. Fill in all required fields
6. Upload photos (max 5, total 1MB)
7. Optionally enable news coverage and provide details
8. Select applicable additional categories
9. Check the declaration checkbox
10. Submit for admin approval

### For Admins
1. Review submitted DMO projects in admin dashboard
2. Verify all information and uploaded content
3. Approve or reject the submission
4. Upon approval, points are automatically calculated and awarded to the club

## Point Calculation Examples

### Example 1: Basic DMO Project
- Base Points: 800
- Club Rotaractors (10): 10 × 200 = 2,000
- Rotarians (5): 5 × 300 = 1,500
- **Total: 4,300 points**

### Example 2: DMO with News Coverage
- Base Points: 800
- Club Rotaractors (15): 15 × 200 = 3,000
- News Publication: 100
- News Telecasting: 300
- **Total: 4,200 points**

### Example 3: DMO with Multiple Categories
- Base Points: 800
- Club Rotaractors (20): 20 × 200 = 4,000
- Women Empowerment: 400
- Organizing Community Service: 500
- News Publication: 100
- **Total: 5,800 points**

### Example 4: Maximum Points Scenario
- Base Points: 800
- Club Rotaractors (30): 30 × 200 = 6,000
- Rotarians (10): 10 × 300 = 3,000
- Interactors (20): 20 × 100 = 2,000
- News Publication: 100
- News Telecasting: 300
- Women Empowerment: 400
- Organizing Club Service: 200
- Organizing Community Service: 500
- Organizing Professional Service: 500
- Organizing International Service: 300
- **Total: 14,100 points**

## Technical Notes

### Database Migration
Run the following command to apply the migration:
```bash
python manage.py migrate clubs 0007_add_dmo_fields
```

### API Endpoints
The DMO form uses the existing project API endpoints:
- `POST /api/projects/` - Create new DMO project
- `GET /api/projects/?club_id=X&month=Y&year=Z` - Fetch DMO projects
- `PUT /api/projects/{id}/` - Update DMO project
- `DELETE /api/projects/{id}/` - Delete DMO project

### Form State Management
The form uses React hooks for state management:
- `useState` for form data and validation states
- Real-time calculation of points
- Conditional rendering based on toggle states

## Future Enhancements
1. Integration with actual AI API for description generation
2. Image compression before upload
3. Bulk photo upload with drag-and-drop
4. Project templates for common DMO types
5. Analytics dashboard for DMO projects
6. Export functionality for DMO reports

## Support
For issues or questions regarding DMO implementation, please contact the development team or refer to the main project documentation.
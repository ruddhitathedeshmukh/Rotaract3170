# Professional Service Avenue Implementation

## Overview
This document describes the implementation of the Professional Service project category with all required features including form fields, point system, and database integration.

## Changes Made

### 1. Database Model Updates (`backend/clubs/models.py`)

#### Added Professional Service Category
- Added `'professional_service'` to `PROJECT_CATEGORY_CHOICES` in the Project model

#### New Fields Added to Project Model
```python
# Professional Service specific checkboxes
mahadhan_project = models.BooleanField(default=False)
general_public_100_300 = models.BooleanField(default=False)
general_public_500_plus = models.BooleanField(default=False)
general_public_1000_plus = models.BooleanField(default=False)

# Additional point fields
mahadhan_points = models.IntegerField(default=0)
general_public_points = models.IntegerField(default=0)
```

#### Updated Point Calculation Logic
The `save()` method now includes:
- **Base Points**: 500 points for Professional Service projects
- **Mahadhan Project**: 700 points when checkbox is selected
- **General Public Attendance Tiers**:
  - 100-300 attendees: 500 points
  - 500+ attendees: 700 points
  - 1000+ attendees: 1000 points
- **Women Empowerment**: 400 points (existing)
- **News Publication**: 100 points (existing)
- **News Telecasting**: 300 points (existing)
- **Attendance Points**: 200/rotaractor, 300/rotarian, 100/interactor (existing)

### 2. Frontend Form Component (`ProfessionalServiceForm.tsx`)

#### Form Fields Implemented
1. **Basic Information**
   - Date (required)
   - Venue (required)
   - Project Name (required)
   - Project Chair (required)
   - Community Capital Deployed (required)
   - Lives Touched (required, number input with placeholder "Number of beneficiaries")
   - Service Hours (required, number input with placeholder "Mention invested hours")
   - Description (required, with AI rewrite button)

2. **Attendance Section**
   - Club Rotaractors (checkbox + count, 200 pts/person)
   - Visiting Rotaractors (checkbox + count, no points)
   - Rotarians (checkbox + count, 300 pts/person)
   - Interactors (checkbox + count, 100 pts/person)
   - Others (checkbox + count, no points)
   - Auto-calculated total attendance display

3. **Photo Upload**
   - Maximum 5 photos allowed
   - Total size limit: 1MB for all photos combined
   - Error message displayed if limits exceeded
   - Success message showing number of photos selected

4. **News Coverage (Optional)**
   - **News Publication Toggle**
     - When enabled: Upload news article image (max 1MB)
     - News link field (paste link or upload to social media first)
     - At least one field (image or link) required when enabled
     - +100 points
   
   - **News Telecasting Toggle**
     - When enabled: Telecasting link field (required)
     - +300 points

5. **Additional Points Section**
   - **Women Empowerment** checkbox (+400 points)
   - **Organizing Mahadhan Project** checkbox (+700 points)
   - **General Public Attendance** (radio buttons, only one can be selected):
     - 100 to 300 attendees (+500 points)
     - Above 500 attendees (+700 points)
     - Above 1000 attendees (+1000 points)

6. **Points Summary Display**
   - Shows breakdown of all point categories:
     - Base Points: 500
     - Attendance Points: calculated
     - News Coverage Points: calculated
     - Women Empowerment Points: 0 or 400
     - Mahadhan Points: 0 or 700
     - General Public Points: 0, 500, 700, or 1000
     - **Total Points**: sum of all categories

7. **Declaration Checkbox**
   - Required checkbox: "I hereby declare the above information is true to the best of my knowledge"
   - Form cannot be submitted without checking this
   - Submit button is disabled until declaration is checked

#### Features
- **AI Description Generator**: Simulates AI-generated description (can be integrated with actual AI API)
- **Real-time Point Calculation**: All points update automatically as user fills the form
- **Form Validation**: Required fields, file size limits, and conditional requirements
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Modern UI**: Consistent with existing forms (ClubServiceForm, CommunityServiceForm)

### 3. Backend API Updates (`backend/clubs/views.py`)

#### Updated `create_project` Function
Added handling for Professional Service specific fields:
```python
# Professional Service specific fields
mahadhan_project=data.get('mahadhanProject', False),
general_public_100_300=data.get('generalPublicAttendance') == '100-300',
general_public_500_plus=data.get('generalPublicAttendance') == '500+',
general_public_1000_plus=data.get('generalPublicAttendance') == '1000+',
```

Updated response to include new point fields:
```python
'mahadhanPoints': project.mahadhan_points,
'generalPublicPoints': project.general_public_points,
```

### 4. Frontend Integration (`Reporting.tsx`)

#### Added Import
```typescript
import ProfessionalServiceForm from './ProfessionalServiceForm';
```

#### Updated Category Mapping
Added Professional Service category mapping in `handleFormSubmit`:
```typescript
category: selectedCategory === 'Professional Service Avenue' ? 'professional_service' : ...
```

#### Added Form Rendering
Added Professional Service form rendering in `renderCategoryForm`:
```typescript
if (selectedCategory === 'Professional Service Avenue') {
  return <ProfessionalServiceForm selectedMonth={selectedMonth} onBack={handleBackToCategories} onSubmit={handleFormSubmit} />;
}
```

#### Updated Submission Data
Added Professional Service specific fields to submission data:
```typescript
mahadhanProject: projectData.mahadhanProject || false,
generalPublicAttendance: projectData.generalPublicAttendance || '',
mahadhanPoints: projectData.mahadhanPoints || 0,
generalPublicPoints: projectData.generalPublicPoints || 0,
```

### 5. Database Migration

Created migration file: `backend/clubs/migrations/0006_add_professional_service_fields.py`

Migration includes:
- Add field `general_public_1000_plus` to project
- Add field `general_public_100_300` to project
- Add field `general_public_500_plus` to project
- Add field `general_public_points` to project
- Add field `mahadhan_points` to project
- Add field `mahadhan_project` to project
- Alter field `category` on project (to include professional_service)

Migration successfully applied to database.

## Point System Summary

### Base Points
- **Professional Service Project**: 500 points (awarded when admin approves)

### Attendance Points (Auto-calculated)
- **Club Rotaractors**: 200 points per person
- **Rotarians**: 300 points per person
- **Interactors**: 100 points per person
- **Visiting Rotaractors**: No points
- **Others**: No points

### News Coverage Points
- **News Publication**: 100 points (when toggle is ON)
- **News Telecasting**: 300 points (when toggle is ON)

### Additional Points (Checkboxes)
- **Women Empowerment**: 400 points
- **Organizing Mahadhan Project**: 700 points

### General Public Attendance (Radio Buttons - Only One)
- **100 to 300 attendees**: 500 points
- **Above 500 attendees**: 700 points
- **Above 1000 attendees**: 1000 points

### Maximum Possible Points
Base (500) + Attendance (unlimited) + News (400) + Women Empowerment (400) + Mahadhan (700) + General Public (1000) = **3000+ points**

## Workflow

1. **Club Submission**
   - Club selects "Professional Service Avenue" from project categories
   - Fills out the comprehensive form with all required fields
   - Checks declaration checkbox
   - Submits form for admin approval
   - Status: "Pending"

2. **Admin Review**
   - Admin reviews the submitted project
   - Can approve or reject with reason
   - Status changes to "Approved" or "Rejected"

3. **Points Award**
   - Points are calculated automatically based on form inputs
   - Points are awarded only when admin approves the project
   - Points are added to club's total points

## Data Storage

All data is stored in the `clubs_project` table with the following key fields:
- Basic project information (name, date, venue, chair, description)
- Community capital, lives touched, service hours
- Attendance breakdown by category
- Photo data (stored as JSON)
- News coverage information
- Boolean flags for special categories (women empowerment, mahadhan)
- General public attendance tier selection
- Calculated points breakdown
- Status and approval metadata

## Testing Checklist

- [x] Database model updated with new fields
- [x] Database migration created and applied
- [x] Frontend form component created with all required fields
- [x] Form validation working (required fields, file size limits)
- [x] Point calculation logic implemented correctly
- [x] Backend API updated to handle new fields
- [x] Form integrated into Reporting component
- [x] Declaration checkbox prevents submission when unchecked
- [x] AI description generator button functional
- [x] Photo upload with size validation working
- [x] News coverage toggles working correctly
- [x] General public attendance radio buttons working (only one selectable)
- [x] Points summary displays all categories correctly

## Future Enhancements

1. **AI Integration**: Connect the "Rewrite by AI" button to an actual AI API (OpenAI, Claude, etc.)
2. **Photo Preview**: Add image preview before upload
3. **Edit Functionality**: Allow clubs to edit pending projects
4. **Bulk Upload**: Allow uploading multiple projects at once
5. **Export Reports**: Generate PDF reports of submitted projects
6. **Analytics Dashboard**: Show statistics on Professional Service projects

## Notes

- The form follows the same design pattern as ClubServiceForm and CommunityServiceForm for consistency
- All point calculations happen automatically in the backend model's `save()` method
- The general public attendance is mutually exclusive (radio buttons) as per requirements
- File size validation happens on the frontend before submission
- The form is fully responsive and works on all device sizes
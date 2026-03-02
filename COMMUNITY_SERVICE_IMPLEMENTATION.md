# Community Service Avenue - Implementation Documentation

## Overview
This document describes the implementation of the Community Service project category with all required features including form fields, point system, news coverage, and women empowerment tracking.

## Features Implemented

### 1. Form Fields

#### Basic Information
- **Date** (required): Project date
- **Venue** (required): Location of the project
- **Project Name** (required): Name of the project
- **Project Chair** (required): Name of the project chair
- **Description** (required, ~100 words): Detailed project description with AI rewrite option

#### Community Service Specific Fields
- **Community Capital Deployed** (required): Amount invested in the project
- **Lives Touched** (required): Number of beneficiaries (placeholder: "Number of beneficiaries")
- **Service Hours** (required): Total hours invested (placeholder: "Mention invested hours")

#### Attendance Tracking
Checkboxes with auto-calculated counts and points:
- **Club Rotaractors**: 200 points per person
- **Visiting Rotaractors**: No points
- **Rotarians**: 300 points per person
- **Interactors**: 100 points per person
- **Others**: No points
- **Total Attendance**: Auto-calculated sum

#### Photo Upload
- Maximum 5 photos allowed
- Total size limit: 1MB for all photos combined
- Error message displayed if limits exceeded
- Validation before submission

#### News Coverage (Optional)
Two toggle sections:

**News Publication** (+100 points)
- Toggle button to enable/disable
- When enabled:
  - Upload news article image (1 image max, ≤1MB)
  - Paste news link (placeholder: "Paste the link of news report (if you have offline video format then upload it on club's social media and paste the link)")

**News Telecasting** (+300 points)
- Toggle button to enable/disable
- When enabled:
  - Paste telecasting link (placeholder: "Paste the link of news report (if you have offline video format then upload it on club's social media and paste the link)")

#### Women Empowerment
- Checkbox for women empowerment projects
- Awards 400 points when checked

#### Declaration
- Required checkbox: "I hereby declare the above information is true to the best of my knowledge"
- Form cannot be submitted without checking this
- Submission awaits admin approval

### 2. Point System

#### Base Points
- **500 points** for each Community Service project (when admin approves)

#### Attendance Points
- Club Rotaractors: 200 points × count
- Rotarians: 300 points × count
- Interactors: 100 points × count
- Visiting Rotaractors: 0 points
- Others: 0 points

#### News Coverage Points
- News Publication: +100 points (when enabled)
- News Telecasting: +300 points (when enabled)

#### Women Empowerment Points
- Women Empowerment: +400 points (when checked)

#### Total Points Calculation
```
Total = Base (500) + Attendance Points + News Points + Women Empowerment Points
```

### 3. AI Description Generator
- Button: "Rewrite by AI"
- Generates ~100 word description automatically
- Uses project details (date, venue, chair, capital, lives touched, service hours)
- Loading state with spinner during generation
- Can be triggered multiple times to regenerate

### 4. Data Storage

#### Database Schema (Project Model)
New fields added to the Project model:

```python
# Community Service specific
community_capital_deployed = CharField(max_length=50, default='0')
lives_touched = IntegerField(default=0)
service_hours = IntegerField(default=0)

# News coverage
news_publication_enabled = BooleanField(default=False)
news_publication_image = TextField(blank=True)  # Base64 or file path
news_publication_link = URLField(blank=True)
news_telecasting_enabled = BooleanField(default=False)
news_telecasting_link = URLField(blank=True)

# Women empowerment
women_empowerment = BooleanField(default=False)

# Points breakdown
news_points = IntegerField(default=0)
women_empowerment_points = IntegerField(default=0)
```

#### Point Calculation Logic
Points are automatically calculated in the model's `save()` method:

```python
def save(self, *args, **kwargs):
    # Calculate attendance points
    self.attendance_points = (
        (self.club_rotaractors * 200) +
        (self.rotarians * 300) +
        (self.interactors * 100)
    )
    
    # Calculate news points
    self.news_points = 0
    if self.news_publication_enabled:
        self.news_points += 100
    if self.news_telecasting_enabled:
        self.news_points += 300
    
    # Calculate women empowerment points
    self.women_empowerment_points = 400 if self.women_empowerment else 0
    
    # Set base points based on category
    if self.category == 'community_service':
        self.base_points = 500
    
    # Calculate total points
    self.total_points = (
        self.base_points + 
        self.attendance_points + 
        self.additional_points + 
        self.news_points + 
        self.women_empowerment_points
    )
    
    super().save(*args, **kwargs)
```

### 5. API Endpoints

#### Create Community Service Project
**Endpoint**: `POST /api/projects/create/`

**Request Body**:
```json
{
  "clubId": "string",
  "category": "community_service",
  "projectName": "string",
  "date": "YYYY-MM-DD",
  "venue": "string",
  "projectChair": "string",
  "description": "string",
  "communityCapitalDeployed": "string",
  "livesTouched": number,
  "serviceHours": number,
  "attendance": {
    "clubRotaractors": number,
    "visitingRotaractors": number,
    "rotarians": number,
    "interactors": number,
    "others": number
  },
  "photos": ["base64_string"],
  "newsPublicationEnabled": boolean,
  "newsPublicationImage": "base64_string",
  "newsPublicationLink": "url",
  "newsTelecastingEnabled": boolean,
  "newsTelecastingLink": "url",
  "womenEmpowerment": boolean,
  "month": "string",
  "year": number
}
```

**Response**:
```json
{
  "success": true,
  "id": "string",
  "totalPoints": number,
  "attendancePoints": number,
  "newsPoints": number,
  "womenEmpowermentPoints": number,
  "totalAttendance": number
}
```

#### Get Projects
**Endpoint**: `GET /api/projects/{club_id}/?month=&year=`

Returns all projects with Community Service specific fields included.

### 6. Frontend Component

**File**: `CommunityServiceForm.tsx`

**Key Features**:
- Responsive design with Tailwind CSS
- Real-time point calculation display
- Form validation
- File upload with size checking
- Toggle switches for news coverage
- Auto-calculated attendance totals
- Declaration checkbox requirement
- Submit and Cancel buttons

**Props**:
```typescript
interface CommunityServiceFormProps {
  selectedMonth: { name: string; year: number };
  onBack: () => void;
  onSubmit: (data: any) => void;
}
```

### 7. Validation Rules

1. **Required Fields**: All fields marked with * must be filled
2. **Photo Upload**: 
   - Maximum 5 photos
   - Total size ≤ 1MB
   - Error message if exceeded
3. **News Image**: 
   - Maximum 1 image
   - Size ≤ 1MB
   - Required when news publication is enabled
4. **News Links**: Required when respective toggles are enabled
5. **Declaration**: Must be checked to enable submit button

### 8. User Flow

1. Club selects "Community Service Avenue" category
2. Fills in all required fields
3. Optionally enables news coverage toggles
4. Optionally checks women empowerment
5. Reviews point summary
6. Checks declaration checkbox
7. Submits form for admin approval
8. Receives notification when approved/rejected
9. Points are added to club total upon approval

### 9. Admin Approval Process

1. Admin views pending Community Service projects
2. Reviews all submitted information including:
   - Project details
   - Photos
   - News coverage (if applicable)
   - Attendance breakdown
   - Point calculation
3. Approves or rejects with reason
4. Upon approval:
   - Points are added to club's total
   - Notification sent to club
   - Project status updated to "approved"

### 10. Points Summary Display

The form shows a real-time breakdown:
- **Base Points**: 500 (fixed)
- **Attendance Points**: Calculated based on attendance
- **News Coverage**: 0-400 (100 for publication + 300 for telecasting)
- **Women Empowerment**: 0 or 400
- **Total Points**: Sum of all above

## Files Modified/Created

### Backend
1. `backend/clubs/models.py` - Updated Project model
2. `backend/clubs/views.py` - Updated create_project and get_projects
3. `backend/clubs/migrations/0005_community_service_fields.py` - New migration

### Frontend
1. `CommunityServiceForm.tsx` - New component (created)
2. `ClubDashboard.tsx` - To be updated for integration

## Testing Checklist

- [ ] Form renders correctly with all fields
- [ ] AI description generation works
- [ ] Photo upload validation (5 max, 1MB total)
- [ ] News image upload validation (1 max, 1MB)
- [ ] Attendance auto-calculation works
- [ ] Point calculation is accurate
- [ ] Toggle switches work for news coverage
- [ ] Women empowerment checkbox works
- [ ] Declaration checkbox enables/disables submit
- [ ] Form submission sends correct data
- [ ] Backend stores all fields correctly
- [ ] Admin can approve/reject projects
- [ ] Points are added upon approval
- [ ] Notifications are sent correctly

## Future Enhancements

1. Image compression before upload
2. Drag-and-drop photo upload
3. Preview uploaded photos
4. Rich text editor for description
5. Auto-save draft functionality
6. Export project reports
7. Analytics dashboard for Community Service impact

## Notes

- All monetary values are stored as strings to preserve formatting
- Photos are stored as base64 strings or file paths
- News images are stored separately from project photos
- Point calculation happens automatically on save
- Status flow: draft → pending → approved/rejected
- Only approved projects contribute to club's total points
from django.db import models
import uuid


class Officer(models.Model):
    name = models.CharField(max_length=200, blank=True, default='')
    photo_url = models.URLField(blank=True, default='')


class ClubMetrics(models.Model):
    community_capital = models.CharField(max_length=50, default='0')
    service_hours = models.CharField(max_length=50, default='0')
    lives_touched = models.CharField(max_length=50, default='0')
    rotaracters_in_action = models.CharField(max_length=50, default='0')
    total_points = models.CharField(max_length=50, default='0')


class Invoice(models.Model):
    name = models.CharField(max_length=200)
    url = models.URLField()
    date = models.DateField()


class Member(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default='')
    club = models.ForeignKey('Club', on_delete=models.CASCADE, related_name='club_members')
    name = models.CharField(max_length=200)
    ri_id = models.CharField(max_length=50, default='TBD')
    designation = models.CharField(max_length=100, default='Member')
    email = models.EmailField(blank=True, default='')
    phone = models.CharField(max_length=20, blank=True, default='')
    joined_date = models.DateField(null=True, blank=True)
    occupation = models.CharField(max_length=100, blank=True, default='')
    blood_group = models.CharField(max_length=10, blank=True, default='')
    gender = models.CharField(max_length=20, blank=True, default='')
    status = models.CharField(max_length=20, default='Active')
    dues_status = models.CharField(max_length=20, default='Pending')
    district_dues_verified = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        ordering = ['designation', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.club.name}"
    
    def save(self, *args, **kwargs):
        if not self.id:
            self.id = uuid.uuid4().hex[:9]
        super().save(*args, **kwargs)


class Club(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default='')
    name = models.CharField(max_length=200)
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=100)
    zone = models.CharField(max_length=50, default='Zone 1')
    charter_date = models.DateField(null=True, blank=True)
    sponsored_by = models.CharField(max_length=200, blank=True, default='')
    charter_no = models.CharField(max_length=50, blank=True, default='')
    club_id = models.CharField(max_length=50, blank=True, default='')
    logo_url = models.URLField(blank=True, default='')
    status = models.CharField(max_length=20, default='active')
    is_roster_locked = models.BooleanField(default=False)
    district_payment_date = models.DateField(null=True, blank=True)
    
    # Officers as JSON fields stored in related models would be complex
    # Using TextField for JSON serialization
    officers_json = models.TextField(default='{}')
    members_json = models.TextField(default='[]')
    invoices_json = models.TextField(default='[]')
    metrics_json = models.TextField(default='{}')
    
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = uuid.uuid4().hex[:9]
        super().save(*args, **kwargs)


class Notification(models.Model):
    id = models.CharField(max_length=50, primary_key=True, default='')
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    type = models.CharField(max_length=50, default='info')  # info, warning, success, error
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.club.name}"
    
    def save(self, *args, **kwargs):
        if not self.id:
            self.id = uuid.uuid4().hex[:9]
class Meeting(models.Model):
    MEETING_TYPE_CHOICES = [
        ('GBM', 'General Body Meeting'),
        ('BOD', 'Board Of Directors Meeting'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.CharField(max_length=50, primary_key=True, default='')
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='meetings')
    meeting_type = models.CharField(max_length=3, choices=MEETING_TYPE_CHOICES)
    meeting_number = models.CharField(max_length=50)
    date = models.DateField()
    venue = models.CharField(max_length=200)
    brief_info = models.TextField()
    
    # Attendance details
    club_rotaractors = models.IntegerField(default=0)
    visiting_rotaractors = models.IntegerField(default=0)
    rotarians = models.IntegerField(default=0)
    interactors = models.IntegerField(default=0)
    others = models.IntegerField(default=0)
    total_attendance = models.IntegerField(default=0)
    
    # Photos stored as JSON array of file paths
    photos_json = models.TextField(default='[]')
    
    # Points and status
    points = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Metadata
    month = models.CharField(max_length=20, default='January')  # e.g., "August"
    year = models.IntegerField(default=2026)  # e.g., 2026
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.CharField(max_length=100, blank=True, default='')
    rejection_reason = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
        unique_together = ['club', 'meeting_number', 'month', 'year']
    
    def __str__(self):
        return f"{self.club.name} - {self.get_meeting_type_display()} - {self.meeting_number}"
    
    def save(self, *args, **kwargs):
        if not self.id:
            self.id = uuid.uuid4().hex[:9]
        
        # Calculate total attendance
        self.total_attendance = (
            self.club_rotaractors + 
            self.visiting_rotaractors + 
            self.rotarians + 
            self.interactors + 
            self.others
        )
        
        # Calculate points based on meeting type if not already set
        if self.points == 0 and self.status in ['draft', 'submitted', 'pending']:
            # Check if within deadline (10 days after month end)
            from datetime import datetime
            month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December']
            month_index = month_names.index(self.month)
            
            # Get last day of the month
            if month_index == 11:  # December
                last_day = datetime(self.year + 1, 1, 1)
            else:
                last_day = datetime(self.year, month_index + 2, 1)
            
            from datetime import timedelta
            deadline = last_day + timedelta(days=10)
            
            if datetime.now() <= deadline:
                self.points = 200 if self.meeting_type == 'GBM' else 100
        
        super().save(*args, **kwargs)
        super().save(*args, **kwargs)


class Project(models.Model):
    PROJECT_CATEGORY_CHOICES = [
        ('club_service', 'Club Service Avenue'),
        ('community_service', 'Community Service Avenue'),
        ('professional_service', 'Professional Service Avenue'),
        ('professional_development', 'Professional Development Avenue'),
        ('international_service', 'International Service Avenue'),
        ('sports_wellness', 'Sports and Wellness Avenue'),
        ('environment', 'Environment Avenue'),
        ('dmo', 'Designated Monthly Observation'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.CharField(max_length=50, primary_key=True, default='')
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='projects')
    category = models.CharField(max_length=50, choices=PROJECT_CATEGORY_CHOICES)
    project_name = models.CharField(max_length=200)
    date = models.DateField()
    venue = models.CharField(max_length=200)
    project_chair = models.CharField(max_length=200)
    description = models.TextField()
    
    # Community Service specific fields
    community_capital_deployed = models.CharField(max_length=50, blank=True, default='0')
    lives_touched = models.IntegerField(default=0)
    service_hours = models.IntegerField(default=0)
    
    # Attendance details
    club_rotaractors = models.IntegerField(default=0)
    visiting_rotaractors = models.IntegerField(default=0)
    rotarians = models.IntegerField(default=0)
    interactors = models.IntegerField(default=0)
    others = models.IntegerField(default=0)
    total_attendance = models.IntegerField(default=0)
    
    # Additional points (stored as JSON array of selected checkboxes)
    additional_points_json = models.TextField(default='[]')
    
    # Photos stored as JSON array of base64 strings or file paths
    photos_json = models.TextField(default='[]')
    
    # News publication and telecasting
    news_publication_enabled = models.BooleanField(default=False)
    news_publication_image = models.TextField(blank=True, default='')  # Base64 or file path
    news_publication_link = models.URLField(blank=True, default='')
    news_telecasting_enabled = models.BooleanField(default=False)
    news_telecasting_link = models.URLField(blank=True, default='')
    
    # Women empowerment checkbox
    women_empowerment = models.BooleanField(default=False)
    
    # Professional Service specific checkboxes
    mahadhan_project = models.BooleanField(default=False)
    general_public_100_300 = models.BooleanField(default=False)
    general_public_500_plus = models.BooleanField(default=False)
    general_public_1000_plus = models.BooleanField(default=False)
    
    # DMO specific checkboxes
    organizing_club_service = models.BooleanField(default=False)
    organizing_community_service = models.BooleanField(default=False)
    organizing_professional_service = models.BooleanField(default=False)
    organizing_international_service = models.BooleanField(default=False)
    
    # Points and status
    base_points = models.IntegerField(default=200)
    attendance_points = models.IntegerField(default=0)
    additional_points = models.IntegerField(default=0)
    news_points = models.IntegerField(default=0)
    women_empowerment_points = models.IntegerField(default=0)
    mahadhan_points = models.IntegerField(default=0)
    general_public_points = models.IntegerField(default=0)
    category_points = models.IntegerField(default=0)
    total_points = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Metadata
    month = models.CharField(max_length=20, default='January')
    year = models.IntegerField(default=2026)
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.CharField(max_length=100, blank=True, default='')
    rejection_reason = models.TextField(blank=True, default='')
    
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    
    class Meta:
        ordering = ['-date', '-created_at']
    
    def __str__(self):
        return f"{self.club.name} - {self.project_name}"
    
    def save(self, *args, **kwargs):
        if not self.id:
            self.id = uuid.uuid4().hex[:9]
        
        # Calculate total attendance
        self.total_attendance = (
            self.club_rotaractors +
            self.visiting_rotaractors +
            self.rotarians +
            self.interactors +
            self.others
        )
        
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
        
        # Calculate mahadhan project points
        self.mahadhan_points = 700 if self.mahadhan_project else 0
        
        # Calculate general public attendance points (only one can be selected)
        self.general_public_points = 0
        if self.general_public_1000_plus:
            self.general_public_points = 1000
        elif self.general_public_500_plus:
            self.general_public_points = 700
        elif self.general_public_100_300:
            self.general_public_points = 500
        
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
        
        # Set base points based on category
        if self.category == 'community_service':
            self.base_points = 500
        elif self.category == 'professional_service':
            self.base_points = 500
        elif self.category == 'club_service':
            self.base_points = 200
        elif self.category == 'dmo':
            self.base_points = 800
        else:
            self.base_points = 200
        
        # Calculate total points
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
        
        super().save(*args, **kwargs)

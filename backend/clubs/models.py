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

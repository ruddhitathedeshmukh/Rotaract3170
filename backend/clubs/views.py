from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
import json
import re
import uuid
from .models import Club, Notification, Member


def parse_json_field(field_value, default=None):
    """Parse JSON string or return default"""
    if not field_value:
        return default
    try:
        if isinstance(field_value, str):
            return json.loads(field_value)
        return field_value
    except (json.JSONDecodeError, ValueError):
        return default


@require_http_methods(["GET"])
def get_all_clubs(request):
    """Get all clubs from database with their members"""
    try:
        clubs = Club.objects.all()
        result = []
        for club in clubs:
            # Get members from database
            members = Member.objects.filter(club=club)
            members_list = []
            for member in members:
                members_list.append({
                    'id': member.id,
                    'name': member.name,
                    'riId': member.ri_id,
                    'designation': member.designation,
                    'email': member.email,
                    'phone': member.phone,
                    'joinedDate': str(member.joined_date) if member.joined_date else '',
                    'occupation': member.occupation,
                    'bloodGroup': member.blood_group,
                    'gender': member.gender,
                    'status': member.status,
                    'duesStatus': member.dues_status,
                    'districtDuesVerified': member.district_dues_verified,
                    'isLocked': member.is_locked
                })
            
            result.append({
                'id': club.id,
                'name': club.name,
                'username': club.username,
                'password': club.password,
                'zone': club.zone,
                'charterDate': str(club.charter_date) if club.charter_date else '',
                'sponsoredBy': club.sponsored_by,
                'charterNo': club.charter_no,
                'clubId': club.club_id,
                'logoUrl': club.logo_url,
                'status': club.status,
                'isRosterLocked': club.is_roster_locked,
                'districtPaymentDate': str(club.district_payment_date) if club.district_payment_date else '',
                'officers': parse_json_field(club.officers_json, {
                    'president': {'name': '', 'photoUrl': ''},
                    'secretary': {'name': '', 'photoUrl': ''},
                    'treasurer': {'name': '', 'photoUrl': ''},
                    'vicePresident': {'name': '', 'photoUrl': ''},
                    'rcc': {'name': '', 'photoUrl': ''}
                }),
                'members': members_list,  # Members from database
                'invoices': parse_json_field(club.invoices_json, []),
                'metrics': parse_json_field(club.metrics_json, {
                    'communityCapital': '0',
                    'serviceHours': '0',
                    'livesTouched': '0',
                    'rotaractersInAction': '0',
                    'totalPoints': '0'
                }),
            })
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def save_club(request):
    """Save a single club (create or update) with members"""
    try:
        data = json.loads(request.body)
        
        # Clean metrics
        metrics = data.get('metrics', {})
        if isinstance(metrics, dict):
            metrics['communityCapital'] = re.sub(r'[₹,]', '', str(metrics.get('communityCapital', '0')))
            metrics['totalPoints'] = re.sub(r'[,]', '', str(metrics.get('totalPoints', '0')))
        
        club_id = data.get('id')
        members_data = data.get('members', [])
        
        if club_id:
            try:
                club = Club.objects.get(id=club_id)
                club.name = data.get('name', club.name)
                club.username = data.get('username', club.username)
                club.password = data.get('password', club.password)
                club.zone = data.get('zone', club.zone)
                club.sponsored_by = data.get('sponsoredBy', club.sponsored_by)
                club.charter_no = data.get('charterNo', club.charter_no)
                club.club_id = data.get('clubId', club.club_id)
                club.logo_url = data.get('logoUrl', club.logo_url)
                club.status = data.get('status', club.status)
                club.is_roster_locked = data.get('isRosterLocked', club.is_roster_locked)
                club.officers_json = json.dumps(data.get('officers', {}))
                club.invoices_json = json.dumps(data.get('invoices', []))
                club.metrics_json = json.dumps(metrics)
            except Club.DoesNotExist:
                club = Club(
                    id=club_id,
                    name=data.get('name', ''),
                    username=data.get('username', ''),
                    password=data.get('password', ''),
                    zone=data.get('zone', 'Zone 1'),
                    sponsored_by=data.get('sponsoredBy', ''),
                    charter_no=data.get('charterNo', ''),
                    club_id=data.get('clubId', ''),
                    logo_url=data.get('logoUrl', ''),
                    status=data.get('status', 'active'),
                    is_roster_locked=data.get('isRosterLocked', False),
                    officers_json=json.dumps(data.get('officers', {})),
                    invoices_json=json.dumps(data.get('invoices', [])),
                    metrics_json=json.dumps(metrics),
                )
        else:
            # Create new club
            club_id = uuid.uuid4().hex[:9]
            club = Club(
                id=club_id,
                name=data.get('name', ''),
                username=data.get('username', ''),
                password=data.get('password', ''),
                zone=data.get('zone', 'Zone 1'),
                sponsored_by=data.get('sponsoredBy', ''),
                charter_no=data.get('charterNo', ''),
                club_id=data.get('clubId', ''),
                logo_url=data.get('logoUrl', ''),
                status=data.get('status', 'active'),
                is_roster_locked=data.get('isRosterLocked', False),
                officers_json=json.dumps(data.get('officers', {})),
                invoices_json=json.dumps(data.get('invoices', [])),
                metrics_json=json.dumps(metrics),
            )
        
        # Handle charter date
        if data.get('charterDate'):
            try:
                club.charter_date = data['charterDate']
            except (ValueError, KeyError):
                pass
        
        if data.get('districtPaymentDate'):
            try:
                club.district_payment_date = data['districtPaymentDate']
            except (ValueError, KeyError):
                pass
        
        club.save()
        
        # Save members to database
        if members_data:
            # Delete existing members for this club
            Member.objects.filter(club=club).delete()
            
            # Create new members
            for member_data in members_data:
                joined_date = member_data.get('joinedDate')
                if joined_date == '':
                    joined_date = None
                    
                Member.objects.create(
                    id=member_data.get('id') or uuid.uuid4().hex[:9],
                    club=club,
                    name=member_data.get('name', ''),
                    ri_id=member_data.get('riId', 'TBD'),
                    designation=member_data.get('designation', 'Member'),
                    email=member_data.get('email', ''),
                    phone=member_data.get('phone', ''),
                    joined_date=joined_date,
                    occupation=member_data.get('occupation', ''),
                    blood_group=member_data.get('bloodGroup', ''),
                    gender=member_data.get('gender', ''),
                    status=member_data.get('status', 'Active'),
                    dues_status=member_data.get('duesStatus', 'Pending'),
                    district_dues_verified=member_data.get('districtDuesVerified', False),
                    is_locked=member_data.get('isLocked', False)
                )
        
        return JsonResponse({'success': True, 'id': club.id})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def bulk_add_clubs(request):
    """Bulk add multiple clubs"""
    try:
        data = json.loads(request.body)
        if not isinstance(data, list):
            return JsonResponse({'error': 'Expected a list of clubs'}, status=400)
        
        created_count = 0
        errors = []
        
        for club_data in data:
            try:
                # Clean metrics
                metrics = club_data.get('metrics', {})
                if isinstance(metrics, dict):
                    metrics['communityCapital'] = re.sub(r'[₹,]', '', str(metrics.get('communityCapital', '0')))
                    metrics['totalPoints'] = re.sub(r'[,]', '',str(metrics.get('totalPoints', '0')))
                
                club_id = club_data.get('id') or uuid.uuid4().hex[:9]
                
                # Check if club with same username exists
                existing_club = Club.objects.filter(username=club_data.get('username')).first()
                if existing_club:
                    errors.append(f"Club with username '{club_data.get('username')}' already exists")
                    continue
                
                # Handle charter date - convert to YYYY-MM-DD format
                charter_date = club_data.get('charterDate')
                if charter_date and charter_date != '':
                    # Try to parse different date formats
                    try:
                        from datetime import datetime
                        # Try MM/DD/YYYY format first
                        if '/' in charter_date:
                            parts = charter_date.split('/')
                            if len(parts) == 3:
                                month, day, year = parts
                                charter_date = f"{year}-{month.zfill(2)}-{day.zfill(2)}"
                    except:
                        charter_date = None
                else:
                    charter_date = None
                
                club = Club(
                    id=club_id,
                    name=club_data.get('name', 'New Club'),
                    username=club_data.get('username', ''),
                    password=club_data.get('password', '123456'),
                    zone=club_data.get('zone', 'Zone 1'),
                    charter_date=charter_date,
                    sponsored_by=club_data.get('sponsoredBy', ''),
                    charter_no=club_data.get('charterNo', ''),
                    club_id=club_data.get('clubId', ''),
                    logo_url=club_data.get('logoUrl', ''),
                    status=club_data.get('status', 'active'),
                    is_roster_locked=club_data.get('isRosterLocked', False),
                    officers_json=json.dumps(club_data.get('officers', {})),
                    members_json=json.dumps(club_data.get('members', [])),
                    invoices_json=json.dumps(club_data.get('invoices', [])),
                    metrics_json=json.dumps(metrics),
                )
                club.save()
                created_count += 1
            except Exception as e:
                errors.append(f"Error creating club '{club_data.get('name', 'Unknown')}': {str(e)}")
                print(f"DEBUG: Error creating club: {str(e)}")  # Add debug logging
        
        return JsonResponse({
            'success': True, 
            'created': created_count,
            'errors': errors
        })
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_club(request, club_id):
    """Delete a club"""
    try:
        club = Club.objects.get(id=club_id)
        club.delete()
        return JsonResponse({'success': True})
    except Club.DoesNotExist:
        return JsonResponse({'error': 'Club not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """Login endpoint"""
    try:
        data = json.loads(request.body)
        username = data.get('username', '')
        password = data.get('password', '')
        
        # Admin check
        if username == 'admin' and password == 'admin123':
            return JsonResponse({
                'id': 'admin',
                'username': 'admin',
                'role': 'ADMIN'
            })
        
        # Club login
        try:
            club = Club.objects.get(username=username, password=password)
            return JsonResponse({
                'id': club.id,
                'username': club.username,
                'role': 'CLUB',
                'clubData': {
                    'id': club.id,
                    'name': club.name,
                    'username': club.username,
                    'zone': club.zone,
                    'clubId': club.club_id,
                    'logoUrl': club.logo_url,
                    'status': club.status,
                    'isRosterLocked': club.is_roster_locked,
                    'officers': parse_json_field(club.officers_json),
                    'members': parse_json_field(club.members_json),
                    'invoices': parse_json_field(club.invoices_json),
                    'metrics': parse_json_field(club.metrics_json),
                }
            })
        except Club.DoesNotExist:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def get_notifications(request, club_id):
    """Get all notifications for a club"""
    try:
        notifications = Notification.objects.filter(club_id=club_id)
        result = []
        for notif in notifications:
            result.append({
                'id': notif.id,
                'title': notif.title,
                'message': notif.message,
                'type': notif.type,
                'isRead': notif.is_read,
                'createdAt': notif.created_at.isoformat()
            })
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def mark_notification_read(request, notification_id):
    """Mark a notification as read"""
    try:
        notification = Notification.objects.get(id=notification_id)
        notification.is_read = True
        notification.save()
        return JsonResponse({'success': True})
    except Notification.DoesNotExist:
        return JsonResponse({'error': 'Notification not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_notification(request):
    """Create a new notification (admin only)"""
    try:
        data = json.loads(request.body)
        club_id = data.get('clubId')
        title = data.get('title')
        message = data.get('message')
        notif_type = data.get('type', 'info')
        
        if not club_id or not title or not message:
            return JsonResponse({'error': 'Missing required fields'}, status=400)
        
        try:
            club = Club.objects.get(id=club_id)
        except Club.DoesNotExist:
            return JsonResponse({'error': 'Club not found'}, status=404)
        
        notification = Notification(
            club=club,
            title=title,
            message=message,
            type=notif_type
        )
        notification.save()
        
        return JsonResponse({'success': True, 'id': notification.id})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


# Meeting endpoints
@require_http_methods(["GET"])
def get_meetings(request, club_id):
    """Get all meetings for a club, optionally filtered by month and year"""
    try:
        from .models import Meeting
        
        month = request.GET.get('month')
        year = request.GET.get('year')
        
        meetings = Meeting.objects.filter(club_id=club_id)
        
        if month:
            meetings = meetings.filter(month=month)
        if year:
            meetings = meetings.filter(year=int(year))
        
        result = []
        for meeting in meetings:
            result.append({
                'id': meeting.id,
                'meetingType': meeting.meeting_type,
                'meetingNumber': meeting.meeting_number,
                'date': str(meeting.date),
                'venue': meeting.venue,
                'briefInfo': meeting.brief_info,
                'attendance': {
                    'clubRotaractors': meeting.club_rotaractors,
                    'visitingRotaractors': meeting.visiting_rotaractors,
                    'rotarians': meeting.rotarians,
                    'interactors': meeting.interactors,
                    'others': meeting.others,
                },
                'totalAttendance': meeting.total_attendance,
                'photos': parse_json_field(meeting.photos_json, []),
                'points': meeting.points,
                'status': meeting.status,
                'month': meeting.month,
                'year': meeting.year,
                'submittedAt': meeting.submitted_at.isoformat(),
                'approvedAt': meeting.approved_at.isoformat() if meeting.approved_at else None,
                'approvedBy': meeting.approved_by,
                'rejectionReason': meeting.rejection_reason,
            })
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_meeting(request):
    """Create a new meeting"""
    try:
        from .models import Meeting
        
        data = json.loads(request.body)
        club_id = data.get('clubId')
        
        if not club_id:
            return JsonResponse({'error': 'Club ID is required'}, status=400)
        
        try:
            club = Club.objects.get(id=club_id)
        except Club.DoesNotExist:
            return JsonResponse({'error': 'Club not found'}, status=404)
        
        # Create meeting with 'submitted' status
        meeting = Meeting(
            club=club,
            meeting_type=data.get('meetingType'),
            meeting_number=data.get('meetingNumber'),
            date=data.get('date'),
            venue=data.get('venue'),
            brief_info=data.get('briefInfo'),
            club_rotaractors=data.get('attendance', {}).get('clubRotaractors', 0),
            visiting_rotaractors=data.get('attendance', {}).get('visitingRotaractors', 0),
            rotarians=data.get('attendance', {}).get('rotarians', 0),
            interactors=data.get('attendance', {}).get('interactors', 0),
            others=data.get('attendance', {}).get('others', 0),
            photos_json=json.dumps(data.get('photos', [])),
            month=data.get('month'),
            year=data.get('year'),
            status='submitted',
        )
        meeting.save()
        
        return JsonResponse({
            'success': True,
            'id': meeting.id,
            'points': meeting.points,
            'totalAttendance': meeting.total_attendance
        })
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def update_meeting(request, meeting_id):
    """Update an existing meeting"""
    try:
        from .models import Meeting
        
        data = json.loads(request.body)
        
        try:
            meeting = Meeting.objects.get(id=meeting_id)
        except Meeting.DoesNotExist:
            return JsonResponse({'error': 'Meeting not found'}, status=404)
        
        # Prevent updates when meeting is already submitted
        if meeting.status in ['submitted', 'pending']:
            return JsonResponse({'error': 'Cannot update meeting after submission. Contact admin for changes.'}, status=403)
        
        # Update fields
        meeting.meeting_type = data.get('meetingType', meeting.meeting_type)
        meeting.meeting_number = data.get('meetingNumber', meeting.meeting_number)
        meeting.date = data.get('date', meeting.date)
        meeting.venue = data.get('venue', meeting.venue)
        meeting.brief_info = data.get('briefInfo', meeting.brief_info)
        
        if 'attendance' in data:
            attendance = data['attendance']
            meeting.club_rotaractors = attendance.get('clubRotaractors', meeting.club_rotaractors)
            meeting.visiting_rotaractors = attendance.get('visitingRotaractors', meeting.visiting_rotaractors)
            meeting.rotarians = attendance.get('rotarians', meeting.rotarians)
            meeting.interactors = attendance.get('interactors', meeting.interactors)
            meeting.others = attendance.get('others', meeting.others)
        
        if 'photos' in data:
            meeting.photos_json = json.dumps(data['photos'])
        
        meeting.save()
        
        return JsonResponse({
            'success': True,
            'points': meeting.points,
            'totalAttendance': meeting.total_attendance
        })
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_meeting(request, meeting_id):
    """Delete a meeting"""
    try:
        from .models import Meeting
        
        meeting = Meeting.objects.get(id=meeting_id)
        
        # Prevent deletion when meeting is already submitted
        if meeting.status in ['submitted', 'pending']:
            return JsonResponse({'error': 'Cannot delete meeting after submission. Contact admin for changes.'}, status=403)
        
        meeting.delete()
        return JsonResponse({'success': True})
    except Meeting.DoesNotExist:
        return JsonResponse({'error': 'Meeting not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def approve_meeting(request, meeting_id):
    """Approve a meeting (admin only)"""
    try:
        from .models import Meeting
        from datetime import datetime
        
        data = json.loads(request.body)
        approved_by = data.get('approvedBy', 'admin')
        
        try:
            meeting = Meeting.objects.get(id=meeting_id)
        except Meeting.DoesNotExist:
            return JsonResponse({'error': 'Meeting not found'}, status=404)
        
        meeting.status = 'approved'
        meeting.approved_at = datetime.now()
        meeting.approved_by = approved_by
        meeting.save()
        
        # Update club's total points
        club = meeting.club
        metrics = parse_json_field(club.metrics_json, {})
        current_points = int(re.sub(r'[,]', '', str(metrics.get('totalPoints', '0'))))
        new_points = current_points + meeting.points
        metrics['totalPoints'] = str(new_points)
        club.metrics_json = json.dumps(metrics)
        club.save()
        
        # Create notification for the club
        notification = Notification(
            club=club,
            title='Meeting Approved',
            message=f'Your {meeting.get_meeting_type_display()} ({meeting.meeting_number}) has been approved. {meeting.points} points added to your club.',
            type='success'
        )
        notification.save()
        
        return JsonResponse({'success': True, 'points': meeting.points})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def reject_meeting(request, meeting_id):
    """Reject a meeting (admin only)"""
    try:
        from .models import Meeting
        
        data = json.loads(request.body)
        reason = data.get('reason', 'No reason provided')
        
        try:
            meeting = Meeting.objects.get(id=meeting_id)
        except Meeting.DoesNotExist:
            return JsonResponse({'error': 'Meeting not found'}, status=404)
        
        meeting.status = 'rejected'
        meeting.rejection_reason = reason
        meeting.save()
        
        # Create notification for the club
        notification = Notification(
            club=meeting.club,
            title='Meeting Rejected',
            message=f'Your {meeting.get_meeting_type_display()} ({meeting.meeting_number}) has been rejected. Reason: {reason}',
            type='error'
        )
        notification.save()
        
        return JsonResponse({'success': True})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def get_pending_meetings(request):
    """Get all submitted meetings for admin approval"""
    try:
        from .models import Meeting
        
        # Support both 'submitted' and 'pending' status for backward compatibility
        meetings = Meeting.objects.filter(status__in=['submitted', 'pending'])
        result = []
        
        for meeting in meetings:
            result.append({
                'id': meeting.id,
                'clubId': meeting.club.id,
                'clubName': meeting.club.name,
                'meetingType': meeting.meeting_type,
                'meetingNumber': meeting.meeting_number,
                'date': str(meeting.date),
                'venue': meeting.venue,
                'briefInfo': meeting.brief_info,
                'totalAttendance': meeting.total_attendance,
                'points': meeting.points,
                'month': meeting.month,
                'year': meeting.year,
                'submittedAt': meeting.submitted_at.isoformat(),
                'photos': parse_json_field(meeting.photos_json, []),
            })
        
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

# Project endpoints
@require_http_methods(["GET"])
def get_projects(request, club_id):
    """Get all projects for a club, optionally filtered by month and year"""
    try:
        from .models import Project
        
        month = request.GET.get('month')
        year = request.GET.get('year')
        
        projects = Project.objects.filter(club_id=club_id)
        
        if month:
            projects = projects.filter(month=month)
        if year:
            projects = projects.filter(year=int(year))
        
        result = []
        for project in projects:
            result.append({
                'id': project.id,
                'category': project.category,
                'projectName': project.project_name,
                'date': str(project.date),
                'venue': project.venue,
                'projectChair': project.project_chair,
                'description': project.description,
                # Community Service specific fields
                'communityCapitalDeployed': project.community_capital_deployed,
                'livesTouched': project.lives_touched,
                'serviceHours': project.service_hours,
                # Attendance
                'attendance': {
                    'clubRotaractors': project.club_rotaractors,
                    'visitingRotaractors': project.visiting_rotaractors,
                    'rotarians': project.rotarians,
                    'interactors': project.interactors,
                    'others': project.others,
                },
                'totalAttendance': project.total_attendance,
                # News coverage
                'newsPublicationEnabled': project.news_publication_enabled,
                'newsPublicationImage': project.news_publication_image,
                'newsPublicationLink': project.news_publication_link,
                'newsTelecastingEnabled': project.news_telecasting_enabled,
                'newsTelecastingLink': project.news_telecasting_link,
                # Women empowerment
                'womenEmpowerment': project.women_empowerment,
                # Professional Service specific fields
                'mahadhanProject': project.mahadhan_project,
                'generalPublic100To300': project.general_public_100_300,
                'generalPublic500Plus': project.general_public_500_plus,
                'generalPublic1000Plus': project.general_public_1000_plus,
                # Additional points
                'additionalPoints': parse_json_field(project.additional_points_json, []),
                'photos': parse_json_field(project.photos_json, []),
                # Points breakdown
                'basePoints': project.base_points,
                'attendancePoints': project.attendance_points,
                'additionalPointsValue': project.additional_points,
                'newsPoints': project.news_points,
                'womenEmpowermentPoints': project.women_empowerment_points,
                'mahadhanPoints': project.mahadhan_points,
                'generalPublicPoints': project.general_public_points,
                'totalPoints': project.total_points,
                # Status
                'status': project.status,
                'month': project.month,
                'year': project.year,
                'submittedAt': project.submitted_at.isoformat(),
                'approvedAt': project.approved_at.isoformat() if project.approved_at else None,
                'approvedBy': project.approved_by,
                'rejectionReason': project.rejection_reason,
            })
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_project(request):
    """Create a new project"""
    try:
        from .models import Project
        
        data = json.loads(request.body)
        club_id = data.get('clubId')
        
        if not club_id:
            return JsonResponse({'error': 'Club ID is required'}, status=400)
        
        try:
            club = Club.objects.get(id=club_id)
        except Club.DoesNotExist:
            return JsonResponse({'error': 'Club not found'}, status=404)
        
        # Create project with 'pending' status
        project = Project(
            club=club,
            category=data.get('category'),
            project_name=data.get('projectName'),
            date=data.get('date'),
            venue=data.get('venue'),
            project_chair=data.get('projectChair'),
            description=data.get('description'),
            # Community Service and Professional Service specific fields
            community_capital_deployed=data.get('communityCapitalDeployed', '0'),
            lives_touched=data.get('livesTouched', 0),
            service_hours=data.get('serviceHours', 0),
            # Attendance
            club_rotaractors=data.get('attendance', {}).get('clubRotaractors', 0),
            visiting_rotaractors=data.get('attendance', {}).get('visitingRotaractors', 0),
            rotarians=data.get('attendance', {}).get('rotarians', 0),
            interactors=data.get('attendance', {}).get('interactors', 0),
            others=data.get('attendance', {}).get('others', 0),
            # News coverage
            news_publication_enabled=data.get('newsPublicationEnabled', False),
            news_publication_image=data.get('newsPublicationImage', ''),
            news_publication_link=data.get('newsPublicationLink', ''),
            news_telecasting_enabled=data.get('newsTelecastingEnabled', False),
            news_telecasting_link=data.get('newsTelecastingLink', ''),
            # Women empowerment
            women_empowerment=data.get('womenEmpowerment', False),
            # Professional Service specific fields
            mahadhan_project=data.get('mahadhanProject', False),
            general_public_100_300=data.get('generalPublicAttendance') == '100-300',
            general_public_500_plus=data.get('generalPublicAttendance') == '500+',
            general_public_1000_plus=data.get('generalPublicAttendance') == '1000+',
            # Additional points
            additional_points_json=json.dumps(data.get('additionalPoints', [])),
            additional_points=data.get('additionalPointsValue', 0),
            # Photos
            photos_json=json.dumps(data.get('photos', [])),
            # Metadata
            month=data.get('month'),
            year=data.get('year'),
            status='pending',
        )
        project.save()
        
        return JsonResponse({
            'success': True,
            'id': project.id,
            'totalPoints': project.total_points,
            'attendancePoints': project.attendance_points,
            'newsPoints': project.news_points,
            'womenEmpowermentPoints': project.women_empowerment_points,
            'mahadhanPoints': project.mahadhan_points,
            'generalPublicPoints': project.general_public_points,
            'totalAttendance': project.total_attendance
        })
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["PUT"])
def update_project(request, project_id):
    """Update an existing project"""
    try:
        from .models import Project
        
        data = json.loads(request.body)
        
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return JsonResponse({'error': 'Project not found'}, status=404)
        
        # Prevent updates when project is already approved
        if project.status == 'approved':
            return JsonResponse({'error': 'Cannot update approved project. Contact admin for changes.'}, status=403)
        
        # Update fields
        project.category = data.get('category', project.category)
        project.project_name = data.get('projectName', project.project_name)
        project.date = data.get('date', project.date)
        project.venue = data.get('venue', project.venue)
        project.project_chair = data.get('projectChair', project.project_chair)
        project.description = data.get('description', project.description)
        
        if 'attendance' in data:
            attendance = data['attendance']
            project.club_rotaractors = attendance.get('clubRotaractors', project.club_rotaractors)
            project.visiting_rotaractors = attendance.get('visitingRotaractors', project.visiting_rotaractors)
            project.rotarians = attendance.get('rotarians', project.rotarians)
            project.interactors = attendance.get('interactors', project.interactors)
            project.others = attendance.get('others', project.others)
        
        if 'additionalPoints' in data:
            project.additional_points_json = json.dumps(data['additionalPoints'])
            project.additional_points = data.get('additionalPointsValue', 0)
        
        if 'photos' in data:
            project.photos_json = json.dumps(data['photos'])
        
        project.save()
        
        return JsonResponse({
            'success': True,
            'totalPoints': project.total_points,
            'totalAttendance': project.total_attendance
        })
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_project(request, project_id):
    """Delete a project"""
    try:
        from .models import Project
        
        project = Project.objects.get(id=project_id)
        
        # Prevent deletion when project is already approved
        if project.status == 'approved':
            return JsonResponse({'error': 'Cannot delete approved project. Contact admin for changes.'}, status=403)
        
        project.delete()
        return JsonResponse({'success': True})
    except Project.DoesNotExist:
        return JsonResponse({'error': 'Project not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def approve_project(request, project_id):
    """Approve a project (admin only)"""
    try:
        from .models import Project
        from datetime import datetime
        
        data = json.loads(request.body)
        approved_by = data.get('approvedBy', 'admin')
        
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return JsonResponse({'error': 'Project not found'}, status=404)
        
        project.status = 'approved'
        project.approved_at = datetime.now()
        project.approved_by = approved_by
        project.save()
        
        # Update club's total points and Community Service metrics
        club = project.club
        metrics = parse_json_field(club.metrics_json, {})
        
        # Update total points
        current_points = int(re.sub(r'[,]', '', str(metrics.get('totalPoints', '0'))))
        new_points = current_points + project.total_points
        metrics['totalPoints'] = str(new_points)
        
        # Update Community Service specific metrics if this is a community service project
        if project.category == 'community_service':
            # Update community capital deployed
            current_capital = int(re.sub(r'[₹,]', '', str(metrics.get('communityCapital', '0'))))
            project_capital = int(re.sub(r'[₹,]', '', str(project.community_capital_deployed)))
            new_capital = current_capital + project_capital
            metrics['communityCapital'] = str(new_capital)
            
            # Update lives touched
            current_lives = int(str(metrics.get('livesTouched', '0')))
            new_lives = current_lives + project.lives_touched
            metrics['livesTouched'] = str(new_lives)
            
            # Update service hours
            current_hours = int(str(metrics.get('serviceHours', '0')))
            new_hours = current_hours + project.service_hours
            metrics['serviceHours'] = str(new_hours)
        
        club.metrics_json = json.dumps(metrics)
        club.save()
        
        # Create notification for the club
        notification = Notification(
            club=club,
            title='Project Approved',
            message=f'Your project "{project.project_name}" has been approved. {project.total_points} points added to your club.',
            type='success'
        )
        notification.save()
        
        return JsonResponse({'success': True, 'points': project.total_points})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def reject_project(request, project_id):
    """Reject a project (admin only)"""
    try:
        from .models import Project
        
        data = json.loads(request.body)
        reason = data.get('reason', 'No reason provided')
        
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return JsonResponse({'error': 'Project not found'}, status=404)
        
        project.status = 'rejected'
        project.rejection_reason = reason
        project.save()
        
        # Create notification for the club
        notification = Notification(
            club=project.club,
            title='Project Rejected',
            message=f'Your project "{project.project_name}" has been rejected. Reason: {reason}',
            type='error'
        )
        notification.save()
        
        return JsonResponse({'success': True})
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def get_pending_projects(request):
    """Get all pending projects for admin approval"""
    try:
        from .models import Project
        
        projects = Project.objects.filter(status='pending')
        result = []
        
        for project in projects:
            result.append({
                'id': project.id,
                'clubId': project.club.id,
                'clubName': project.club.name,
                'category': project.category,
                'projectName': project.project_name,
                'date': str(project.date),
                'venue': project.venue,
                'projectChair': project.project_chair,
                'description': project.description,
                'totalAttendance': project.total_attendance,
                'totalPoints': project.total_points,
                'month': project.month,
                'year': project.year,
                'submittedAt': project.submitted_at.isoformat(),
                'photos': parse_json_field(project.photos_json, []),
            })
        
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

"""
URL configuration for rotaract_project project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from clubs import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/clubs/', views.get_all_clubs, name='get_all_clubs'),
    path('api/clubs/save/', views.save_club, name='save_club'),
    path('api/clubs/bulk-add/', views.bulk_add_clubs, name='bulk_add_clubs'),
    path('api/clubs/<str:club_id>/', views.delete_club, name='delete_club'),
    path('api/login/', views.login, name='login'),
    path('api/notifications/<str:club_id>/', views.get_notifications, name='get_notifications'),
    path('api/notifications/<str:notification_id>/read/', views.mark_notification_read, name='mark_notification_read'),
# Meeting endpoints - IMPORTANT: Specific paths must come BEFORE general paths with parameters
    path('api/meetings/create/', csrf_exempt(views.create_meeting), name='create_meeting'),
    path('api/meetings/pending/', views.get_pending_meetings, name='get_pending_meetings'),
    path('api/meetings/<str:meeting_id>/update/', csrf_exempt(views.update_meeting), name='update_meeting'),
    path('api/meetings/<str:meeting_id>/delete/', csrf_exempt(views.delete_meeting), name='delete_meeting'),
    path('api/meetings/<str:meeting_id>/approve/', csrf_exempt(views.approve_meeting), name='approve_meeting'),
    path('api/meetings/<str:meeting_id>/reject/', csrf_exempt(views.reject_meeting), name='reject_meeting'),
    path('api/meetings/<str:club_id>/', views.get_meetings, name='get_meetings'),
    path('api/notifications/create/', views.create_notification, name='create_notification'),
]


import { Club, User, UserRole, ClubMetrics, Member } from './types';

const API_BASE_URL = 'http://localhost:8000/api';

/**
 * PRODUCTION READY API SERVICE
 * Connects to Django backend API
 */
export class DistrictAPI {
  // Get CSRF token from cookies
  private static getCSRFToken(): string {
    const name = 'csrftoken';
    let cookieValue = '';
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }

  // Get headers with CSRF token for POST/PUT/DELETE requests
  private static getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-CSRFToken': this.getCSRFToken(),
    };
  }

  private static async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }
    return response.json();
  }

  static async getAllClubs(): Promise<Club[]> {
    const response = await fetch(`${API_BASE_URL}/clubs/`);
    return this.handleResponse(response);
  }

  static async saveClub(club: Club): Promise<void> {
    // Clean metrics before saving to ensure no symbols are stored
    const cleanedClub = {
      ...club,
      metrics: {
        ...club.metrics,
        communityCapital: club.metrics.communityCapital.replace(/[₹,]/g, ''),
        totalPoints: club.metrics.totalPoints.replace(/[,]/g, '')
      }
    };

    const response = await fetch(`${API_BASE_URL}/clubs/save/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanedClub)
    });
    await this.handleResponse(response);
  }

  static async deleteClub(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/clubs/${id}/`, {
      method: 'DELETE'
    });
    await this.handleResponse(response);
  }

  static async bulkAddClubs(newClubs: Club[]): Promise<void> {
    // Clean all metrics for the new clubs
    const cleanedNewClubs = newClubs.map(c => ({
      ...c,
      metrics: {
        ...c.metrics,
        communityCapital: c.metrics.communityCapital.replace(/[₹,]/g, ''),
      }
    }));

    const response = await fetch(`${API_BASE_URL}/clubs/bulk-add/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanedNewClubs)
    });
    await this.handleResponse(response);
  }

  static async updateClubMetrics(clubId: string, metrics: ClubMetrics): Promise<void> {
    const club = await this.getClubById(clubId);
    if (club) {
      club.metrics = {
        ...metrics,
        communityCapital: metrics.communityCapital.replace(/[₹,]/g, ''),
        totalPoints: metrics.totalPoints.replace(/[,]/g, '')
      };
      await this.saveClub(club);
    }
  }

  static async updateClubMembers(clubId: string, members: Member[]): Promise<void> {
    const club = await this.getClubById(clubId);
    if (club) {
      club.members = members;
      await this.saveClub(club);
    }
  }

  static async getClubById(clubId: string): Promise<Club | null> {
    const clubs = await this.getAllClubs();
    return clubs.find(c => c.id === clubId) || null;
  }

  static async login(username: string, password: string): Promise<User | null> {
    const response = await fetch(`${API_BASE_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return {
      id: data.id,
      username: data.username,
      role: data.role as UserRole,
      clubData: data.clubData
    };
  }

  static async getNotifications(clubId: string): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/notifications/${clubId}/`);
    return this.handleResponse(response);
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read/`, {
      method: 'POST'
    });
    await this.handleResponse(response);
  }

  // Meeting API methods
  static async getMeetings(clubId: string, month?: string, year?: number): Promise<any[]> {
    let url = `${API_BASE_URL}/meetings/${clubId}/`;
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year.toString());
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  static async createMeeting(meetingData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/meetings/create/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(meetingData),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  static async updateMeeting(meetingId: string, meetingData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/update/`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(meetingData),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  static async deleteMeeting(meetingId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/delete/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include'
    });
    await this.handleResponse(response);
  }

  static async getPendingMeetings(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/meetings/pending/`, {
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  static async approveMeeting(meetingId: string, approvedBy: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/approve/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ approvedBy }),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  static async rejectMeeting(meetingId: string, reason: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/meetings/${meetingId}/reject/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
      credentials: 'include'
    });
    await this.handleResponse(response);
  }

  // Project API methods
  static async getProjects(clubId: string, month?: string, year?: number): Promise<any[]> {
    let url = `${API_BASE_URL}/projects/${clubId}/`;
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year.toString());
    if (params.toString()) url += `?${params.toString()}`;
    
    const response = await fetch(url);
    return this.handleResponse(response);
  }

  static async createProject(projectData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/projects/create/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(projectData),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  static async updateProject(projectId: string, projectData: any): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/update/`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(projectData),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  static async deleteProject(projectId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/delete/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include'
    });
    await this.handleResponse(response);
  }

  static async getPendingProjects(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/projects/pending/`, {
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  static async approveProject(projectId: string, approvedBy: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/approve/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ approvedBy }),
      credentials: 'include'
    });
    return this.handleResponse(response);
  }

  static async rejectProject(projectId: string, reason: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/projects/${projectId}/reject/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
      credentials: 'include'
    });
    await this.handleResponse(response);
  }
}

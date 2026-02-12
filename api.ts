
import { Club, User, UserRole, ClubMetrics, Member } from './types';

const STORAGE_KEY = 'rid3170_master_db';

/**
 * PRODUCTION READY API SERVICE
 * Currently uses localStorage as a "Mock DB engine".
 * To connect to SQL Server, replace these method bodies with fetch('your-api-url/...')
 */
export class DistrictAPI {
  private static async delay(ms: number = 500) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async getRawData(): Promise<Club[]> {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private static async saveRawData(data: Club[]): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  static async getAllClubs(): Promise<Club[]> {
    await this.delay(300);
    return await this.getRawData();
  }

  static async saveClub(club: Club): Promise<void> {
    await this.delay(400);
    const clubs = await this.getRawData();
    const index = clubs.findIndex(c => c.id === club.id);
    
    // Clean metrics before saving to ensure no symbols are stored
    const cleanedClub = {
      ...club,
      metrics: {
        ...club.metrics,
        communityCapital: club.metrics.communityCapital.replace(/[₹,]/g, ''),
        totalPoints: club.metrics.totalPoints.replace(/[,]/g, '')
      }
    };

    if (index > -1) {
      clubs[index] = cleanedClub;
    } else {
      clubs.push(cleanedClub);
    }
    await this.saveRawData(clubs);
  }

  static async deleteClub(id: string): Promise<void> {
    await this.delay(400);
    const clubs = await this.getRawData();
    const filtered = clubs.filter(c => c.id !== id);
    await this.saveRawData(filtered);
  }

  static async bulkAddClubs(newClubs: Club[]): Promise<void> {
    await this.delay(1000);
    const clubs = await this.getRawData();
    // Clean all metrics for the new clubs
    const cleanedNewClubs = newClubs.map(c => ({
      ...c,
      metrics: {
        ...c.metrics,
        communityCapital: c.metrics.communityCapital.replace(/[₹,]/g, ''),
      }
    }));
    await this.saveRawData([...clubs, ...cleanedNewClubs]);
  }

  static async updateClubMetrics(clubId: string, metrics: ClubMetrics): Promise<void> {
    await this.delay(400);
    const clubs = await this.getRawData();
    const index = clubs.findIndex(c => c.id === clubId);
    if (index > -1) {
      // Ensure we only store raw values
      clubs[index].metrics = {
        ...metrics,
        communityCapital: metrics.communityCapital.replace(/[₹,]/g, ''),
        totalPoints: metrics.totalPoints.replace(/[,]/g, '')
      };
      await this.saveRawData(clubs);
    }
  }

  static async updateClubMembers(clubId: string, members: Member[]): Promise<void> {
    await this.delay(500);
    const clubs = await this.getRawData();
    const index = clubs.findIndex(c => c.id === clubId);
    if (index > -1) {
      clubs[index].members = members;
      await this.saveRawData(clubs);
    }
  }

  static async login(username: string, password: string): Promise<User | null> {
    await this.delay(800);
    
    // Admin Check
    if (username === 'admin' && password === 'admin123') {
      return { id: 'admin', username: 'admin', role: UserRole.ADMIN };
    }
    
    // Club Check
    const clubs = await this.getRawData();
    const club = clubs.find(c => c.username === username && c.password === password);
    if (club) {
      return { 
        id: club.id, 
        username: club.username, 
        role: UserRole.CLUB, 
        clubData: club 
      };
    }
    return null;
  }
}


import React, { useState, useEffect } from 'react';
import { UserRole, User, Club, ClubMetrics, Member } from './types';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import ClubDashboard from './ClubDashboard';
import { DistrictAPI } from './api';

const STORAGE_KEY_USER = 'rid3170_current_session';

const App: React.FC = () => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load database and session on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        const allClubs = await DistrictAPI.getAllClubs();
        setClubs(allClubs);

        const savedUser = localStorage.getItem(STORAGE_KEY_USER);
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser) as User;
          // Refresh club data from master list if it's a club user to ensure latest data
          if (parsedUser.role === UserRole.CLUB && parsedUser.clubData) {
            const freshData = allClubs.find(c => c.id === parsedUser.clubData?.id);
            if (freshData) parsedUser.clubData = freshData;
          }
          setUser(parsedUser);
        }
      } catch (err) {
        console.error("Database initialization failed", err);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Update session storage when user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  const handleLogin = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    setUser(null);
  };

  const refreshClubs = async () => {
    const data = await DistrictAPI.getAllClubs();
    setClubs(data);
    
    // If club user is logged in, refresh their local state
    if (user?.role === UserRole.CLUB && user.clubData) {
      const fresh = data.find(c => c.id === user.clubData?.id);
      if (fresh) setUser({ ...user, clubData: fresh });
    }
  };

  const addClub = async (newClub: Club) => {
    await DistrictAPI.saveClub(newClub);
    await refreshClubs();
  };

  const updateClub = async (updatedClub: Club) => {
    await DistrictAPI.saveClub(updatedClub);
    await refreshClubs();
  };

  const deleteClub = async (id: string) => {
    if (window.confirm("Permanently delete this club and all associated records?")) {
      await DistrictAPI.deleteClub(id);
      await refreshClubs();
    }
  };

  const bulkAdd = async (newClubs: Club[]) => {
    await DistrictAPI.bulkAddClubs(newClubs);
    await refreshClubs();
  };

  const updateMetrics = async (metrics: ClubMetrics) => {
    if (user?.clubData) {
      await DistrictAPI.updateClubMetrics(user.clubData.id, metrics);
      await refreshClubs();
    }
  };

  const updateMembers = async (members: Member[]) => {
    if (user?.clubData) {
      await DistrictAPI.updateClubMembers(user.clubData.id, members);
      await refreshClubs();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#D91B5C] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Connecting to District Network...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} clubs={clubs} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {user.role === UserRole.ADMIN ? (
        <AdminDashboard 
          user={user} 
          clubs={clubs} 
          onAddClub={addClub} 
          onUpdateClub={updateClub}
          onDeleteClub={deleteClub}
          onBulkAdd={bulkAdd}
          onLogout={handleLogout} 
        />
      ) : (
        <ClubDashboard 
          user={user} 
          onLogout={handleLogout} 
          onUpdateMetrics={updateMetrics}
          onUpdateMembers={updateMembers}
        />
      )}
    </div>
  );
};

export default App;

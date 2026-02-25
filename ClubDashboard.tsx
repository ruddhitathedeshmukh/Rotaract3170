
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Club, ClubMetrics, Member } from './types';
import Reporting from './Reporting';
import Resources from './Resources';
import { DistrictAPI } from './api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const LOGO_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4"/><path d="M5 21V10.85"/><path d="M19 21V10.85"/><path d="M9 21v-4a3 3 0 0 1 6 0v4"/></svg>')}`;
const OFFICER_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>')}`;

const getDirectDriveUrl = (url: string) => {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (trimmed.includes('drive.google.com')) {
    let fileId = '';
    const dMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{20,})/);
    const idMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
    if (dMatch && dMatch[1]) fileId = dMatch[1];
    else if (idMatch && idMatch[1]) fileId = idMatch[1];
    return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : trimmed;
  }
  return trimmed;
};

const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

const isBoardMember = (designation: string = '') => {
  const d = designation.toLowerCase().trim();
  if (d === 'rcc') return false;
  return d.includes('president') || d.includes('secretary') || d.includes('treasurer') || 
         d.includes('director') || d.includes('vice president') || d.includes('bod') || 
         d.includes('sergeant') || d.includes('chair');
};

const isRCC = (designation: string = '') => {
  const d = designation.toLowerCase().trim();
  return d === 'rcc' || d.includes('rotaract club coordinator');
};

type ActiveView = 'home' | 'membership' | 'reporting' | 'dues' | 'resources';

interface ClubDashboardProps {
  user: User;
  onLogout: () => void;
  onUpdateMetrics?: (metrics: ClubMetrics) => void;
  onUpdateMembers?: (members: Member[]) => void;
}

const ClubDashboard: React.FC<ClubDashboardProps> = ({ user, onLogout, onUpdateMetrics, onUpdateMembers }) => {
  const club = user.clubData;
  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const rosterFileInputRef = useRef<HTMLInputElement>(null);
  
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [designationFilter, setDesignationFilter] = useState('All');
  const [duesFilter, setDuesFilter] = useState<'All' | 'Paid' | 'Pending'>('All');
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const DISTRICT_DUES_RATE = 100;

  const initialMemberState: Partial<Member> = {
    name: '', riId: '', designation: '', email: '', phone: '', joinedDate: new Date().toISOString().split('T')[0], 
    status: 'Active', occupation: '', bloodGroup: '', gender: '', duesStatus: 'Pending', amountPaid: '0',
    districtDuesVerified: false, isLocked: false
  };

  const [newMember, setNewMember] = useState<Partial<Member>>(initialMemberState);
  
  // Load notifications on mount and periodically
  useEffect(() => {
    if (club?.id) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [club?.id]);

  const loadNotifications = async () => {
    if (!club?.id) return;
    try {
      const notifs = await DistrictAPI.getNotifications(club.id);
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await DistrictAPI.markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  if (!club) return <div className="p-10 text-center text-slate-500 font-bold">Session Error: Club data not found.</div>;

  const combinedMembersList = useMemo(() => {
    const baseList = [...(club.members || [])];
    const officers = (club.officers || {}) as any;
    const districtOfficers = [
      { role: 'President', data: officers.president },
      { role: 'Secretary', data: officers.secretary },
      { role: 'Vice President', data: officers.vicePresident },
      { role: 'Treasurer', data: officers.treasurer },
      { role: 'RCC', data: officers.rcc }
    ];

    districtOfficers.forEach(of => {
      if (of.data?.name && !baseList.some(m => m.name.toLowerCase() === of.data?.name?.toLowerCase())) {
        baseList.unshift({
          id: `admin-off-${of.role.toLowerCase()}`,
          name: of.data.name,
          riId: 'Officer',
          designation: of.role,
          email: '',
          phone: '',
          joinedDate: club.charterDate || '',
          occupation: '',
          bloodGroup: '',
          gender: '',
          status: 'Active',
          duesStatus: 'Paid',
          districtDuesVerified: false,
          isLocked: false 
        });
      }
    });
    return baseList;
  }, [club.members, club.officers, club.charterDate]);

  const memberStats = useMemo(() => {
    const members = combinedMembersList;
    const bodCount = members.filter(m => isBoardMember(m.designation)).length;
    const rccCount = members.filter(m => isRCC(m.designation)).length;
    const activeGeneralCount = members.filter(m => m.status === 'Active' && !isBoardMember(m.designation) && !isRCC(m.designation)).length;
    
    const strengthExclRCC = bodCount + activeGeneralCount;
    const districtDuesVerifiedCount = members.filter(m => m.districtDuesVerified && !isRCC(m.designation)).length;
    
    const totalDuesPayable = strengthExclRCC * DISTRICT_DUES_RATE;
    const amountReceivedByDistrict = districtDuesVerifiedCount * DISTRICT_DUES_RATE;
    const pendingMemberDues = strengthExclRCC - districtDuesVerifiedCount;
    const pendingAmount = pendingMemberDues * DISTRICT_DUES_RATE;

    let pointsEarned = 0;
    if (districtDuesVerifiedCount > 0 && club.districtPaymentDate) {
      const year = new Date().getFullYear();
      const cutoffDate = new Date(`${year}-09-30`);
      const paymentDate = new Date(club.districtPaymentDate);
      const pointsPerMember = paymentDate <= cutoffDate ? 200 : 100;
      pointsEarned = districtDuesVerifiedCount * pointsPerMember;
    }

    return { 
      total: members.length, 
      strengthExclRCC,
      activeGeneral: activeGeneralCount, 
      bod: bodCount, 
      rccCount: rccCount,
      districtDuesVerifiedCount,
      totalDuesPayable,
      amountReceivedByDistrict,
      pendingMemberDues,
      pendingAmount,
      pointsEarned
    };
  }, [combinedMembersList, club.districtPaymentDate]);

  const filteredMembers = useMemo(() => {
    let results = combinedMembersList;
    if (memberSearchTerm.trim()) {
      const lower = memberSearchTerm.toLowerCase();
      results = results.filter(m => 
        m.name.toLowerCase().includes(lower) || 
        m.riId.toLowerCase().includes(lower) ||
        m.designation.toLowerCase().includes(lower)
      );
    }
    if (designationFilter !== 'All') {
      if (designationFilter === 'BOD') results = results.filter(m => isBoardMember(m.designation));
      else if (designationFilter === 'General') results = results.filter(m => !isBoardMember(m.designation) && !isRCC(m.designation));
      else if (designationFilter === 'RCC') results = results.filter(m => isRCC(m.designation));
      else results = results.filter(m => m.designation === designationFilter);
    }
    
    return [...results].sort((a, b) => {
      const getPriorityRank = (d: string = '') => {
        const designation = d.toLowerCase().trim();
        if (designation === 'president' || (designation.includes('president') && !designation.includes('vice'))) return 1;
        if (designation === 'secretary') return 2;
        if (designation === 'vice president') return 3;
        if (designation === 'treasurer') return 4;
        if (designation === 'rcc') return 5;
        if (isBoardMember(d)) return 10;
        if (designation === 'member') return 1000;
        return 100;
      };

      const rankA = getPriorityRank(a.designation);
      const rankB = getPriorityRank(b.designation);

      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });
  }, [combinedMembersList, memberSearchTerm, designationFilter]);

  const filteredDuesList = useMemo(() => {
    let list = combinedMembersList.filter(m => !isRCC(m.designation));
    if (duesFilter === 'Paid') {
      list = list.filter(m => m.districtDuesVerified);
    } else if (duesFilter === 'Pending') {
      list = list.filter(m => !m.districtDuesVerified);
    }
    return list;
  }, [combinedMembersList, duesFilter]);

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (club.isRosterLocked) return;
    if (!newMember.name) return;
    
    const existingMembers = club.members || [];
    
    if (!editingMemberId) {
      const isNameDup = combinedMembersList.some(m => m.name.toLowerCase() === newMember.name?.toLowerCase());
      const isPosDup = newMember.designation && 
                       newMember.designation.toLowerCase() !== 'member' && 
                       combinedMembersList.some(m => m.designation.toLowerCase() === newMember.designation?.toLowerCase());
      
      if (isNameDup || isPosDup) {
        alert("Action Stopped: A member with this name or unique position already exists.");
        return;
      }
    }

    if (editingMemberId && editingMemberId.startsWith('admin-off-')) {
      const memberToAdd: Member = { 
        ...newMember, 
        id: Math.random().toString(36).substr(2, 9), 
        districtDuesVerified: false, 
        isLocked: false 
      } as Member;
      if (onUpdateMembers) onUpdateMembers([...existingMembers, memberToAdd]);
    } else if (editingMemberId && onUpdateMembers) {
      onUpdateMembers(existingMembers.map(m => m.id === editingMemberId ? { ...m, ...newMember } as Member : m));
    } else if (onUpdateMembers) {
      const memberToAdd: Member = { ...newMember, id: Math.random().toString(36).substr(2, 9), districtDuesVerified: false, isLocked: false } as Member;
      onUpdateMembers([...existingMembers, memberToAdd]);
    }
    
    setIsMemberModalOpen(false);
    setEditingMemberId(null);
    setNewMember(initialMemberState);
  };

  const toggleExpandMember = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedMemberId(expandedMemberId === id ? null : id);
  };

  const openEditMemberModal = (member: Member, e: React.MouseEvent) => {
    e.stopPropagation();
    if (club.isRosterLocked) {
      alert("Roster is currently locked by District Admin.");
      return;
    }
    setEditingMemberId(member.id);
    setNewMember({ ...member });
    setIsMemberModalOpen(true);
  };

  const handleDeleteMember = (id: string, e: React.MouseEvent, isLocked: boolean) => {
    e.stopPropagation();
    if (club.isRosterLocked) {
      alert("Roster is currently locked by District Admin.");
      return;
    }
    if (isLocked) {
      alert("This individual record is protected.");
      return;
    }
    if (id.startsWith('admin-off-')) {
      alert("System-defined officers cannot be deleted directly. Please contact District Admin for leadership changes.");
      return;
    }
    if (window.confirm("Are you sure you want to remove this member?")) {
      if (onUpdateMembers) {
        onUpdateMembers((club.members || []).filter(m => m.id !== id));
      }
    }
  };

  const handleDownloadTemplate = () => {
    const headers = "Name,RI ID,Designation,Email,Phone,JoinedDate(YYYY-MM-DD),Occupation,BloodGroup,Gender\n";
    const example = "\"Member Name\",TBD,Member,email@example.com,0000000000,2025-01-01,Student,B+,Male\n";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RID3170_Roster_Template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRosterImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (club.isRosterLocked) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const newMembers: Member[] = [];
      let skippedCount = 0;
      
      const runningList = [...combinedMembersList];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = parseCSVLine(line);
        const csvName = parts[0]?.trim();
        const csvDesignation = (parts[2]?.trim() || 'Member');

        if (!csvName) continue;

        const isNameDuplicate = runningList.some(m => m.name.toLowerCase() === csvName.toLowerCase());
        const isDesignationDuplicate = csvDesignation.toLowerCase() !== 'member' && 
                                       runningList.some(m => m.designation.toLowerCase() === csvDesignation.toLowerCase());

        if (isNameDuplicate || isDesignationDuplicate) {
          skippedCount++;
          continue;
        }

        const memberData: Member = {
          id: Math.random().toString(36).substr(2, 9),
          name: csvName,
          riId: parts[1] || 'TBD',
          designation: csvDesignation,
          email: parts[3] || '',
          phone: parts[4] || '',
          joinedDate: parts[5] || new Date().toISOString().split('T')[0],
          occupation: parts[6] || '',
          bloodGroup: parts[7] || '',
          gender: parts[8] || '',
          status: 'Active',
          duesStatus: 'Pending',
          districtDuesVerified: false,
          isLocked: false
        };

        newMembers.push(memberData);
        runningList.push(memberData);
      }
      
      if (onUpdateMembers && newMembers.length > 0) {
        onUpdateMembers([...(club.members || []), ...newMembers]);
        alert(`Process Finished:\n✅ ${newMembers.length} records added\n⚠️ ${skippedCount} duplicates skipped`);
      } else if (skippedCount > 0) {
        alert(`No records added. All ${skippedCount} entries were duplicates (by Name or restricted Designation).`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const impactMetrics = [
    { label: 'Community Capital', value: `₹${(club.metrics?.communityCapital || '0')}`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: '₹' },
    { label: 'Service Hours', value: club.metrics?.serviceHours || '0', color: 'text-blue-600', bg: 'bg-blue-50', icon: 'H' },
    { label: 'Lives Touched', value: club.metrics?.livesTouched || '0', color: 'text-[#D91B5C]', bg: 'bg-pink-50', icon: 'L' },
    { label: 'Rotaractors', value: memberStats.strengthExclRCC, color: 'text-orange-600', bg: 'bg-orange-50', icon: 'R' },
    { label: 'Total Points', value: (Number(club.metrics?.totalPoints || '0') + memberStats.pointsEarned).toString(), color: 'text-indigo-600', bg: 'bg-indigo-50', icon: 'P' }
  ];

  const navItems = [
    { id: 'home', label: 'Home', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
    { id: 'membership', label: 'Membership', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
    { id: 'reporting', label: 'Reporting', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: 'dues', label: 'Dues', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { id: 'resources', label: 'Resources', icon: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative pb-28">
      <nav className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0050A1] rounded-xl shadow-lg flex items-center justify-center text-white font-black text-xl">RID</div>
          <div>
            <h2 className="font-black text-slate-800 tracking-tight leading-none">District 3170</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Club Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-[#D91B5C] transition-colors rounded-xl hover:bg-slate-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
                  <h3 className="font-black text-slate-900">Notifications</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {unreadCount} unread
                  </p>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                        onClick={() => handleMarkAsRead(notif.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-black text-sm text-slate-900">{notif.title}</h4>
                            <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                              {new Date(notif.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!notif.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-slate-400 font-bold text-sm">No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-pink-600 font-bold hover:text-red-700 transition-colors uppercase tracking-widest text-xs">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeView === 'home' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/40 border border-white flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
              <div className="flex-1 text-center md:text-left relative z-10">
                <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">
                  Welcome, <br/>
                  <span className="text-[#D91B5C]">{club.name}</span>
                </h1>
                <p className="text-slate-400 mt-4 text-sm font-bold uppercase tracking-widest opacity-60">Club Leadership & Metrics</p>
              </div>
              <div className="w-40 h-40 md:w-56 md:h-56 bg-slate-50 p-4 rounded-3xl shadow-inner flex items-center justify-center relative z-10">
                <img src={getDirectDriveUrl(club.logoUrl) || LOGO_PLACEHOLDER} alt="Logo" className="max-w-full max-h-full object-contain" onError={(e) => { (e.target as HTMLImageElement).src = LOGO_PLACEHOLDER }} />
              </div>
            </section>
            
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              {impactMetrics.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-lg group">
                  <div className={`${item.bg} ${item.color} w-10 h-10 rounded-xl flex items-center justify-center mb-6 font-black text-lg group-hover:rotate-12 transition-transform`}>{item.icon}</div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <p className="text-xl font-black text-slate-900 tracking-tight">{item.value}</p>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-[#0050A1] rounded-full"></div> Club Profile
                </h3>
                <div className="space-y-6">
                  {[
                    { label: 'Zone', value: club.zone },
                    { label: 'Club ID', value: club.clubId },
                    { label: 'Charter No', value: club.charterNo },
                    { label: 'Sponsor', value: club.sponsoredBy },
                  ].map((item, idx) => (
                    <div key={idx} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">{item.label}</p>
                      <p className="text-sm font-bold text-slate-700">{item.value || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2 px-2">
                  <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div> Core Leadership
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { role: 'President', data: club.officers?.president },
                    { role: 'Secretary', data: club.officers?.secretary },
                    { role: 'Vice President', data: club.officers?.vicePresident },
                    { role: 'Treasurer', data: club.officers?.treasurer },
                    { role: 'RCC', data: club.officers?.rcc },
                  ].map((officer, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
                      <div className="w-20 h-20 rounded-full bg-slate-100 mx-auto mb-4 p-1 overflow-hidden ring-4 ring-slate-50">
                        <img src={getDirectDriveUrl(officer.data?.photoUrl) || OFFICER_PLACEHOLDER} alt={officer.role} className="w-full h-full object-cover rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = OFFICER_PLACEHOLDER }} />
                      </div>
                      <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">{officer.role}</p>
                      <h4 className="text-xs font-black text-slate-800 line-clamp-1">{officer.data?.name || 'Pending'}</h4>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'membership' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {club.isRosterLocked && (
              <div className="bg-orange-50 p-6 rounded-[2.5rem] border border-orange-100 flex items-center justify-between">
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">Roster Locked by Admin</h3>
                    <p className="text-[10px] font-bold text-orange-700/60 uppercase tracking-widest">Master records are currently secured for verification.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-2">
              <div className="flex-1 max-w-2xl">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Member Directory</h2>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1 mb-6">Official records sorted by seniority priority</p>
                
                <div className="relative group">
                  <input 
                    type="text" 
                    placeholder="Search by name, RI ID or position..." 
                    className="w-full pl-12 pr-4 h-12 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-pink-500/10 transition-all shadow-sm group-hover:border-slate-300"
                    value={memberSearchTerm}
                    onChange={e => setMemberSearchTerm(e.target.value)}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transition-colors group-focus-within:text-pink-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={handleDownloadTemplate} 
                  className="flex-1 lg:flex-none h-12 min-w-[130px] bg-slate-100 text-slate-600 px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Template
                </button>
                <button 
                  disabled={!!club.isRosterLocked} 
                  onClick={() => rosterFileInputRef.current?.click()} 
                  className={`flex-1 lg:flex-none h-12 min-w-[130px] bg-[#0050A1] text-white px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${club.isRosterLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.03] shadow-blue-200'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  Import CSV
                </button>
                <input type="file" ref={rosterFileInputRef} onChange={handleRosterImport} className="hidden" accept=".csv" />
                <button 
                  disabled={!!club.isRosterLocked} 
                  onClick={() => { setEditingMemberId(null); setNewMember(initialMemberState); setIsMemberModalOpen(true); }} 
                  className={`flex-1 lg:flex-none h-12 min-w-[130px] bg-[#D91B5C] text-white px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap ${club.isRosterLocked ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.03] shadow-pink-200'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                  Manual Add
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden mb-12">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">SR.</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member Name</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">RI ID</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Position</th>
                      <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((m, idx) => (
                        <React.Fragment key={m.id}>
                          <tr className={`hover:bg-slate-50/50 transition-colors ${expandedMemberId === m.id ? 'bg-blue-50/20' : ''}`}>
                            <td className="px-6 py-6 text-xs font-black text-slate-300">{idx + 1}</td>
                            <td className="px-8 py-6">
                              <div className="flex flex-col">
                                <span className="font-black text-slate-800 text-sm">{m.name}</span>
                                <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{m.email || 'No email reported'}</span>
                              </div>
                            </td>
                            <td className="px-8 py-6 text-xs font-bold text-slate-500 text-center">{m.riId || '—'}</td>
                            <td className="px-8 py-6 text-center">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${m.designation?.toLowerCase().includes('president') ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-600'}`}>
                                {m.designation || 'Member'}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex justify-end gap-3">
                                <button onClick={(e) => toggleExpandMember(m.id, e)} className="text-[9px] font-black px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 transition-all uppercase">
                                  {expandedMemberId === m.id ? 'Hide' : 'View'}
                                </button>
                                <button disabled={!!club.isRosterLocked || m.isLocked} onClick={(e) => openEditMemberModal(m, e)} className={`p-2 rounded-lg ${(club.isRosterLocked || m.isLocked) ? 'text-slate-200 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button disabled={!!club.isRosterLocked || m.isLocked} onClick={(e) => handleDeleteMember(m.id, e, !!m.isLocked)} className={`p-2 rounded-lg ${(club.isRosterLocked || m.isLocked) ? 'text-slate-200 cursor-not-allowed' : 'text-red-500 hover:bg-red-50'}`}>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedMemberId === m.id && (
                            <tr className="bg-slate-50/40 animate-in slide-in-from-top-1 duration-200">
                              <td colSpan={5} className="px-8 py-8">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                                  <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Contact</span><span className="text-xs font-bold text-slate-800">{m.phone || '—'}</span></div>
                                  <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Joined District</span><span className="text-xs font-bold text-slate-800">{m.joinedDate || '—'}</span></div>
                                  <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Occupation</span><span className="text-xs font-bold text-slate-800">{m.occupation || '—'}</span></div>
                                  <div className="flex flex-col"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood & Gender</span><span className="text-xs font-black text-pink-600 uppercase tracking-tighter">{m.bloodGroup || '—'} • {m.gender || '—'}</span></div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center">
                          <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em]">No members matching search criteria</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'dues' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Dues Reconciliation</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Verified by District 3170 Admin Team</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Members', value: memberStats.strengthExclRCC, color: 'text-slate-900' },
                { label: 'Verified Paid', value: memberStats.districtDuesVerifiedCount, color: 'text-emerald-600' },
                { label: 'Payable Total', value: `₹${memberStats.totalDuesPayable}`, color: 'text-[#0050A1]' },
                { label: 'Outstanding', value: `₹${memberStats.pendingAmount}`, color: 'text-red-500' },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[2rem] border border-slate-100 p-8 space-y-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div> Payment Verification Log
                </h4>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
                  <select 
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={duesFilter}
                    onChange={(e) => setDuesFilter(e.target.value as any)}
                  >
                    <option value="All">All Members</option>
                    <option value="Paid">Verified Paid</option>
                    <option value="Pending">Awaiting Verification</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Member Identity</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase">Verification Level</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-right">District Check</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredDuesList.length > 0 ? (
                      filteredDuesList.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-800">{m.name}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{m.riId || 'No RI ID'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${m.districtDuesVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                              {m.districtDuesVerified ? 'Verified' : 'Pending Verification'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {m.districtDuesVerified ? (
                              <div className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center ml-auto">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                              </div>
                            ) : (
                              <span className="text-[9px] font-black text-slate-300 uppercase">Awaiting</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                          No members in this category
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'reporting' && (
          <Reporting
            metrics={club.metrics}
            onUpdateMetrics={onUpdateMetrics}
            pointsEarned={memberStats.pointsEarned}
            clubId={club.id}
          />
        )}

        {activeView === 'resources' && (
          <Resources />
        )}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 px-6 py-4 flex items-center justify-around">
        {navItems.map((item) => (
          <button key={item.id} onClick={() => setActiveView(item.id as ActiveView)} className={`flex flex-col items-center gap-1 transition-all ${activeView === item.id ? 'text-[#D91B5C] scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
            <div className="p-1">{item.icon}</div>
            <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </footer>

      {isMemberModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[1000]">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-black text-slate-900 mb-8">{editingMemberId ? 'Update Record' : 'Enroll New Member'}</h2>
            <form onSubmit={handleSaveMember} className="grid grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Legal Name</label>
                <input type="text" required className="w-full bg-slate-50 border p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#D91B5C] font-bold text-sm" value={newMember.name || ''} onChange={e => setNewMember({...newMember, name: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">RI ID</label>
                <input type="text" className="w-full bg-slate-50 border p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#D91B5C] font-bold text-sm" value={newMember.riId || ''} onChange={e => setNewMember({...newMember, riId: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Designation</label>
                <input type="text" required placeholder="Member, Director, etc." className="w-full bg-slate-50 border p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#D91B5C] font-bold text-sm" value={newMember.designation || ''} onChange={e => setNewMember({...newMember, designation: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Email</label>
                <input type="email" required className="w-full bg-slate-50 border p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#D91B5C] font-bold text-sm" value={newMember.email || ''} onChange={e => setNewMember({...newMember, email: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Phone</label>
                <input type="text" className="w-full bg-slate-50 border p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#D91B5C] font-bold text-sm" value={newMember.phone || ''} onChange={e => setNewMember({...newMember, phone: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Join Date</label>
                <input type="date" required className="w-full bg-slate-50 border p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#D91B5C] font-bold text-sm" value={newMember.joinedDate || ''} onChange={e => setNewMember({...newMember, joinedDate: e.target.value})} />
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Blood Group</label>
                <select className="w-full bg-slate-50 border p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#D91B5C] font-bold text-sm cursor-pointer" value={newMember.bloodGroup || ''} onChange={e => setNewMember({...newMember, bloodGroup: e.target.value})}>
                  <option value="">Select</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Gender</label>
                <select className="w-full bg-slate-50 border p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#D91B5C] font-bold text-sm cursor-pointer" value={newMember.gender || ''} onChange={e => setNewMember({...newMember, gender: e.target.value})}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="col-span-full pt-8 flex gap-4">
                <button type="button" onClick={() => setIsMemberModalOpen(false)} className="flex-1 py-4.5 bg-slate-100 rounded-2xl font-black text-slate-500 uppercase text-[10px] tracking-widest transition-colors">Cancel</button>
                <button type="submit" className="flex-[2] py-4.5 bg-[#D91B5C] text-white rounded-2xl font-black shadow-xl shadow-pink-200 uppercase text-[10px] tracking-widest transition-all">Save District Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDashboard;

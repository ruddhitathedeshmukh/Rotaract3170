
import React, { useState, useRef, useMemo } from 'react';
import { User, Club, ClubOfficers, Officer, Member, Invoice } from './types';

const LOGO_PLACEHOLDER = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4"/><path d="M5 21V10.85"/><path d="M19 21V10.85"/><path d="M9 21v-4a3 3 0 0 1 6 0v4"/></svg>')}`;

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

interface AdminDashboardProps {
  user: User;
  clubs: Club[];
  onAddClub: (club: Club) => void;
  onUpdateClub: (club: Club) => void;
  onDeleteClub: (id: string) => void;
  onBulkAdd: (clubs: Club[]) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, clubs, onAddClub, onUpdateClub, onDeleteClub, onBulkAdd, onLogout }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClubId, setEditingClubId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rosterSearchTerm, setRosterSearchTerm] = useState('');
  const [modalTab, setModalTab] = useState<'details' | 'roster' | 'invoices'>('details');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rosterFileInputRef = useRef<HTMLInputElement>(null);
  
  const initialFormState: Partial<Club> = {
    name: '', username: '', password: '', zone: 'Zone 1',
    charterDate: '', sponsoredBy: '', charterNo: '', clubId: '',
    logoUrl: '',
    isRosterLocked: false,
    metrics: { communityCapital: '0', serviceHours: '0', livesTouched: '0', rotaractersInAction: '0', totalPoints: '0' },
    officers: {
      president: { name: '', photoUrl: '' },
      secretary: { name: '', photoUrl: '' },
      treasurer: { name: '', photoUrl: '' },
      vicePresident: { name: '', photoUrl: '' },
      rcc: { name: '', photoUrl: '' }
    },
    members: [],
    districtPaymentDate: '',
    invoices: []
  };

  const [newClub, setNewClub] = useState<Partial<Club>>(initialFormState);
  const [tempInvoice, setTempInvoice] = useState({ name: '', url: '' });

  const filteredClubs = useMemo(() => {
    if (!searchTerm.trim()) return clubs;
    const lowerTerm = searchTerm.toLowerCase();
    return clubs.filter(club => club.name.toLowerCase().includes(lowerTerm) || club.clubId.toLowerCase().includes(lowerTerm));
  }, [clubs, searchTerm]);

  const combinedMembersList = useMemo(() => {
    const baseList = [...(newClub.members || [])];
    // Fix: cast officers to any to prevent property access errors on fallback empty object when newClub.officers is missing
    const officers = (newClub.officers || {}) as any;
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
          joinedDate: newClub.charterDate || '',
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
  }, [newClub.members, newClub.officers, newClub.charterDate]);

  const filteredSecurityRoster = useMemo(() => {
    // 1. Exclude RCC
    let list = combinedMembersList.filter(m => {
        const d = m.designation?.toLowerCase() || '';
        return !(d === 'rcc' || d.includes('rotaract club coordinator'));
    });

    // 2. Apply Search
    if (rosterSearchTerm.trim()) {
        const lower = rosterSearchTerm.toLowerCase();
        list = list.filter(m => 
            m.name.toLowerCase().includes(lower) || 
            m.riId.toLowerCase().includes(lower) ||
            m.designation.toLowerCase().includes(lower)
        );
    }

    return list;
  }, [combinedMembersList, rosterSearchTerm]);

  const openEditModal = (club: Club) => {
    setNewClub(JSON.parse(JSON.stringify(club)));
    setEditingClubId(club.id);
    setModalTab('details');
    setRosterSearchTerm('');
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setNewClub(initialFormState);
    setEditingClubId(null);
    setModalTab('details');
    setRosterSearchTerm('');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClubId) {
      onUpdateClub(newClub as Club);
    } else {
      const clubToRegister: Club = {
        ...newClub,
        id: Math.random().toString(36).substr(2, 9),
        status: 'active',
      } as Club;
      onAddClub(clubToRegister);
    }
    setIsModalOpen(false);
  };

  const toggleMemberVerification = (memberId: string) => {
    if (memberId.startsWith('admin-off-')) {
      const virtualMember = combinedMembersList.find(m => m.id === memberId);
      if (virtualMember) {
        const promotedMember: Member = {
          ...virtualMember,
          id: Math.random().toString(36).substr(2, 9),
          districtDuesVerified: true
        };
        setNewClub({ ...newClub, members: [...(newClub.members || []), promotedMember] });
      }
    } else {
      const updatedMembers = (newClub.members || []).map(m => {
        if (m.id === memberId) {
          return { ...m, districtDuesVerified: !m.districtDuesVerified };
        }
        return m;
      });
      setNewClub({ ...newClub, members: updatedMembers });
    }
  };

  const toggleRosterLock = () => {
    setNewClub({ ...newClub, isRosterLocked: !newClub.isRosterLocked });
  };

  const handleDownloadTemplate = () => {
    const headers = "Name,Username,Password,Zone,CharterDate,SponsoredBy,CharterNo,ClubId,LogoUrl,PresName,PresPhoto,SecName,SecPhoto,TreasName,TreasPhoto,VPName,VPPhoto,RCCName,RCCPhoto\n";
    const example = "\"New RAC\",new_rac,123,Zone 1,2025-01-01,\"Rotary Sponsor\",C001,RID-3170-001,https://logo.url,John Pres,photo.url,Jane Sec,photo.url,Mark Treas,photo.url,Alice VP,photo.url,Charles RCC,photo.url\n";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'RID3170_Bulk_Clubs.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const newClubs: Club[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = parseCSVLine(line);
        newClubs.push({
          id: Math.random().toString(36).substr(2, 9),
          name: parts[0] || 'New Club',
          username: parts[1] || '',
          password: parts[2] || '123456',
          zone: parts[3] || 'Zone 1',
          charterDate: parts[4] || '',
          sponsoredBy: parts[5] || '',
          charterNo: parts[6] || '',
          clubId: parts[7] || '',
          logoUrl: parts[8] || '',
          status: 'active',
          isRosterLocked: false,
          metrics: { communityCapital: '0', serviceHours: '0', livesTouched: '0', rotaractersInAction: '0', totalPoints: '0' },
          officers: {
            president: { name: parts[9] || '', photoUrl: parts[10] || '' },
            secretary: { name: parts[11] || '', photoUrl: parts[12] || '' },
            treasurer: { name: parts[13] || '', photoUrl: parts[14] || '' },
            vicePresident: { name: parts[15] || '', photoUrl: parts[16] || '' },
            rcc: { name: parts[17] || '', photoUrl: parts[18] || '' }
          },
          members: [],
          districtPaymentDate: '',
          invoices: []
        });
      }
      if (newClubs.length > 0) {
        onBulkAdd(newClubs);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRosterImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const newMembers: Member[] = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = parseCSVLine(line);
        if (parts[0]) {
          newMembers.push({
            id: Math.random().toString(36).substr(2, 9),
            name: parts[0],
            riId: parts[1] || 'TBD',
            designation: parts[2] || 'Member',
            email: parts[3] || '',
            phone: parts[4] || '',
            joinedDate: new Date().toISOString().split('T')[0],
            occupation: '',
            bloodGroup: '',
            gender: '',
            status: 'Active',
            duesStatus: 'Pending',
            districtDuesVerified: false,
            isLocked: false
          });
        }
      }
      setNewClub({ ...newClub, members: [...(newClub.members || []), ...newMembers] });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="bg-white border-b px-8 py-4 flex items-center justify-between shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D91B5C] rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-pink-100">D</div>
          <div>
            <h2 className="text-xl font-black text-slate-800 leading-none">District 3170</h2>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admin Control Panel</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-slate-100 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-black hover:bg-slate-200 transition-all border border-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              <span className="hidden lg:inline text-[10px] uppercase">Template</span>
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-[#0050A1] text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-lg hover:bg-[#003d7a] transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              <span className="hidden lg:inline text-[10px] uppercase">Import CSV</span>
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv" />
          </div>
          <button onClick={openCreateModal} className="bg-[#D91B5C] text-white px-6 py-2.5 rounded-xl text-[10px] uppercase font-black shadow-lg shadow-pink-200 hover:scale-105 transition-all">New Club</button>
          <div className="h-6 w-px bg-slate-200"></div>
          <button onClick={onLogout} className="text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-red-600 transition-colors">Logout</button>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 relative max-w-xl">
             <input type="text" placeholder="Search clubs by name or ID..." className="w-full pl-10 pr-4 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-sm font-bold outline-none focus:ring-4 focus:ring-pink-500/10 shadow-sm transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClubs.map(club => (
              <div key={club.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-2 group-hover:bg-white transition-colors">
                    <img src={getDirectDriveUrl(club.logoUrl) || LOGO_PLACEHOLDER} className="max-w-full max-h-full object-contain" alt="logo" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 group-hover:text-[#D91B5C] transition-colors">{club.name}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{club.clubId} • {club.zone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEditModal(club)} className="flex-1 py-3.5 bg-blue-50 text-[#0050A1] text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-100 transition-all">Manage Club</button>
                  <button onClick={() => onDeleteClub(club.id)} className="px-5 py-3.5 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
                {club.isRosterLocked && (
                  <div className="absolute top-4 right-4 text-orange-500 bg-orange-50 p-2 rounded-xl border border-orange-100 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-5xl rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 bg-slate-50 border-b flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900 leading-none">Club Data Control</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">{newClub.name || 'Creation Mode'}</p>
              </div>
              <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
                <button onClick={() => setModalTab('details')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === 'details' ? 'bg-[#0050A1] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>General</button>
                <button onClick={() => setModalTab('roster')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modalTab === 'roster' ? 'bg-[#D91B5C] text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Security</button>
                <button onClick={() => setModalTab('invoices')} className={`px-6 py-2.5 rounded-xl text-[10px) font-black uppercase tracking-widest transition-all ${modalTab === 'invoices' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Receipts</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10">
              {modalTab === 'details' && (
                <form id="clubForm" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[{l:'Full Club Name', f:'name'}, {l:'User Login ID', f:'username'}, {l:'Access Password', f:'password'}, {l:'Territory Zone', f:'zone'}, {l:'District Club ID', f:'clubId'}].map(field => (
                    <div key={field.f}>
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">{field.l}</label>
                      <input type="text" className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#D91B5C]/20" value={(newClub as any)[field.f] || ''} onChange={e => setNewClub({...newClub, [field.f]: e.target.value})} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Dues Verification Date</label>
                    <input type="date" className="w-full bg-emerald-50 border-emerald-100 border p-3.5 rounded-2xl text-sm font-bold text-emerald-700 outline-none" value={newClub.districtPaymentDate || ''} onChange={e => setNewClub({...newClub, districtPaymentDate: e.target.value})} />
                  </div>
                  
                  <div className="col-span-full border-t border-slate-100 pt-8 mt-4">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Officers Designation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {['President', 'Secretary', 'VicePresident', 'Treasurer', 'RCC'].map(role => {
                         const roleKey = role.charAt(0).toLowerCase() + role.slice(1);
                         const officerData = (newClub.officers as any)?.[roleKey] || { name: '', photoUrl: '' };
                         return (
                           <div key={role} className="space-y-3 bg-slate-50/50 p-4 rounded-3xl border border-slate-100">
                             <label className="block text-[10px] font-black text-[#D91B5C] uppercase tracking-widest">{role}</label>
                             <input 
                               placeholder="Assignee Name" 
                               className="w-full bg-white border border-slate-200 p-3 rounded-xl text-xs font-bold" 
                               value={officerData.name || ''} 
                               onChange={e => {
                                 const updatedOfficers = { 
                                   ...newClub.officers, 
                                   [roleKey]: { ...officerData, name: e.target.value } 
                                 };
                                 setNewClub({ ...newClub, officers: updatedOfficers as ClubOfficers });
                               }} 
                             />
                           </div>
                         );
                       })}
                    </div>
                  </div>
                </form>
              )}

              {modalTab === 'roster' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 shadow-sm relative overflow-hidden">
                    <div className="flex gap-4 items-center relative z-10">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${newClub.isRosterLocked ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900">Roster Global Lock</h3>
                        <p className="text-[10px] font-bold text-orange-700/60 uppercase tracking-widest">Freezes club's ability to edit membership</p>
                      </div>
                    </div>
                    <button onClick={toggleRosterLock} className={`relative z-10 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${newClub.isRosterLocked ? 'bg-slate-900 text-white' : 'bg-orange-500 text-white shadow-lg'}`}>
                      {newClub.isRosterLocked ? 'Disable Lock' : 'Enable Lock'}
                    </button>
                    <div className="absolute right-0 top-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -mr-32 -mt-32"></div>
                  </div>

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-2">
                    <div className="flex-1 max-w-md relative group">
                        <input 
                            type="text" 
                            placeholder="Search identity or position..." 
                            className="w-full pl-10 pr-4 h-10 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-pink-500/10 transition-all shadow-sm"
                            value={rosterSearchTerm}
                            onChange={e => setRosterSearchTerm(e.target.value)}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => rosterFileInputRef.current?.click()} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-slate-200 transition-all">Import CSV</button>
                      <input type="file" ref={rosterFileInputRef} onChange={handleRosterImport} className="hidden" accept=".csv" />
                    </div>
                  </div>

                  <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">SR</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase">Identity</th>
                          <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Designation</th>
                          <th className="px-8 py-5 text-[10px) font-black text-slate-400 uppercase text-center">District Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {filteredSecurityRoster.length > 0 ? (
                          filteredSecurityRoster.map((member, idx) => (
                            <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-5 text-center text-xs font-black text-slate-300">{idx + 1}</td>
                              <td className="px-8 py-5">
                                <span className="text-sm font-black text-slate-800">{member.name}</span>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${member.id.startsWith('admin-off-') ? 'bg-pink-50 text-pink-600' : 'bg-slate-100 text-slate-500'}`}>{member.designation}</span>
                              </td>
                              <td className="px-8 py-5 text-center">
                                <button type="button" onClick={() => toggleMemberVerification(member.id)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${member.districtDuesVerified ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                                  {member.districtDuesVerified ? 'Verified Paid' : 'Unverified'}
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan={4} className="px-8 py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching members found</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {modalTab === 'invoices' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Add Document Link</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input placeholder="Label (e.g. Q1 Dues)" className="bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none" value={tempInvoice.name} onChange={e => setTempInvoice({...tempInvoice, name: e.target.value})} />
                      <input placeholder="Cloud Storage URL" className="bg-white border border-slate-200 p-4 rounded-2xl text-sm font-bold outline-none" value={tempInvoice.url} onChange={e => setTempInvoice({...tempInvoice, url: e.target.value})} />
                      <button type="button" onClick={() => { if(tempInvoice.name && tempInvoice.url) { setNewClub({...newClub, invoices: [...(newClub.invoices||[]), {...tempInvoice, id: Math.random().toString(36).substr(2,9), date: new Date().toISOString().split('T')[0]}]}); setTempInvoice({name:'', url:''}); }}} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg col-span-full">Attach Record</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(newClub.invoices || []).map(inv => (
                      <div key={inv.id} className="flex items-center justify-between p-5 border border-slate-100 rounded-[1.5rem] bg-white group hover:shadow-md transition-all">
                        <div className="min-w-0">
                          <span className="text-[10px] font-black text-slate-700 uppercase truncate block">{inv.name}</span>
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Uploaded {inv.date}</span>
                        </div>
                        <button type="button" onClick={() => setNewClub({...newClub, invoices: (newClub.invoices||[]).filter(i=>i.id!==inv.id)})} className="text-red-400 hover:text-red-600 p-2"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-10 py-8 bg-white border-t flex gap-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4.5 bg-slate-100 text-slate-500 font-black rounded-[1.5rem] uppercase text-[10px] tracking-widest">Discard Changes</button>
              <button form="clubForm" type="submit" onClick={(e) => { if(modalTab !== 'details') handleSubmit(e as any) }} className="flex-[2] py-4.5 bg-[#D91B5C] text-white font-black rounded-[1.5rem] uppercase text-[10px] tracking-widest shadow-xl">Apply Master Updates</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

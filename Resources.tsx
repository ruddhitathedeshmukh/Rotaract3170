
import React, { useState, useMemo } from 'react';

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  category: 'Governance' | 'Branding' | 'Reporting' | 'Finance';
  type: 'PDF' | 'ZIP' | 'Link' | 'DOCX';
  url: string;
}

const RESOURCES_DATA: ResourceItem[] = [
  {
    id: '1',
    title: 'District 3170 Bylaws 2024-25',
    description: 'The updated official constitution and operational guidelines for all clubs within District 3170.',
    category: 'Governance',
    type: 'PDF',
    url: '#'
  },
  {
    id: '2',
    title: 'Rotaract Brand Identity Kit',
    description: 'Master logo files, typography guidelines, and social media templates for consistent club branding.',
    category: 'Branding',
    type: 'ZIP',
    url: '#'
  },
  {
    id: '3',
    title: 'Impact Reporting Handbook',
    description: 'Step-by-step guide on how to accurately calculate Community Capital and Service Hours for projects.',
    category: 'Reporting',
    type: 'PDF',
    url: '#'
  },
  {
    id: '4',
    title: 'Member Induction Template',
    description: 'Standard format for certificate printing and official induction ceremonies.',
    category: 'Governance',
    type: 'DOCX',
    url: '#'
  },
  {
    id: '5',
    title: 'Financial Audit Excel Sheet',
    description: 'Pre-formatted spreadsheet for club treasurers to maintain quarterly transparency and dues records.',
    category: 'Finance',
    type: 'Link',
    url: '#'
  },
  {
    id: '6',
    title: 'District Event Permit Form',
    description: 'Mandatory form to be submitted 15 days prior to any multi-district or zone-level event.',
    category: 'Reporting',
    type: 'PDF',
    url: '#'
  }
];

const Resources: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Governance', 'Branding', 'Reporting', 'Finance'];

  const filteredResources = useMemo(() => {
    return RESOURCES_DATA.filter(res => {
      const matchesSearch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           res.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || res.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, activeCategory]);

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'PDF': return 'bg-red-50 text-red-600 border-red-100';
      case 'ZIP': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'Link': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'DOCX': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Resource Toolkit</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Official materials for club administration</p>
          
          <div className="mt-8 flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeCategory === cat 
                  ? 'bg-[#0050A1] text-white shadow-lg shadow-blue-100' 
                  : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        <div className="relative w-full md:w-72">
          <input 
            type="text" 
            placeholder="Search resources..." 
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredResources.length > 0 ? (
          filteredResources.map((res) => (
            <div key={res.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all group flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${getTypeColor(res.type)}`}>
                  {res.type}
                </div>
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </div>
              </div>
              
              <div className="flex-1">
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest leading-snug group-hover:text-[#0050A1] transition-colors">{res.title}</h4>
                <p className="text-[11px] font-medium text-slate-500 mt-3 leading-relaxed">
                  {res.description}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{res.category}</span>
                <a 
                  href={res.url}
                  className="text-[9px] font-black text-[#D91B5C] uppercase tracking-widest flex items-center gap-1 hover:translate-x-1 transition-transform"
                >
                  Access File
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No matching toolkit items found</p>
          </div>
        )}
      </div>

      <div className="bg-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-100 mt-12">
        <div className="relative z-10 max-w-2xl">
          <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Need specific support?</h3>
          <p className="text-xs font-medium text-indigo-200 leading-relaxed uppercase tracking-wide">
            If you require a specialized template or can't find a specific governing document, please reach out to the District Secretariat at <span className="text-white font-bold">secretariat@rid3170.org</span>
          </p>
        </div>
        <div className="absolute right-0 top-0 -mr-16 -mt-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Resources;

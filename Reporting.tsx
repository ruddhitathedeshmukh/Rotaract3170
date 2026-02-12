import React, { useState, useEffect } from 'react';
import { ClubMetrics } from './types';

interface ReportingProps {
  metrics: ClubMetrics;
  onUpdateMetrics?: (metrics: ClubMetrics) => void;
  pointsEarned: number;
}

const Reporting: React.FC<ReportingProps> = ({ metrics, onUpdateMetrics, pointsEarned }) => {
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [tempMetrics, setTempMetrics] = useState<ClubMetrics>({
    communityCapital: '0',
    serviceHours: '0',
    livesTouched: '0',
    rotaractersInAction: '0',
    totalPoints: '0'
  });

  useEffect(() => {
    if (metrics) {
      setTempMetrics(metrics);
    }
  }, [metrics]);

  const handleUpdateImpactMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateMetrics) return;
    setIsSavingReport(true);
    try {
      await onUpdateMetrics(tempMetrics);
      alert('Monthly impact report submitted successfully.');
    } catch (err) {
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsSavingReport(false);
    }
  };

  const totalPoints = (Number(metrics?.totalPoints || '0') + pointsEarned).toLocaleString();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Impact Reporting</h2>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Submit your club's performance metrics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
            <div className="w-1.5 h-4 bg-[#D91B5C] rounded-full"></div> Monthly Performance Entry
          </h3>
          <form onSubmit={handleUpdateImpactMetrics} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Community Capital (₹)</label>
                <input 
                  type="number" 
                  required 
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-800"
                  value={tempMetrics.communityCapital}
                  onChange={e => setTempMetrics({...tempMetrics, communityCapital: e.target.value})}
                  placeholder="Total funds utilized"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Hours</label>
                <input 
                  type="number" 
                  required 
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800"
                  value={tempMetrics.serviceHours}
                  onChange={e => setTempMetrics({...tempMetrics, serviceHours: e.target.value})}
                  placeholder="Cumulative hours"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Lives Touched</label>
                <input 
                  type="number" 
                  required 
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold text-slate-800"
                  value={tempMetrics.livesTouched}
                  onChange={e => setTempMetrics({...tempMetrics, livesTouched: e.target.value})}
                  placeholder="Beneficiaries count"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Rotaracters Active</label>
                <input 
                  type="number" 
                  required 
                  className="w-full bg-slate-50 border border-slate-100 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-slate-800"
                  value={tempMetrics.rotaractersInAction}
                  onChange={e => setTempMetrics({...tempMetrics, rotaractersInAction: e.target.value})}
                  placeholder="Unique members active"
                />
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isSavingReport}
                className={`w-full h-16 bg-[#D91B5C] text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-pink-100 transition-all ${isSavingReport ? 'opacity-70 cursor-wait' : 'hover:scale-[1.01] active:scale-95'}`}
              >
                {isSavingReport ? 'Synchronizing with District...' : 'Finalize Monthly Report'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0050A1] p-10 rounded-[2.5rem] shadow-xl shadow-blue-100 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em] mb-2">District Scoring Status</h3>
              <p className="text-4xl font-black mb-4">{totalPoints} <span className="text-lg font-bold text-blue-300">Points</span></p>
              <div className="h-1.5 w-full bg-blue-900/50 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: '65%' }}></div>
              </div>
              <p className="text-[10px] font-bold text-blue-300 mt-4 uppercase tracking-widest leading-relaxed">Your club is currently in the Top 20% of the district. Keep reporting projects to climb the leaderboard.</p>
            </div>
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6">
            <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Reporting Guidelines</h4>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter leading-relaxed">Ensure all data is accurate. District Admin team conducts spot audits on reported service hours.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reporting;
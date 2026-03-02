import React, { useState } from 'react';

interface ClubServiceFormProps {
  selectedMonth: { name: string; year: number };
  onBack: () => void;
  onSubmit: (data: any) => void;
}

const ClubServiceForm: React.FC<ClubServiceFormProps> = ({ selectedMonth, onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    date: '',
    venue: '',
    projectChair: '',
    description: '',
    attendance: {
      clubRotaractors: 0,
      visitingRotaractors: 0,
      rotarians: 0,
      interactors: 0,
      others: 0,
    },
    photos: [] as File[],
    declaration: false,
    additionalPoints: {
      installationBefore31Aug: false,
      installationAfter31Aug: false,
      drrVisit: false,
      clubRecords: false,
      adherenceProcedures: false,
      clubBulletin: false,
      charterDay: false,
      riRecognition: false,
      presidentialCitation: false,
      bestProjectMDIO: false,
      awardRecognition: false,
    }
  });

  const [photoError, setPhotoError] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const calculateAttendancePoints = () => {
    const { clubRotaractors, rotarians, interactors } = formData.attendance;
    return (clubRotaractors * 200) + (rotarians * 300) + (interactors * 100);
  };

  const calculateTotalAttendance = () => {
    const { clubRotaractors, visitingRotaractors, rotarians, interactors, others } = formData.attendance;
    return clubRotaractors + visitingRotaractors + rotarians + interactors + others;
  };

  const calculateAdditionalPoints = () => {
    let points = 0;
    const ap = formData.additionalPoints;
    if (ap.installationBefore31Aug) points += 1000;
    if (ap.installationAfter31Aug) points += 500;
    if (ap.drrVisit) points += 1500;
    if (ap.clubRecords) points += 700;
    if (ap.adherenceProcedures) points += 500;
    if (ap.clubBulletin) points += 500;
    if (ap.charterDay) points += 1000;
    if (ap.riRecognition) points += 1000;
    if (ap.presidentialCitation) points += 1000;
    if (ap.bestProjectMDIO) points += 1000;
    if (ap.awardRecognition) points += 500;
    return points;
  };

  const calculateTotalPoints = () => {
    const basePoints = 200; // Base points for Club Service project
    const attendancePoints = calculateAttendancePoints();
    const additionalPoints = calculateAdditionalPoints();
    return basePoints + attendancePoints + additionalPoints;
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    setPhotoError('');

    if (files.length > 5) {
      setPhotoError('Maximum 5 photos allowed');
      return;
    }

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const maxSize = 1024 * 1024; // 1MB in bytes

    if (totalSize > maxSize) {
      setPhotoError('Total size of all photos must not exceed 1MB. Please upload smaller photos.');
      return;
    }

    setFormData({ ...formData, photos: files });
  };

  const handleGenerateDescription = async () => {
    setIsGeneratingDescription(true);
    // Simulate AI generation - in production, this would call an AI API
    setTimeout(() => {
      // Multiple description templates for variety
      const templates = [
        // Template 1: Team Building-focused
        `Our club service project, conducted on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}, strengthened our club's internal bonds and operational excellence. Led by ${formData.projectChair || '[project chair]'}, this initiative focused on enhancing club effectiveness and member engagement. The project brought together club members in a spirit of collaboration and mutual growth. Through this initiative, we reinforced our commitment to building a strong, united club that serves as a foundation for impactful community service.`,
        
        // Template 2: Organizational Excellence-focused
        `This club service project was successfully executed on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}. Under the guidance of ${formData.projectChair || '[project chair]'}, we focused on improving our club's organizational structure and operational efficiency. The initiative witnessed active participation from club members, fostering a culture of excellence and accountability. This project demonstrated our dedication to maintaining high standards of club governance and member development.`,
        
        // Template 3: Member Development-focused
        `On ${formData.date || '[date]'}, we organized a transformative club service project at ${formData.venue || '[venue]'}, spearheaded by ${formData.projectChair || '[project chair]'}. This member-focused initiative aimed at developing leadership skills and enhancing club participation. The project created opportunities for personal growth and skill development among our members. Through this effort, we exemplified our commitment to nurturing future leaders and building a sustainable club culture.`,
        
        // Template 4: Club Culture-focused
        `The club service project held on ${formData.date || '[date]'} at ${formData.venue || '[venue]'} was a celebration of our club's values and traditions. ${formData.projectChair || '[project chair]'} led this initiative that brought members together to strengthen our club identity and camaraderie. The project fostered a sense of belonging and shared purpose among all participants. This initiative showcased our dedication to building a vibrant, inclusive club environment where every member thrives.`,
        
        // Template 5: Strategic Planning-focused
        `Our club successfully conducted a strategic club service project on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}, championed by ${formData.projectChair || '[project chair]'}. The initiative focused on planning and organizing club activities for maximum impact. Through collaborative discussions and strategic thinking, we charted a clear path forward for our club. This project reflects our commitment to thoughtful planning and effective execution of our club's mission.`,
        
        // Template 6: Recognition and Celebration-focused
        `An inspiring club service project was conducted on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}, under the dynamic leadership of ${formData.projectChair || '[project chair]'}. This initiative celebrated our club's achievements and recognized outstanding member contributions. The project created a positive atmosphere of appreciation and motivation among all members. Through this celebration, we demonstrated how recognition and gratitude strengthen our club's foundation and inspire continued excellence.`
      ];
      
      // Randomly select a template
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      setFormData({ ...formData, description: randomTemplate });
      setIsGeneratingDescription(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.declaration) {
      alert('Please accept the declaration to submit the form');
      return;
    }
    
    // Prepare submission data
    const submissionData = {
      ...formData,
      totalAttendance: calculateTotalAttendance(),
      totalPoints: calculateTotalPoints(),
      attendancePoints: calculateAttendancePoints(),
      additionalPoints: calculateAdditionalPoints(),
    };
    
    // Call parent onSubmit handler
    onSubmit(submissionData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-[#D91B5C] transition-colors mb-4"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-black text-sm uppercase tracking-widest">Back to Categories</span>
          </button>
          <h3 className="text-2xl font-black text-slate-900">Club Service Avenue</h3>
          <p className="text-sm text-slate-500 mt-1">Submit project details for this category</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Date *
            </label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Venue *
            </label>
            <input
              type="text"
              required
              value={formData.venue}
              onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
              placeholder="Location of the project"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Project Name *
            </label>
            <input
              type="text"
              required
              value={formData.projectName}
              onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
              placeholder="Enter project name"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Project Chair *
            </label>
            <input
              type="text"
              required
              value={formData.projectChair}
              onChange={(e) => setFormData({ ...formData, projectChair: e.target.value })}
              placeholder="Name of project chair"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Description (About 100 words) *
            </label>
            <div className="relative">
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Detailed description of the project..."
                className="w-full bg-slate-50 border border-slate-200 p-4 pr-40 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold resize-none"
              />
              <button
                type="button"
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription}
                className="absolute top-2 right-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {isGeneratingDescription ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Rewrite by AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Attendance Section */}
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Attendance Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.attendance.clubRotaractors > 0}
                onChange={(e) => setFormData({
                  ...formData,
                  attendance: { ...formData.attendance, clubRotaractors: e.target.checked ? 1 : 0 }
                })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="text-xs font-black text-slate-600 uppercase">Club Rotaractors</div>
                <div className="text-xs text-slate-500 mt-1">200 pts/person</div>
              </div>
              {formData.attendance.clubRotaractors > 0 && (
                <input
                  type="number"
                  min="1"
                  value={formData.attendance.clubRotaractors}
                  onChange={(e) => setFormData({
                    ...formData,
                    attendance: { ...formData.attendance, clubRotaractors: parseInt(e.target.value) || 0 }
                  })}
                  className="w-16 p-2 border border-blue-300 rounded-lg text-center font-bold"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </label>

            <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.attendance.visitingRotaractors > 0}
                onChange={(e) => setFormData({
                  ...formData,
                  attendance: { ...formData.attendance, visitingRotaractors: e.target.checked ? 1 : 0 }
                })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="text-xs font-black text-slate-600 uppercase">Visiting Rotaractors</div>
                <div className="text-xs text-slate-500 mt-1">No points</div>
              </div>
              {formData.attendance.visitingRotaractors > 0 && (
                <input
                  type="number"
                  min="1"
                  value={formData.attendance.visitingRotaractors}
                  onChange={(e) => setFormData({
                    ...formData,
                    attendance: { ...formData.attendance, visitingRotaractors: parseInt(e.target.value) || 0 }
                  })}
                  className="w-16 p-2 border border-blue-300 rounded-lg text-center font-bold"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </label>

            <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.attendance.rotarians > 0}
                onChange={(e) => setFormData({
                  ...formData,
                  attendance: { ...formData.attendance, rotarians: e.target.checked ? 1 : 0 }
                })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="text-xs font-black text-slate-600 uppercase">Rotarians</div>
                <div className="text-xs text-slate-500 mt-1">300 pts/person</div>
              </div>
              {formData.attendance.rotarians > 0 && (
                <input
                  type="number"
                  min="1"
                  value={formData.attendance.rotarians}
                  onChange={(e) => setFormData({
                    ...formData,
                    attendance: { ...formData.attendance, rotarians: parseInt(e.target.value) || 0 }
                  })}
                  className="w-16 p-2 border border-blue-300 rounded-lg text-center font-bold"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </label>

            <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.attendance.interactors > 0}
                onChange={(e) => setFormData({
                  ...formData,
                  attendance: { ...formData.attendance, interactors: e.target.checked ? 1 : 0 }
                })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="text-xs font-black text-slate-600 uppercase">Interactors</div>
                <div className="text-xs text-slate-500 mt-1">100 pts/person</div>
              </div>
              {formData.attendance.interactors > 0 && (
                <input
                  type="number"
                  min="1"
                  value={formData.attendance.interactors}
                  onChange={(e) => setFormData({
                    ...formData,
                    attendance: { ...formData.attendance, interactors: parseInt(e.target.value) || 0 }
                  })}
                  className="w-16 p-2 border border-blue-300 rounded-lg text-center font-bold"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </label>

            <label className="flex items-center gap-3 bg-white p-4 rounded-xl border border-blue-200 cursor-pointer hover:border-blue-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.attendance.others > 0}
                onChange={(e) => setFormData({
                  ...formData,
                  attendance: { ...formData.attendance, others: e.target.checked ? 1 : 0 }
                })}
                className="w-5 h-5 text-blue-600 rounded"
              />
              <div className="flex-1">
                <div className="text-xs font-black text-slate-600 uppercase">Others</div>
                <div className="text-xs text-slate-500 mt-1">No points</div>
              </div>
              {formData.attendance.others > 0 && (
                <input
                  type="number"
                  min="1"
                  value={formData.attendance.others}
                  onChange={(e) => setFormData({
                    ...formData,
                    attendance: { ...formData.attendance, others: parseInt(e.target.value) || 0 }
                  })}
                  className="w-16 p-2 border border-blue-300 rounded-lg text-center font-bold"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
            </label>

            <div className="bg-blue-100 p-4 rounded-xl border border-blue-200">
              <div className="text-xs font-black text-blue-700 uppercase mb-2">Total Attendance</div>
              <div className="text-2xl font-black text-blue-700">{calculateTotalAttendance()}</div>
              <div className="text-xs text-blue-600 mt-1">Attendance Points: {calculateAttendancePoints()}</div>
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
            Add Photos (Max 5, Total size ≤ 1MB) *
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            required
            onChange={handlePhotoUpload}
            className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
          />
          {photoError && (
            <p className="text-red-600 text-sm font-bold mt-2">⚠️ {photoError}</p>
          )}
          {formData.photos.length > 0 && (
            <p className="text-emerald-600 text-sm font-bold mt-2">✓ {formData.photos.length} photo(s) selected</p>
          )}
        </div>

        {/* Additional Points Section */}
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
          <h4 className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-4">Additional Points (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.installationBefore31Aug}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, installationBefore31Aug: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">Installations before 31st August 2026</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+1000 points</div>
              </div>
            </label>

            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.installationAfter31Aug}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, installationAfter31Aug: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">Installations after 31st August 2026</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+500 points</div>
              </div>
            </label>

            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.drrVisit}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, drrVisit: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">Arranging the DRR's Official Visit</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+1500 points</div>
              </div>
            </label>

            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.clubRecords}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, clubRecords: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">Maintaining all the Club Records</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+700 points</div>
              </div>
            </label>

            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.adherenceProcedures}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, adherenceProcedures: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">Adherence to all the Procedures/Protocols</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+500 points</div>
              </div>
            </label>

            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.clubBulletin}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, clubBulletin: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">For every Club Bulletin Published</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+500 points</div>
              </div>
            </label>

            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.charterDay}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, charterDay: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">Charter Day Celebration</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+1000 points</div>
              </div>
            </label>

            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.riRecognition}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, riRecognition: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">RI Recognition for Outstanding Project</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+1000 points</div>
              </div>
            </label>

            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.presidentialCitation}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, presidentialCitation: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">RI Presidential Citation Award</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+1000 points</div>
              </div>
            </label>

            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.bestProjectMDIO}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, bestProjectMDIO: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">Winning Best Project from MDIO (RSAMDIO & SEARIC)</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+1000 points</div>
              </div>
            </label>

            <label className="flex items-start gap-3 bg-white p-4 rounded-xl border border-emerald-200 cursor-pointer hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.additionalPoints.awardRecognition}
                onChange={(e) => setFormData({
                  ...formData,
                  additionalPoints: { ...formData.additionalPoints, awardRecognition: e.target.checked }
                })}
                className="w-5 h-5 text-emerald-600 rounded mt-1"
              />
              <div>
                <div className="text-sm font-bold text-slate-700">Getting Award or Recognition to Club or Club member from any Organization</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+500 points</div>
              </div>
            </label>
          </div>
        </div>

        {/* Points Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
          <h4 className="text-sm font-black text-purple-700 uppercase tracking-widest mb-4">Points Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl">
              <div className="text-xs text-slate-500 font-bold">Base Points</div>
              <div className="text-2xl font-black text-purple-700">200</div>
            </div>
            <div className="bg-white p-4 rounded-xl">
              <div className="text-xs text-slate-500 font-bold">Attendance Points</div>
              <div className="text-2xl font-black text-blue-700">{calculateAttendancePoints()}</div>
            </div>
            <div className="bg-white p-4 rounded-xl">
              <div className="text-xs text-slate-500 font-bold">Additional Points</div>
              <div className="text-2xl font-black text-emerald-700">{calculateAdditionalPoints()}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border-2 border-purple-400">
              <div className="text-xs text-purple-700 font-black uppercase">Total Points</div>
              <div className="text-3xl font-black text-purple-700">{calculateTotalPoints()}</div>
            </div>
          </div>
        </div>

        {/* Declaration Checkbox */}
        <div className="bg-orange-50 p-6 rounded-2xl border-2 border-orange-200">
          <label className="flex items-start gap-4 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={formData.declaration}
              onChange={(e) => setFormData({ ...formData, declaration: e.target.checked })}
              className="w-6 h-6 text-orange-600 rounded mt-1"
            />
            <div>
              <div className="text-sm font-black text-slate-900">
                I hereby declare the above information is true to the best of my knowledge *
              </div>
              <div className="text-xs text-slate-600 mt-1">
                This declaration is required to submit the form. The form will be sent for admin approval.
              </div>
            </div>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!formData.declaration}
            className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all ${
              formData.declaration
                ? 'bg-[#D91B5C] text-white hover:scale-[1.01]'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            Submit for Approval
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-8 bg-slate-200 text-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClubServiceForm;
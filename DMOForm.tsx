import React, { useState } from 'react';

interface DMOFormProps {
  selectedMonth: { name: string; year: number };
  onBack: () => void;
  onSubmit: (data: any) => void;
}

const DMOForm: React.FC<DMOFormProps> = ({ selectedMonth, onBack, onSubmit }) => {
  const [formData, setFormData] = useState({
    projectName: '',
    date: '',
    venue: '',
    projectChair: '',
    description: '',
    communityCapitalDeployed: '',
    livesTouched: 0,
    serviceHours: 0,
    attendance: {
      clubRotaractors: 0,
      visitingRotaractors: 0,
      rotarians: 0,
      interactors: 0,
      others: 0,
    },
    photos: [] as File[],
    newsPublicationEnabled: false,
    newsPublicationImage: null as File | null,
    newsPublicationLink: '',
    newsTelecastingEnabled: false,
    newsTelecastingLink: '',
    womenEmpowerment: false,
    organizingClubService: false,
    organizingCommunityService: false,
    organizingProfessionalService: false,
    organizingInternationalService: false,
    declaration: false,
  });

  const [photoError, setPhotoError] = useState('');
  const [newsImageError, setNewsImageError] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);

  const calculateAttendancePoints = () => {
    const { clubRotaractors, rotarians, interactors } = formData.attendance;
    return (clubRotaractors * 200) + (rotarians * 300) + (interactors * 100);
  };

  const calculateTotalAttendance = () => {
    const { clubRotaractors, visitingRotaractors, rotarians, interactors, others } = formData.attendance;
    return clubRotaractors + visitingRotaractors + rotarians + interactors + others;
  };

  const calculateNewsPoints = () => {
    let points = 0;
    if (formData.newsPublicationEnabled) points += 100;
    if (formData.newsTelecastingEnabled) points += 300;
    return points;
  };

  const calculateCategoryPoints = () => {
    let points = 0;
    if (formData.womenEmpowerment) points += 400;
    if (formData.organizingClubService) points += 200;
    if (formData.organizingCommunityService) points += 500;
    if (formData.organizingProfessionalService) points += 500;
    if (formData.organizingInternationalService) points += 300;
    return points;
  };

  const calculateTotalPoints = () => {
    const basePoints = 800; // Base points for DMO project
    const attendancePoints = calculateAttendancePoints();
    const newsPoints = calculateNewsPoints();
    const categoryPoints = calculateCategoryPoints();
    return basePoints + attendancePoints + newsPoints + categoryPoints;
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

  const handleNewsImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setNewsImageError('');

    if (!file) return;

    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      setNewsImageError('Image size must not exceed 1MB. Please upload a smaller image.');
      return;
    }

    setFormData({ ...formData, newsPublicationImage: file });
  };

  const handleGenerateDescription = async () => {
    setIsGeneratingDescription(true);
    // Simulate AI generation - in production, this would call an AI API
    setTimeout(() => {
      // Multiple description templates for variety
      const templates = [
        // Template 1: Impact-focused
        `Our Designated Monthly Observation project, held on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}, made a significant impact in the community. Led by ${formData.projectChair || '[project chair]'}, the initiative reached ${formData.livesTouched || '[number]'} beneficiaries through ${formData.serviceHours || '[number]'} hours of dedicated service. With an investment of ₹${formData.communityCapitalDeployed || '[amount]'}, we created meaningful change. The project brought together rotaractors, rotarians, and community members in a spirit of collaboration, demonstrating the power of collective action for social good.`,
        
        // Template 2: Achievement-focused
        `This DMO project was a remarkable success, conducted on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}. Under the guidance of ${formData.projectChair || '[project chair]'}, our team achieved outstanding results by touching ${formData.livesTouched || '[number]'} lives. The project involved ${formData.serviceHours || '[number]'} hours of committed service and utilized ₹${formData.communityCapitalDeployed || '[amount]'} effectively. The enthusiastic participation from all stakeholders made this initiative a testament to our club's dedication to community service and social responsibility.`,
        
        // Template 3: Community-focused
        `On ${formData.date || '[date]'}, we organized a transformative DMO project at ${formData.venue || '[venue]'}, spearheaded by ${formData.projectChair || '[project chair]'}. This community-driven initiative positively impacted ${formData.livesTouched || '[number]'} individuals through ${formData.serviceHours || '[number]'} hours of selfless service. With a budget of ₹${formData.communityCapitalDeployed || '[amount]'}, we addressed critical community needs. The project exemplified the Rotaract spirit of service above self, bringing together diverse groups to create lasting positive change in our society.`,
        
        // Template 4: Collaborative-focused
        `The Designated Monthly Observation project held on ${formData.date || '[date]'} at ${formData.venue || '[venue]'} was a collaborative triumph. ${formData.projectChair || '[project chair]'} led a dedicated team that served ${formData.livesTouched || '[number]'} beneficiaries over ${formData.serviceHours || '[number]'} hours. Through strategic deployment of ₹${formData.communityCapitalDeployed || '[amount]'}, we maximized our impact. This initiative showcased the strength of partnership between rotaractors, rotarians, and community stakeholders, reinforcing our commitment to creating sustainable social change.`,
        
        // Template 5: Mission-focused
        `Our club successfully executed a DMO project on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}, championed by ${formData.projectChair || '[project chair]'}. The initiative served ${formData.livesTouched || '[number]'} community members through ${formData.serviceHours || '[number]'} hours of purposeful engagement. With ₹${formData.communityCapitalDeployed || '[amount]'} in resources, we delivered impactful outcomes. This project reflects our unwavering commitment to the Rotaract mission of developing leadership through service, fostering unity, and building a better tomorrow for all.`,
        
        // Template 6: Innovation-focused
        `An innovative DMO project was conducted on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}, under the dynamic leadership of ${formData.projectChair || '[project chair]'}. Our creative approach reached ${formData.livesTouched || '[number]'} beneficiaries, investing ${formData.serviceHours || '[number]'} hours of dedicated effort. The project efficiently utilized ₹${formData.communityCapitalDeployed || '[amount]'} to maximize community benefit. Through collaborative innovation and passionate service, we demonstrated how Rotaract clubs can be catalysts for meaningful social transformation.`
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
    
    // Validate news publication/telecasting
    if (formData.newsPublicationEnabled && !formData.newsPublicationImage && !formData.newsPublicationLink) {
      alert('Please upload news article image or provide news link');
      return;
    }
    
    if (formData.newsTelecastingEnabled && !formData.newsTelecastingLink) {
      alert('Please provide news telecasting link');
      return;
    }
    
    // Prepare submission data
    const submissionData = {
      ...formData,
      category: 'dmo',
      totalAttendance: calculateTotalAttendance(),
      totalPoints: calculateTotalPoints(),
      attendancePoints: calculateAttendancePoints(),
      newsPoints: calculateNewsPoints(),
      categoryPoints: calculateCategoryPoints(),
      month: selectedMonth.name,
      year: selectedMonth.year,
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
          <h3 className="text-2xl font-black text-slate-900">Designated Monthly Observation (DMO)</h3>
          <p className="text-sm text-slate-500 mt-1">Submit project details for DMO category</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
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

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Community Capital Deployed *
            </label>
            <input
              type="text"
              required
              value={formData.communityCapitalDeployed}
              onChange={(e) => setFormData({ ...formData, communityCapitalDeployed: e.target.value })}
              placeholder="Enter amount (e.g., 50000)"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Lives Touched *
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.livesTouched}
              onChange={(e) => setFormData({ ...formData, livesTouched: parseInt(e.target.value) || 0 })}
              placeholder="Number of beneficiaries"
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Service Hours *
            </label>
            <input
              type="number"
              required
              min="0"
              value={formData.serviceHours}
              onChange={(e) => setFormData({ ...formData, serviceHours: parseInt(e.target.value) || 0 })}
              placeholder="Mention invested hours"
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
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-100">
          <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Attendance
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Club Rotaractors (200 pts each)
              </label>
              <input
                type="number"
                min="0"
                value={formData.attendance.clubRotaractors}
                onChange={(e) => setFormData({
                  ...formData,
                  attendance: { ...formData.attendance, clubRotaractors: parseInt(e.target.value) || 0 }
                })}
                className="w-full bg-white border border-blue-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Visiting Rotaractors
              </label>
              <input
                type="number"
                min="0"
                value={formData.attendance.visitingRotaractors}
                onChange={(e) => setFormData({
                  ...formData,
                  attendance: { ...formData.attendance, visitingRotaractors: parseInt(e.target.value) || 0 }
                })}
                className="w-full bg-white border border-blue-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Rotarians (300 pts each)
              </label>
              <input
                type="number"
                min="0"
                value={formData.attendance.rotarians}
                onChange={(e) => setFormData({
                  ...formData,
                  attendance: { ...formData.attendance, rotarians: parseInt(e.target.value) || 0 }
                })}
                className="w-full bg-white border border-blue-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Interactors (100 pts each)
              </label>
              <input
                type="number"
                min="0"
                value={formData.attendance.interactors}
                onChange={(e) => setFormData({
                  ...formData,
                  attendance: { ...formData.attendance, interactors: parseInt(e.target.value) || 0 }
                })}
                className="w-full bg-white border border-blue-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Others
              </label>
              <input
                type="number"
                min="0"
                value={formData.attendance.others}
                onChange={(e) => setFormData({
                  ...formData,
                  attendance: { ...formData.attendance, others: parseInt(e.target.value) || 0 }
                })}
                className="w-full bg-white border border-blue-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>

            <div className="flex items-end">
              <div className="w-full bg-blue-600 text-white p-3 rounded-xl">
                <div className="text-xs font-black uppercase tracking-widest mb-1">Total Attendance</div>
                <div className="text-2xl font-black">{calculateTotalAttendance()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Photos Upload */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
          <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Photos (Max 5, Total 1MB)
          </h4>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            className="w-full bg-white border border-purple-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 font-bold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-black file:bg-purple-600 file:text-white hover:file:bg-purple-700"
          />
          {photoError && (
            <p className="text-red-600 text-sm font-bold mt-2">{photoError}</p>
          )}
          {formData.photos.length > 0 && (
            <p className="text-purple-600 text-sm font-bold mt-2">
              {formData.photos.length} photo(s) selected
            </p>
          )}
        </div>

        {/* News Publication & Telecasting */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl border border-green-100">
          <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            News Coverage
          </h4>

          {/* News Publication Toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.newsPublicationEnabled}
                  onChange={(e) => setFormData({ ...formData, newsPublicationEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
              </div>
              <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
                News Publication (+100 pts)
              </span>
            </label>
          </div>

          {formData.newsPublicationEnabled && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pl-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Upload News Article
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewsImageUpload}
                  className="w-full bg-white border border-green-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 font-bold file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-black file:bg-green-600 file:text-white hover:file:bg-green-700"
                />
                {newsImageError && (
                  <p className="text-red-600 text-sm font-bold mt-2">{newsImageError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  News Link
                </label>
                <input
                  type="url"
                  value={formData.newsPublicationLink}
                  onChange={(e) => setFormData({ ...formData, newsPublicationLink: e.target.value })}
                  placeholder="Paste news article link"
                  className="w-full bg-white border border-green-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
                />
              </div>
            </div>
          )}

          {/* News Telecasting Toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.newsTelecastingEnabled}
                  onChange={(e) => setFormData({ ...formData, newsTelecastingEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-600"></div>
              </div>
              <span className="text-sm font-black text-slate-700 uppercase tracking-widest">
                News Telecasting on Local Channel (+300 pts)
              </span>
            </label>
          </div>

          {formData.newsTelecastingEnabled && (
            <div className="pl-6">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Telecasting Link *
              </label>
              <input
                type="url"
                required={formData.newsTelecastingEnabled}
                value={formData.newsTelecastingLink}
                onChange={(e) => setFormData({ ...formData, newsTelecastingLink: e.target.value })}
                placeholder="Paste the link of news report (if offline video, upload to social media and paste link)"
                className="w-full bg-white border border-green-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 font-bold"
              />
            </div>
          )}
        </div>

        {/* Project Category Checkboxes */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-2xl border border-orange-100">
          <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            Additional Categories
          </h4>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-xl hover:bg-orange-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.womenEmpowerment}
                onChange={(e) => setFormData({ ...formData, womenEmpowerment: e.target.checked })}
                className="w-5 h-5 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-black text-slate-700">Women Empowerment (+400 pts)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-xl hover:bg-orange-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.organizingClubService}
                onChange={(e) => setFormData({ ...formData, organizingClubService: e.target.checked })}
                className="w-5 h-5 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-black text-slate-700">Organizing Club Service Project (+200 pts)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-xl hover:bg-orange-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.organizingCommunityService}
                onChange={(e) => setFormData({ ...formData, organizingCommunityService: e.target.checked })}
                className="w-5 h-5 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-black text-slate-700">Organizing Community Service Project (+500 pts)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-xl hover:bg-orange-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.organizingProfessionalService}
                onChange={(e) => setFormData({ ...formData, organizingProfessionalService: e.target.checked })}
                className="w-5 h-5 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-black text-slate-700">Organizing Professional Service Project (+500 pts)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-xl hover:bg-orange-50 transition-colors">
              <input
                type="checkbox"
                checked={formData.organizingInternationalService}
                onChange={(e) => setFormData({ ...formData, organizingInternationalService: e.target.checked })}
                className="w-5 h-5 text-orange-600 border-orange-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-black text-slate-700">Organizing International Service Project (+300 pts)</span>
            </label>
          </div>
        </div>

        {/* Points Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
          <h4 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Points Summary
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-xs text-slate-500 font-bold">Base Points</div>
              <div className="text-2xl font-black text-purple-700">800</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-xs text-slate-500 font-bold">Attendance</div>
              <div className="text-2xl font-black text-blue-700">{calculateAttendancePoints()}</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-xs text-slate-500 font-bold">News Coverage</div>
              <div className="text-2xl font-black text-green-700">{calculateNewsPoints()}</div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="text-xs text-slate-500 font-bold">Categories</div>
              <div className="text-2xl font-black text-orange-700">{calculateCategoryPoints()}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border-2 border-purple-400 shadow-sm">
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
                This declaration is required to submit the form. The form will be sent for admin approval and points will be claimed upon approval.
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

export default DMOForm;
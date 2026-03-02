import React, { useState } from 'react';

interface ProfessionalServiceFormProps {
  selectedMonth: { name: string; year: number };
  onBack: () => void;
  onSubmit: (data: any) => void;
}

const ProfessionalServiceForm: React.FC<ProfessionalServiceFormProps> = ({ selectedMonth, onBack, onSubmit }) => {
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
    mahadhanProject: false,
    generalPublicAttendance: '' as '' | '100-300' | '500+' | '1000+',
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

  const calculateWomenEmpowermentPoints = () => {
    return formData.womenEmpowerment ? 400 : 0;
  };

  const calculateMahadhanPoints = () => {
    return formData.mahadhanProject ? 700 : 0;
  };

  const calculateGeneralPublicPoints = () => {
    switch (formData.generalPublicAttendance) {
      case '100-300': return 500;
      case '500+': return 700;
      case '1000+': return 1000;
      default: return 0;
    }
  };

  const calculateTotalPoints = () => {
    const basePoints = 500; // Base points for Professional Service project
    const attendancePoints = calculateAttendancePoints();
    const newsPoints = calculateNewsPoints();
    const womenEmpowermentPoints = calculateWomenEmpowermentPoints();
    const mahadhanPoints = calculateMahadhanPoints();
    const generalPublicPoints = calculateGeneralPublicPoints();
    return basePoints + attendancePoints + newsPoints + womenEmpowermentPoints + mahadhanPoints + generalPublicPoints;
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
        // Template 1: Professional Development-focused
        `Our professional service project, conducted on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}, focused on enhancing professional skills and career development. Led by ${formData.projectChair || '[project chair]'}, the initiative benefited ${formData.livesTouched || '[number]'} participants through ${formData.serviceHours || '[number]'} hours of expert-led sessions. With an investment of ₹${formData.communityCapitalDeployed || '[amount]'}, we provided valuable professional development opportunities. This project demonstrated our commitment to empowering individuals with skills and knowledge for career advancement.`,
        
        // Template 2: Skill Enhancement-focused
        `This professional service project was successfully executed on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}. Under the guidance of ${formData.projectChair || '[project chair]'}, we delivered comprehensive skill-building programs that reached ${formData.livesTouched || '[number]'} beneficiaries. The ${formData.serviceHours || '[number]'} hours of training utilized ₹${formData.communityCapitalDeployed || '[amount]'} effectively to create lasting professional impact. The project showcased our dedication to fostering professional excellence and career readiness in our community.`,
        
        // Template 3: Career Advancement-focused
        `On ${formData.date || '[date]'}, we organized a transformative professional service project at ${formData.venue || '[venue]'}, spearheaded by ${formData.projectChair || '[project chair]'}. This career-focused initiative empowered ${formData.livesTouched || '[number]'} individuals through ${formData.serviceHours || '[number]'} hours of professional mentorship and training. With a budget of ₹${formData.communityCapitalDeployed || '[amount]'}, we equipped participants with industry-relevant skills. The project exemplified our mission to bridge the gap between education and employment.`,
        
        // Template 4: Industry Collaboration-focused
        `The professional service project held on ${formData.date || '[date]'} at ${formData.venue || '[venue]'} brought together industry experts and aspiring professionals. ${formData.projectChair || '[project chair]'} led this initiative that served ${formData.livesTouched || '[number]'} participants over ${formData.serviceHours || '[number]'} hours. Through strategic deployment of ₹${formData.communityCapitalDeployed || '[amount]'}, we facilitated meaningful industry connections. This project reinforced our commitment to creating pathways for professional growth and career success.`,
        
        // Template 5: Entrepreneurship-focused
        `Our club successfully conducted a professional service project on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}, championed by ${formData.projectChair || '[project chair]'}. The initiative inspired ${formData.livesTouched || '[number]'} aspiring entrepreneurs through ${formData.serviceHours || '[number]'} hours of business mentorship and guidance. With ₹${formData.communityCapitalDeployed || '[amount]'} in resources, we fostered an entrepreneurial mindset. This project reflects our dedication to nurturing innovation and business leadership in our community.`,
        
        // Template 6: Workplace Readiness-focused
        `An impactful professional service project was conducted on ${formData.date || '[date]'} at ${formData.venue || '[venue]'}, under the dynamic leadership of ${formData.projectChair || '[project chair]'}. Our comprehensive approach prepared ${formData.livesTouched || '[number]'} individuals for the professional world, investing ${formData.serviceHours || '[number]'} hours of expert training. The project efficiently utilized ₹${formData.communityCapitalDeployed || '[amount]'} to maximize career readiness. Through professional development and skill enhancement, we demonstrated how Rotaract clubs can be catalysts for workforce transformation.`
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
    
    // Validate news publication: at least one field (image or link) must be filled if enabled
    if (formData.newsPublicationEnabled) {
      if (!formData.newsPublicationImage && !formData.newsPublicationLink) {
        alert('Please provide at least one: news article image or news link');
        return;
      }
    }
    
    // Prepare submission data
    const submissionData = {
      ...formData,
      category: 'professional_service',
      totalAttendance: calculateTotalAttendance(),
      totalPoints: calculateTotalPoints(),
      attendancePoints: calculateAttendancePoints(),
      newsPoints: calculateNewsPoints(),
      womenEmpowermentPoints: calculateWomenEmpowermentPoints(),
      mahadhanPoints: calculateMahadhanPoints(),
      generalPublicPoints: calculateGeneralPublicPoints(),
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
          <h3 className="text-2xl font-black text-slate-900">Professional Service Avenue</h3>
          <p className="text-sm text-slate-500 mt-1">Submit project details for this category</p>
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

        {/* News Publication and Telecasting */}
        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
          <h4 className="text-sm font-black text-purple-700 uppercase tracking-widest mb-4">News Coverage (Optional)</h4>
          
          {/* News Publication Toggle */}
          <div className="mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.newsPublicationEnabled}
                  onChange={(e) => setFormData({ ...formData, newsPublicationEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
              </div>
              <div>
                <div className="text-sm font-black text-slate-700">News Publication</div>
                <div className="text-xs text-purple-600 font-bold">+100 points</div>
              </div>
            </label>

            {formData.newsPublicationEnabled && (
              <div className="mt-4 space-y-4 pl-6 border-l-4 border-purple-300">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Upload News Article (Max 1 image, ≤ 1MB)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewsImageUpload}
                    className="w-full bg-white border border-purple-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 font-bold"
                  />
                  {newsImageError && (
                    <p className="text-red-600 text-sm font-bold mt-2">⚠️ {newsImageError}</p>
                  )}
                  {formData.newsPublicationImage && (
                    <p className="text-emerald-600 text-sm font-bold mt-2">✓ Image selected</p>
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
                    placeholder="Paste the link of news report (if you have offline video format then upload it on club's social media and paste the link)"
                    className="w-full bg-white border border-purple-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 font-bold"
                  />
                </div>
                <p className="text-xs text-purple-600 font-bold mt-2">
                  * At least one field (image or link) is required when news publication is enabled
                </p>
              </div>
            )}
          </div>

          {/* News Telecasting Toggle */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.newsTelecastingEnabled}
                  onChange={(e) => setFormData({ ...formData, newsTelecastingEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
              </div>
              <div>
                <div className="text-sm font-black text-slate-700">News Telecasting on Local Channel</div>
                <div className="text-xs text-purple-600 font-bold">+300 points</div>
              </div>
            </label>

            {formData.newsTelecastingEnabled && (
              <div className="mt-4 pl-6 border-l-4 border-purple-300">
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Telecasting Link *
                </label>
                <input
                  type="url"
                  required={formData.newsTelecastingEnabled}
                  value={formData.newsTelecastingLink}
                  onChange={(e) => setFormData({ ...formData, newsTelecastingLink: e.target.value })}
                  placeholder="Paste the link of news report (if you have offline video format then upload it on club's social media and paste the link)"
                  className="w-full bg-white border border-purple-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 font-bold"
                />
              </div>
            )}
          </div>
        </div>

        {/* Additional Points Checkboxes */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200">
          <h4 className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-4">Additional Points</h4>
          <div className="space-y-4">
            {/* Women Empowerment */}
            <label className="flex items-start gap-4 cursor-pointer bg-white p-4 rounded-xl border border-emerald-200 hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.womenEmpowerment}
                onChange={(e) => setFormData({ ...formData, womenEmpowerment: e.target.checked })}
                className="w-6 h-6 text-pink-600 rounded mt-1"
              />
              <div className="flex-1">
                <div className="text-sm font-black text-slate-900">Women Empowerment</div>
                <div className="text-xs text-pink-600 font-black mt-1">+400 points</div>
                <div className="text-xs text-slate-600 mt-1">
                  Check this if the project focuses on women empowerment initiatives
                </div>
              </div>
            </label>

            {/* Mahadhan Project */}
            <label className="flex items-start gap-4 cursor-pointer bg-white p-4 rounded-xl border border-emerald-200 hover:border-emerald-400 transition-colors">
              <input
                type="checkbox"
                checked={formData.mahadhanProject}
                onChange={(e) => setFormData({ ...formData, mahadhanProject: e.target.checked })}
                className="w-6 h-6 text-emerald-600 rounded mt-1"
              />
              <div className="flex-1">
                <div className="text-sm font-black text-slate-900">Organizing Mahadhan Project</div>
                <div className="text-xs text-emerald-600 font-black mt-1">+700 points</div>
                <div className="text-xs text-slate-600 mt-1">
                  Check this if the project is a Mahadhan initiative
                </div>
              </div>
            </label>

            {/* General Public Attendance */}
            <div className="bg-white p-4 rounded-xl border border-emerald-200">
              <div className="text-sm font-black text-slate-900 mb-3">General Public Attendance</div>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <input
                    type="radio"
                    name="generalPublic"
                    checked={formData.generalPublicAttendance === '100-300'}
                    onChange={() => setFormData({ ...formData, generalPublicAttendance: '100-300' })}
                    className="w-5 h-5 text-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-700">100 to 300 attendees</div>
                    <div className="text-xs text-emerald-600 font-bold">+500 points</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <input
                    type="radio"
                    name="generalPublic"
                    checked={formData.generalPublicAttendance === '500+'}
                    onChange={() => setFormData({ ...formData, generalPublicAttendance: '500+' })}
                    className="w-5 h-5 text-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-700">Above 500 attendees</div>
                    <div className="text-xs text-emerald-600 font-bold">+700 points</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-emerald-50 transition-colors">
                  <input
                    type="radio"
                    name="generalPublic"
                    checked={formData.generalPublicAttendance === '1000+'}
                    onChange={() => setFormData({ ...formData, generalPublicAttendance: '1000+' })}
                    className="w-5 h-5 text-emerald-600"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-slate-700">Above 1000 attendees</div>
                    <div className="text-xs text-emerald-600 font-bold">+1000 points</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Points Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
          <h4 className="text-sm font-black text-purple-700 uppercase tracking-widest mb-4">Points Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-3 rounded-xl">
              <div className="text-xs text-slate-500 font-bold">Base</div>
              <div className="text-xl font-black text-purple-700">500</div>
            </div>
            <div className="bg-white p-3 rounded-xl">
              <div className="text-xs text-slate-500 font-bold">Attendance</div>
              <div className="text-xl font-black text-blue-700">{calculateAttendancePoints()}</div>
            </div>
            <div className="bg-white p-3 rounded-xl">
              <div className="text-xs text-slate-500 font-bold">News</div>
              <div className="text-xl font-black text-purple-700">{calculateNewsPoints()}</div>
            </div>
            <div className="bg-white p-3 rounded-xl">
              <div className="text-xs text-slate-500 font-bold">Women</div>
              <div className="text-xl font-black text-pink-700">{calculateWomenEmpowermentPoints()}</div>
            </div>
            <div className="bg-white p-3 rounded-xl">
              <div className="text-xs text-slate-500 font-bold">Mahadhan</div>
              <div className="text-xl font-black text-emerald-700">{calculateMahadhanPoints()}</div>
            </div>
            <div className="bg-white p-3 rounded-xl">
              <div className="text-xs text-slate-500 font-bold">Public</div>
              <div className="text-xl font-black text-teal-700">{calculateGeneralPublicPoints()}</div>
            </div>
            <div className="bg-white p-3 rounded-xl border-2 border-purple-400">
              <div className="text-xs text-purple-700 font-black uppercase">Total</div>
              <div className="text-2xl font-black text-purple-700">{calculateTotalPoints()}</div>
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

export default ProfessionalServiceForm;
import React, { useState, useEffect } from 'react';
import { ClubMetrics } from './types';
import { DistrictAPI } from './api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportingProps {
  metrics: ClubMetrics;
  onUpdateMetrics?: (metrics: ClubMetrics) => void;
  pointsEarned: number;
  clubId?: string;
}
type Meeting = {
  id: number;
  date: string;
  meetingType: 'General Body Meeting' | 'Board Of Directors Meeting';
  meetingNumber: string;
  venue: string;
  briefInfo: string;
  attendance: {
    clubRotaractors: number;
    visitingRotaractors: number;
    rotarians: number;
    interactors: number;
    others: number;
  };
  totalAttendance: number;
  photos: File[];
  points: number;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
};

interface MeetingReportsTabProps {
  selectedMonth: MonthData;
  clubId: string;
}

const MeetingReportsTab: React.FC<MeetingReportsTabProps> = ({ selectedMonth, clubId }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [viewingMeeting, setViewingMeeting] = useState<Meeting | null>(null);
  
  // Load meetings from API when component mounts or month changes
  useEffect(() => {
    const loadMeetings = async () => {
      setIsLoading(true);
      try {
        const data = await DistrictAPI.getMeetings(clubId, selectedMonth.name, selectedMonth.year);
        setMeetings(data);
      } catch (error) {
        console.error('Error loading meetings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMeetings();
  }, [clubId, selectedMonth.name, selectedMonth.year]);
  
  const [formData, setFormData] = useState({
    meetingType: 'General Body Meeting' as 'General Body Meeting' | 'Board Of Directors Meeting',
    meetingNumber: '',
    date: '',
    venue: '',
    briefInfo: '',
    attendance: {
      clubRotaractors: 0,
      visitingRotaractors: 0,
      rotarians: 0,
      interactors: 0,
      others: 0,
    },
    photos: [] as File[],
  });

  // Calculate total attendance
  const calculateTotalAttendance = (attendance: typeof formData.attendance) => {
    return attendance.clubRotaractors + attendance.visitingRotaractors + 
           attendance.rotarians + attendance.interactors + attendance.others;
  };

  // Calculate points based on meeting type
  const calculatePoints = (meetingType: string) => {
    return meetingType === 'General Body Meeting' ? 200 : 100;
  };

  // Check if submission is within deadline (10 days after month end)
  const isWithinDeadline = () => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = monthNames.indexOf(selectedMonth.name);
    const lastDayOfMonth = new Date(selectedMonth.year, monthIndex + 1, 0);
    const deadline = new Date(lastDayOfMonth);
    deadline.setDate(deadline.getDate() + 10);
    return new Date() <= deadline;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const totalAttendance = calculateTotalAttendance(formData.attendance);
    const points = isWithinDeadline() ? calculatePoints(formData.meetingType) : 0;
    
    const meetingData = {
      clubId: clubId,
      meetingType: formData.meetingType === 'General Body Meeting' ? 'GBM' : 'BOD',
      meetingNumber: formData.meetingNumber,
      date: formData.date,
      venue: formData.venue,
      briefInfo: formData.briefInfo,
      attendance: {
        clubRotaractors: formData.attendance.clubRotaractors,
        visitingRotaractors: formData.attendance.visitingRotaractors,
        rotarians: formData.attendance.rotarians,
        interactors: formData.attendance.interactors,
        others: formData.attendance.others,
      },
      photos: formData.photos, // Include base64 photos
      month: selectedMonth.name,
      year: selectedMonth.year,
    };

    setIsLoading(true);
    try {
      if (editingMeeting) {
        await DistrictAPI.updateMeeting(editingMeeting.id.toString(), meetingData);
        alert('Meeting updated successfully! Awaiting admin approval.');
      } else {
        await DistrictAPI.createMeeting(meetingData);
        alert('Meeting submitted successfully! Awaiting admin approval.');
      }
      
      // Reload meetings from API
      const data = await DistrictAPI.getMeetings(clubId, selectedMonth.name, selectedMonth.year);
      setMeetings(data);
      
      // Reset form
      setFormData({
        meetingType: 'General Body Meeting',
        meetingNumber: '',
        date: '',
        venue: '',
        briefInfo: '',
        attendance: {
          clubRotaractors: 0,
          visitingRotaractors: 0,
          rotarians: 0,
          interactors: 0,
          others: 0,
        },
        photos: [],
      });
      setShowAddForm(false);
      setEditingMeeting(null);
    } catch (error) {
      console.error('Error saving meeting:', error);
      alert('Failed to save meeting. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle photo upload - convert to base64
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file: File) => file.size <= 1024 * 1024); // 1MB limit
    
    if (validFiles.length + formData.photos.length > 5) {
      alert('You can only upload up to 5 photos');
      return;
    }
    
    // Convert files to base64
    const base64Promises = validFiles.map((file: File) => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    });
    
    try {
      const base64Images = await Promise.all(base64Promises);
      setFormData({ ...formData, photos: [...formData.photos, ...base64Images as any] });
    } catch (error) {
      console.error('Error converting images:', error);
      alert('Failed to process images');
    }
  };

  // Delete meeting
  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this meeting?')) {
      setIsLoading(true);
      try {
        await DistrictAPI.deleteMeeting(id.toString());
        setMeetings(meetings.filter(m => m.id !== id));
        alert('Meeting deleted successfully');
      } catch (error) {
        console.error('Error deleting meeting:', error);
        alert('Failed to delete meeting. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Edit meeting
  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setFormData({
      meetingType: meeting.meetingType,
      meetingNumber: meeting.meetingNumber,
      date: meeting.date,
      venue: meeting.venue,
      briefInfo: meeting.briefInfo,
      attendance: meeting.attendance,
      photos: meeting.photos,
    });
    setShowAddForm(true);
  };

  // View meeting details
  const handleViewMeeting = (meeting: Meeting) => {
    setViewingMeeting(meeting);
  };

  // Export meetings to PDF with attractive design
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Calculate points
    const gbmPoints = sortedMeetings
      .filter(m => m.meetingType === 'GBM' && m.status === 'approved')
      .reduce((sum, m) => sum + m.points, 0);
    const bodPoints = sortedMeetings
      .filter(m => m.meetingType === 'BOD' && m.status === 'approved')
      .reduce((sum, m) => sum + m.points, 0);
    const totalPoints = gbmPoints + bodPoints;
    
    // Header with gradient effect (simulated with rectangles)
    doc.setFillColor(0, 80, 161);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(`Meeting Reports`, pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text(`${selectedMonth.name} ${selectedMonth.year}`, pageWidth / 2, 25, { align: 'center' });
    
    // Summary boxes - 3 boxes for meetings and points
    doc.setTextColor(0, 0, 0);
    
    // GBM Box
    doc.setFillColor(240, 248, 255);
    doc.roundedRect(14, 40, 60, 28, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 80, 161);
    doc.text('GBM Meetings', 44, 47, { align: 'center' });
    doc.setFontSize(16);
    doc.text(totalGBM.toString(), 44, 56, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${gbmPoints} Points`, 44, 64, { align: 'center' });
    
    // BOD Box
    doc.setFillColor(255, 240, 245);
    doc.roundedRect(80, 40, 60, 28, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(217, 27, 92);
    doc.text('BOD Meetings', 110, 47, { align: 'center' });
    doc.setFontSize(16);
    doc.text(totalBOD.toString(), 110, 56, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${bodPoints} Points`, 110, 64, { align: 'center' });
    
    // Total Points Box
    doc.setFillColor(240, 253, 244);
    doc.roundedRect(146, 40, 50, 28, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94);
    doc.text('Total Points', 171, 47, { align: 'center' });
    doc.setFontSize(18);
    doc.text(totalPoints.toString(), 171, 58, { align: 'center' });
    
    let yPosition = 78;
    
    // Add each meeting in compact format
    sortedMeetings.forEach((meeting, index) => {
      // Check if we need a new page (max half page per meeting = ~140 units)
      if (yPosition > pageHeight - 140) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Meeting card background
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(10, yPosition, pageWidth - 20, 130, 5, 5, 'F');
      
      // Meeting header bar
      const headerColor: [number, number, number] = meeting.meetingType === 'GBM' ? [0, 80, 161] : [138, 43, 226];
      doc.setFillColor(headerColor[0], headerColor[1], headerColor[2]);
      doc.roundedRect(10, yPosition, pageWidth - 20, 12, 5, 5, 'F');
      
      // Meeting title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`${meeting.meetingNumber} - ${meeting.meetingType === 'GBM' ? 'General Body Meeting' : 'Board Of Directors'}`, 15, yPosition + 8);
      
      // Status badge
      const statusColor: [number, number, number] = meeting.status === 'approved' ? [34, 197, 94] : meeting.status === 'submitted' ? [251, 146, 60] : [239, 68, 68];
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.roundedRect(pageWidth - 45, yPosition + 2, 30, 8, 2, 2, 'F');
      doc.setFontSize(8);
      doc.text(meeting.status.toUpperCase(), pageWidth - 30, yPosition + 7, { align: 'center' });
      
      yPosition += 18;
      
      // Meeting details in two columns
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      
      // Left column
      doc.text('Date:', 15, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(meeting.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }), 35, yPosition);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Venue:', 15, yPosition + 7);
      doc.setFont('helvetica', 'normal');
      const venueText = doc.splitTextToSize(meeting.venue, 70);
      doc.text(venueText, 35, yPosition + 7);
      
      // Right column
      doc.setFont('helvetica', 'bold');
      doc.text('Attendance:', 110, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(meeting.totalAttendance.toString(), 145, yPosition);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Points:', 110, yPosition + 7);
      doc.setFont('helvetica', 'normal');
      doc.text(meeting.status === 'approved' ? meeting.points.toString() : 'Pending', 145, yPosition + 7);
      
      yPosition += 20;
      
      // Attendance breakdown - compact table
      autoTable(doc, {
        startY: yPosition,
        head: [['Club Rtrs', 'Visiting', 'Rotarians', 'Interactors', 'Others']],
        body: [[
          meeting.attendance.clubRotaractors.toString(),
          meeting.attendance.visitingRotaractors.toString(),
          meeting.attendance.rotarians.toString(),
          meeting.attendance.interactors.toString(),
          meeting.attendance.others.toString(),
        ]],
        theme: 'grid',
        headStyles: {
          fillColor: headerColor,
          fontSize: 8,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9,
          halign: 'center'
        },
        margin: { left: 15, right: 15 },
        tableWidth: pageWidth - 30,
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 5;
      
      // Brief info - compact
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 100, 100);
      doc.text('Brief Information:', 15, yPosition);
      yPosition += 4;
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(60, 60, 60);
      const briefText = doc.splitTextToSize(meeting.briefInfo, pageWidth - 30);
      // Limit to 3 lines to keep compact
      const limitedText = briefText.slice(0, 3);
      doc.text(limitedText, 15, yPosition);
      if (briefText.length > 3) {
        doc.text('...', pageWidth - 20, yPosition + (2 * 4));
      }
      
      yPosition += (limitedText.length * 4) + 15;
    });
    
    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Generated on ${new Date().toLocaleDateString('en-GB')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save the PDF
    doc.save(`Meeting_Reports_${selectedMonth.name}_${selectedMonth.year}.pdf`);
  };

  // Sort meetings by date (latest first)
  const sortedMeetings = [...meetings].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate totals - only count approved meetings
  const totalGBM = meetings.filter(m => m.meetingType === 'GBM' && m.status === 'approved').length;
  const totalBOD = meetings.filter(m => m.meetingType === 'BOD' && m.status === 'approved').length;

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900">
            {editingMeeting ? 'Edit Meeting' : 'Add New Meeting'}
          </h3>
          <button
            onClick={() => {
              setShowAddForm(false);
              setEditingMeeting(null);
              setFormData({
                meetingType: 'General Body Meeting',
                meetingNumber: '',
                date: '',
                venue: '',
                briefInfo: '',
                attendance: {
                  clubRotaractors: 0,
                  visitingRotaractors: 0,
                  rotarians: 0,
                  interactors: 0,
                  others: 0,
                },
                photos: [],
              });
            }}
            className="text-slate-600 hover:text-[#D91B5C] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Meeting Type *
              </label>
              <select
                required
                value={formData.meetingType}
                onChange={(e) => setFormData({ ...formData, meetingType: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              >
                <option value="General Body Meeting">General Body Meeting</option>
                <option value="Board Of Directors Meeting">Board Of Directors Meeting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Meeting Number *
              </label>
              <input
                type="text"
                required
                value={formData.meetingNumber}
                onChange={(e) => setFormData({ ...formData, meetingNumber: e.target.value })}
                placeholder="e.g., GBM-01, BOD-05"
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Date *
              </label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
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
                placeholder="Meeting location"
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                Brief Information About Meeting *
              </label>
              <textarea
                required
                value={formData.briefInfo}
                onChange={(e) => setFormData({ ...formData, briefInfo: e.target.value })}
                rows={4}
                placeholder="Elaborate the agenda, discussion, resolution etc."
                className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold resize-none"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
            <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Attendance Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                  Club Rotaractors
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
                  Rotarians
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
                  Interactors
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
              <div className="bg-blue-100 p-3 rounded-xl border border-blue-200">
                <label className="block text-xs font-black text-blue-700 uppercase tracking-widest mb-2">
                  Total Attendance
                </label>
                <div className="text-2xl font-black text-blue-700">
                  {calculateTotalAttendance(formData.attendance)}
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Meeting Photos (Max 5, 1MB each)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
            />
            {formData.photos.length > 0 && (
              <div className="mt-4">
                <div className="text-sm text-slate-600 font-bold mb-2">
                  {formData.photos.length} photo(s) selected
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {formData.photos.map((photo: any, index: number) => (
                    <div key={index} className="relative aspect-square bg-slate-200 rounded-lg overflow-hidden border-2 border-slate-300">
                      <img
                        src={photo}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photos: formData.photos.filter((_: any, i: number) => i !== index) })}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
            <h4 className="text-sm font-black text-emerald-700 uppercase tracking-widest mb-2">Points Claim</h4>
            <div className="text-3xl font-black text-emerald-700">
              {isWithinDeadline() ? calculatePoints(formData.meetingType) : 0} Points
            </div>
            {!isWithinDeadline() && (
              <p className="text-xs text-orange-600 font-bold mt-2">
                ⚠️ Submission deadline passed. Meeting will be recorded but no points will be awarded.
              </p>
            )}
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-[#0050A1] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all"
            >
              {editingMeeting ? 'Update Meeting' : 'Submit Meeting'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingMeeting(null);
              }}
              className="px-8 bg-slate-200 text-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-black text-slate-900">
          Meeting Reports - {selectedMonth.name} {selectedMonth.year}
        </h3>
        <p className="text-sm font-bold text-slate-600 mt-1 uppercase tracking-widest">
          General Body And Board Of Directors Meeting
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Add, view and manage all official meetings conducted during this month
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-2">
            General Body Meetings
          </div>
          <div className="text-3xl font-black text-blue-700">{totalGBM}</div>
        </div>
        <div className="bg-purple-50 p-6 rounded-2xl border border-purple-100">
          <div className="text-xs font-black text-purple-700 uppercase tracking-widest mb-2">
            Board Of Directors Meetings
          </div>
          <div className="text-3xl font-black text-purple-700">{totalBOD}</div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => setShowAddForm(true)}
          className="flex-1 bg-[#0050A1] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Meeting
        </button>
        <button
          onClick={handleExportPDF}
          disabled={sortedMeetings.length === 0}
          className={`flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all flex items-center justify-center gap-2 ${sortedMeetings.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export PDF
        </button>
      </div>

      {sortedMeetings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="text-left p-4 text-xs font-black text-slate-700 uppercase tracking-widest">Sr. No.</th>
                <th className="text-left p-4 text-xs font-black text-slate-700 uppercase tracking-widest">Date</th>
                <th className="text-left p-4 text-xs font-black text-slate-700 uppercase tracking-widest">Meeting Type</th>
                <th className="text-left p-4 text-xs font-black text-slate-700 uppercase tracking-widest">Total Attendance</th>
                <th className="text-left p-4 text-xs font-black text-slate-700 uppercase tracking-widest">Points</th>
                <th className="text-left p-4 text-xs font-black text-slate-700 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedMeetings.map((meeting, index) => (
                <tr key={meeting.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-700">{index + 1}</td>
                  <td className="p-4 font-bold text-slate-700">
                    {new Date(meeting.date).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </td>
                  <td className="p-4 font-bold text-slate-700">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                      meeting.meetingType === 'GBM'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {meeting.meetingType === 'GBM' ? 'GBM' : 'BOD'}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-slate-700">{meeting.totalAttendance}</td>
                  <td className="p-4 font-bold">
                    {(meeting.status === 'submitted' || meeting.status === 'pending') ? (
                      <span className="text-orange-600 font-black uppercase text-xs">Pending</span>
                    ) : meeting.status === 'approved' ? (
                      <span className="text-emerald-600 font-black">{meeting.points}</span>
                    ) : meeting.status === 'rejected' ? (
                      <span className="text-red-600 font-black uppercase text-xs">Rejected</span>
                    ) : (
                      <span className="text-slate-400 font-black">{meeting.points}</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewMeeting(meeting)}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                        title="View"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        disabled={meeting.status === 'submitted' || meeting.status === 'pending' || meeting.status === 'approved'}
                        onClick={() => handleEdit(meeting)}
                        className={`p-2 rounded-lg transition-colors ${(meeting.status === 'submitted' || meeting.status === 'pending' || meeting.status === 'approved') ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}
                        title={(meeting.status === 'submitted' || meeting.status === 'pending') ? 'Cannot edit submitted meeting' : meeting.status === 'approved' ? 'Cannot edit approved meeting' : 'Edit'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        disabled={meeting.status === 'submitted' || meeting.status === 'pending' || meeting.status === 'approved'}
                        onClick={() => handleDelete(meeting.id)}
                        className={`p-2 rounded-lg transition-colors ${(meeting.status === 'submitted' || meeting.status === 'pending' || meeting.status === 'approved') ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                        title={(meeting.status === 'submitted' || meeting.status === 'pending') ? 'Cannot delete submitted meeting' : meeting.status === 'approved' ? 'Cannot delete approved meeting' : 'Delete'}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-400 font-bold">No meetings added yet</p>
          <p className="text-sm text-slate-400 mt-1">Click "Add Meeting" to create your first meeting report</p>
        </div>
      )}

      {/* View Meeting Modal */}
      {viewingMeeting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] p-10 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-slate-900">Meeting Details</h2>
              <button
                onClick={() => setViewingMeeting(null)}
                className="text-slate-600 hover:text-[#D91B5C] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Meeting Type</div>
                  <div className="text-lg font-black text-slate-900">
                    {viewingMeeting.meetingType === 'GBM' ? 'General Body Meeting' : 'Board Of Directors Meeting'}
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Meeting Number</div>
                  <div className="text-lg font-black text-slate-900">{viewingMeeting.meetingNumber}</div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Date</div>
                  <div className="text-lg font-black text-slate-900">
                    {new Date(viewingMeeting.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Venue</div>
                  <div className="text-lg font-black text-slate-900">{viewingMeeting.venue}</div>
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-4">Attendance Breakdown</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-blue-600 font-bold mb-1">Club Rotaractors</div>
                    <div className="text-2xl font-black text-blue-700">{viewingMeeting.attendance.clubRotaractors}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 font-bold mb-1">Visiting Rotaractors</div>
                    <div className="text-2xl font-black text-blue-700">{viewingMeeting.attendance.visitingRotaractors}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 font-bold mb-1">Rotarians</div>
                    <div className="text-2xl font-black text-blue-700">{viewingMeeting.attendance.rotarians}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 font-bold mb-1">Interactors</div>
                    <div className="text-2xl font-black text-blue-700">{viewingMeeting.attendance.interactors}</div>
                  </div>
                  <div>
                    <div className="text-xs text-blue-600 font-bold mb-1">Others</div>
                    <div className="text-2xl font-black text-blue-700">{viewingMeeting.attendance.others}</div>
                  </div>
                  <div className="bg-blue-100 p-4 rounded-xl">
                    <div className="text-xs text-blue-700 font-bold mb-1">Total</div>
                    <div className="text-2xl font-black text-blue-700">{viewingMeeting.totalAttendance}</div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl">
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Brief Information</div>
                <p className="text-sm text-slate-700 leading-relaxed">{viewingMeeting.briefInfo}</p>
              </div>

              <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-2">Points Status</div>
                    <div className="text-3xl font-black text-emerald-700">
                      {viewingMeeting.status === 'approved' ? viewingMeeting.points : 'Pending Approval'}
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                    viewingMeeting.status === 'approved' ? 'bg-emerald-600 text-white' :
                    viewingMeeting.status === 'submitted' || viewingMeeting.status === 'pending' ? 'bg-orange-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {viewingMeeting.status}
                  </div>
                </div>
              </div>

              {viewingMeeting.photos && viewingMeeting.photos.length > 0 && (
                <div className="bg-slate-50 p-6 rounded-2xl">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Meeting Photos ({viewingMeeting.photos.length})</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {viewingMeeting.photos.map((photo: any, index: number) => (
                      <div key={index} className="aspect-video bg-slate-200 rounded-xl overflow-hidden border-2 border-slate-300 hover:border-blue-500 transition-colors cursor-pointer">
                        <img
                          src={photo}
                          alt={`Meeting photo ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setViewingMeeting(null)}
              className="w-full mt-8 bg-slate-200 text-slate-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

type MonthData = {
  name: string;
  year: number;
  isAccessible: boolean;
};

const Reporting: React.FC<ReportingProps> = ({ metrics, onUpdateMetrics, pointsEarned, clubId = '' }) => {
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [activeTab, setActiveTab] = useState<'meetings' | 'projects' | 'membership'>('meetings');
  const [devMode, setDevMode] = useState(false); // Development mode to unlock all months

  // RI Year 2026-27: July 2026 to June 2027
  const months: MonthData[] = [
    { name: 'July', year: 2026, isAccessible: false },
    { name: 'August', year: 2026, isAccessible: false },
    { name: 'September', year: 2026, isAccessible: false },
    { name: 'October', year: 2026, isAccessible: false },
    { name: 'November', year: 2026, isAccessible: false },
    { name: 'December', year: 2026, isAccessible: false },
    { name: 'January', year: 2027, isAccessible: false },
    { name: 'February', year: 2027, isAccessible: false },
    { name: 'March', year: 2027, isAccessible: false },
    { name: 'April', year: 2027, isAccessible: false },
    { name: 'May', year: 2027, isAccessible: false },
    { name: 'June', year: 2027, isAccessible: false },
  ];

  // Get current date
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0-11 (0=Jan, 1=Feb, etc.)
  const currentYear = currentDate.getFullYear();

  // Map month names to numbers (0-11)
  const monthNameToNumber: { [key: string]: number } = {
    'January': 0, 'February': 1, 'March': 2, 'April': 3,
    'May': 4, 'June': 5, 'July': 6, 'August': 7,
    'September': 8, 'October': 9, 'November': 10, 'December': 11
  };

  // Update accessibility: current month + next 2 months (or all months in dev mode)
  months.forEach((month) => {
    if (devMode) {
      // In development mode, all months are accessible
      month.isAccessible = true;
    } else {
      const monthNum = monthNameToNumber[month.name];
      const monthYear = month.year;
      
      // Calculate if this month is within the accessible range (current + next 2 months)
      const isCurrentMonth = (monthYear === currentYear && monthNum === currentMonth);
      const isNextMonth = (
        (monthYear === currentYear && monthNum === currentMonth + 1) ||
        (monthYear === currentYear + 1 && currentMonth === 11 && monthNum === 0) // Dec to Jan
      );
      const isSecondNextMonth = (
        (monthYear === currentYear && monthNum === currentMonth + 2) ||
        (monthYear === currentYear + 1 && currentMonth === 10 && monthNum === 0) || // Nov to Jan
        (monthYear === currentYear + 1 && currentMonth === 11 && monthNum === 1) // Dec to Feb
      );
      
      month.isAccessible = isCurrentMonth || isNextMonth || isSecondNextMonth;
    }
  });

  if (selectedMonth) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => setSelectedMonth(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-[#D91B5C] transition-colors mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-black text-sm uppercase tracking-widest">Back to Dashboard</span>
            </button>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {selectedMonth.name} {selectedMonth.year} Reports
            </h2>
            <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">
              Submit your monthly reports
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-2 flex gap-2">
          <button
            onClick={() => setActiveTab('meetings')}
            className={`flex-1 py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'meetings'
                ? 'bg-[#0050A1] text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            Meeting Reports
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`flex-1 py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'projects'
                ? 'bg-[#D91B5C] text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            Project Reports
          </button>
          <button
            onClick={() => setActiveTab('membership')}
            className={`flex-1 py-4 px-6 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
              activeTab === 'membership'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
            }`}
          >
            Membership Movement
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10">
          {activeTab === 'meetings' && (
            <MeetingReportsTab selectedMonth={selectedMonth} clubId={clubId} />
          )}

          {activeTab === 'projects' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900">Project Reports</h3>
              <p className="text-sm text-slate-500">Submit details of projects conducted during {selectedMonth.name} {selectedMonth.year}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Project Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter project name"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Project Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Avenue of Service
                  </label>
                  <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold">
                    <option>Club Service</option>
                    <option>Community Service</option>
                    <option>Professional Development</option>
                    <option>International Service</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Service Hours
                  </label>
                  <input
                    type="number"
                    placeholder="Total hours"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Lives Touched
                  </label>
                  <input
                    type="number"
                    placeholder="Beneficiaries count"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Community Capital (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Funds utilized"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Rotaracters Participated
                  </label>
                  <input
                    type="number"
                    placeholder="Number of members"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                    Project Description
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Detailed description of the project..."
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500/20 font-bold resize-none"
                  />
                </div>
              </div>

              <button className="w-full bg-[#D91B5C] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all">
                Submit Project Report
              </button>
            </div>
          )}

          {activeTab === 'membership' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-900">Membership Movement</h3>
              <p className="text-sm text-slate-500">Report membership changes during {selectedMonth.name} {selectedMonth.year}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                  <label className="block text-xs font-black text-emerald-700 uppercase tracking-widest mb-2">
                    New Members
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full bg-white border border-emerald-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-2xl text-emerald-700"
                  />
                </div>
                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                  <label className="block text-xs font-black text-orange-700 uppercase tracking-widest mb-2">
                    Members Left
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full bg-white border border-orange-200 p-4 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20 font-bold text-2xl text-orange-700"
                  />
                </div>
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                  <label className="block text-xs font-black text-blue-700 uppercase tracking-widest mb-2">
                    Net Change
                  </label>
                  <div className="w-full bg-white border border-blue-200 p-4 rounded-xl font-bold text-2xl text-blue-700 text-center">
                    +0
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-700 uppercase tracking-widest">New Member Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Member Name"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                  <input
                    type="date"
                    placeholder="Joining Date"
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                </div>
                <button className="text-emerald-600 font-black text-xs uppercase tracking-widest hover:text-emerald-700 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Another Member
                </button>
              </div>

              <button className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:scale-[1.01] transition-all">
                Submit Membership Report
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Development Mode Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setDevMode(!devMode)}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            devMode
              ? 'bg-orange-500 text-white shadow-lg'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          {devMode ? '🔓 Dev Mode: All Months Unlocked' : '🔒 Enable Dev Mode'}
        </button>
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Monthly Reporting Dashboard</h2>
        <p className="text-lg font-bold text-[#D91B5C] mt-2">RI Year 2026-27</p>
        <p className="text-sm text-slate-500 font-bold mt-4 max-w-2xl mx-auto">
          Select a month to submit or manage your club's meetings, projects and membership reports.
          <span className="text-orange-600"> Reporting open for current month and next 2 upcoming months.</span>
        </p>
        {devMode && (
          <div className="mt-4 inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-2 rounded-xl border border-orange-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs font-black uppercase tracking-widest">Development Mode Active - All Months Unlocked</span>
          </div>
        )}
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {months.map((month, index) => (
          <button
            key={index}
            onClick={() => month.isAccessible && setSelectedMonth(month)}
            disabled={!month.isAccessible}
            className={`p-8 rounded-[2rem] border-2 transition-all ${
              month.isAccessible
                ? 'bg-white border-slate-200 hover:border-[#D91B5C] hover:shadow-xl hover:scale-105 cursor-pointer'
                : 'bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed'
            }`}
          >
            <div className="text-center">
              <h3 className="text-xl font-black text-slate-900">{month.name}</h3>
              <p className="text-sm font-bold text-slate-400 mt-1">{month.year}</p>
              {month.isAccessible ? (
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#0050A1] uppercase tracking-widest">
                  <span>Open</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              ) : (
                <div className="mt-4 inline-flex items-center gap-2 text-xs font-black text-slate-300 uppercase tracking-widest">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Locked</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 p-8 rounded-[2rem] border border-blue-100 flex items-start gap-6">
        <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">Important Guidelines</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 font-bold">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Submit reports before the 5th of the following month</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>All data will be verified by District Admin team</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Incomplete reports will not be counted for district scoring</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Reporting;
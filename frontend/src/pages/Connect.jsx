import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { connectAPI } from '../services/api';

const Connect = () => {
  const { user } = useAuth();
  
  // Data States
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  
  // Loading & UI States
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [selectedStudentInsights, setSelectedStudentInsights] = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);

  // Form States
  const [bookingData, setBookingData] = useState({
    bookingId: '',
    studentNotes: ''
  });
  const [newAvailability, setNewAvailability] = useState({
    slotStart: '',
    slotEnd: ''
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (user?.role === 'student') {
        const [cRes, bRes] = await Promise.all([
          connectAPI.getCounselors(),
          connectAPI.getStudentBookings()
        ]);
        setCounselors(cRes.counselors ?? []);
        setMyBookings(bRes.bookings ?? []);
      } else if (user?.role === 'counselor') {
        const response = await connectAPI.getCounselorBookings();
        setMyBookings(response.bookings ?? []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Counselor Selection
  const handleSelectCounselor = async (counselor) => {
    setSelectedCounselor(counselor);
    setSlotsLoading(true);
    setBookingData({ bookingId: '', studentNotes: '' });
    try {
      const response = await connectAPI.getAvailability(counselor._id);
      setAvailableSlots(response.slots ?? []);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
    } finally {
      setSlotsLoading(false);
    }
  };

  // Booking Logic
  const handleBookSession = async (e) => {
    e.preventDefault();
    if (!bookingData.bookingId) return;

    try {
      await connectAPI.bookSession({
        bookingId: bookingData.bookingId,
        studentNotes: bookingData.studentNotes
      });
      alert('Session requested! You will be notified once the counselor approves.');
      setSelectedCounselor(null);
      setBookingData({ bookingId: '', studentNotes: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to book session:', error);
      alert(error.response?.data?.message || 'Failed to book session');
    }
  };

  // Counselor Availability Management
  const handleSetAvailability = async (e) => {
    e.preventDefault();
    try {
      await connectAPI.setAvailability(newAvailability);
      setShowAvailabilityModal(false);
      setNewAvailability({ slotStart: '', slotEnd: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to set availability:', error);
      alert(error.response?.data?.message || 'Failed to set availability');
    }
  };

  const handleUpdateStatus = async (bookingId, status) => {
    try {
      await connectAPI.updateStatus(bookingId, { status });
      fetchData();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleDeleteSlot = async (bookingId) => {
    if (!window.confirm('Delete this slot permanently?')) return;
    try {
      await connectAPI.deleteSlot(bookingId);
      fetchData();
    } catch (error) {
      console.error('Failed to delete slot:', error);
    }
  };

  const handleViewInsights = async (studentId) => {
    if (!studentId) return;
    try {
      setInsightsLoading(true);
      setShowInsightsModal(true);
      const response = await connectAPI.getInsights(studentId);
      setSelectedStudentInsights(response.insights);
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">Support Hub</h1>
            <p className="text-slate-500 font-medium text-lg max-w-2xl leading-relaxed">
              {user?.role === 'student' 
                ? 'Discover a professional clinical match and secure your one-on-one sessions.'
                : 'Coordinate your availability and manage student intervention requests.'
              }
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/schedule" className="btn-serene-secondary flex items-center gap-3 !px-6 !py-3">
              <span>🗓️</span> 
              <span>Schedule</span>
              {myBookings.some(b => b.status === 'pending') && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-sm" />
              )}
            </Link>
            {user?.role === 'counselor' && (
              <button 
                onClick={() => setShowAvailabilityModal(true)} 
                className="btn-serene-primary flex items-center gap-2 !px-6 !py-3"
              >
                <span>✨</span> Add Availability
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-40">
            <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
            <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Syncing Clinical Network...</p>
          </div>
        ) : (
          <div className="space-y-16">
            
            {/* ══ STUDENT VIEW: CLINICAL MATCHING ══ */}
            {user?.role === 'student' && (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 items-start">
                
                {/* Left: Professionals Selection */}
                <div className="xl:col-span-8 space-y-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                     <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Available Professionals</h2>
                     <span className="text-[10px] font-black uppercase text-indigo-400">{counselors.length} Matches Found</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {counselors.map((c) => (
                      <div 
                        key={c._id}
                        onClick={() => handleSelectCounselor(c)}
                        className={`group glass-card !rounded-[2rem] p-6 !border-2 transition-all cursor-pointer ${
                          selectedCounselor?._id === c._id 
                          ? '!border-indigo-600 !bg-white shadow-2xl !ring-8 !ring-indigo-50 hover:!bg-white' 
                          : '!border-transparent hover:!border-slate-200 !shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-4 mb-6">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${
                            selectedCounselor?._id === c._id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'
                          }`}>
                            👤
                          </div>
                          <div>
                            <h3 className={`font-black tracking-tight text-lg transition-colors ${selectedCounselor?._id === c._id ? 'text-indigo-600' : 'text-slate-900'}`}>{c.name}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{c.profile?.specialization || 'Clinical Representative'}</p>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                           Dedicated to providing empathetic, evidence-based support for student populations.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Refined Booking Panel */}
                <div className="xl:col-span-4">
                  <div className="sticky top-28 glass-panel !rounded-[3rem] p-10 shadow-2xl overflow-hidden border-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16" />
                    
                    {selectedCounselor ? (
                      <form onSubmit={handleBookSession} className="relative z-10">
                        <div className="mb-10 text-center">
                           <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">Book Session</h3>
                           <p className="text-indigo-400 text-sm font-bold">With {selectedCounselor.name}</p>
                        </div>

                        <div className="space-y-6 mb-10">
                          <div>
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Availability Grid</label>
                            {slotsLoading ? (
                               <div className="text-center py-8">
                                 <div className="w-8 h-8 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin mx-auto mb-2" />
                                 <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Loading Slots...</span>
                               </div>
                            ) : availableSlots.length === 0 ? (
                              <div className="p-8 rounded-2xl bg-slate-50/50 text-center border border-dashed border-slate-200">
                                <p className="text-slate-400 text-xs font-bold leading-relaxed">No open intervention <br /> slots available.</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {availableSlots.map((s) => (
                                  <label 
                                    key={s._id}
                                    className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                      bookingData.bookingId === s._id 
                                      ? 'border-indigo-600 bg-white shadow-xl shadow-indigo-100 ring-4 ring-indigo-50' 
                                      : 'border-slate-50 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-200'
                                    }`}
                                  >
                                    <input 
                                      type="radio" 
                                      name="slot" 
                                      value={s._id}
                                      checked={bookingData.bookingId === s._id}
                                      onChange={(e) => setBookingData({ ...bookingData, bookingId: e.target.value })}
                                      className="hidden"
                                      required 
                                    />
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                      bookingData.bookingId === s._id ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'
                                    }`}>
                                      {bookingData.bookingId === s._id && <div className="w-2 h-2 rounded-full bg-white" />}
                                    </div>
                                    <span className="text-sm font-black text-slate-700">{formatDate(s.slotStart)}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                             <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Clinical Context (Optional)</label>
                             <textarea 
                               className="w-full p-5 bg-slate-50/50 rounded-2xl border-none text-sm font-medium resize-none focus:ring-4 ring-indigo-50 transition-all placeholder:text-slate-300"
                               rows="4"
                               placeholder="Add any specific topics or challenges you'd like to address..."
                               value={bookingData.studentNotes}
                               onChange={(e) => setBookingData({ ...bookingData, studentNotes: e.target.value })}
                             />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          disabled={!bookingData.bookingId}
                          className="w-full btn-serene-primary !py-5 shadow-xl shadow-indigo-100 disabled:opacity-50 disabled:hover:scale-100 disabled:shadow-none"
                        >
                          Confirm & Request
                        </button>
                      </form>
                    ) : (
                      <div className="py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner italic font-serif text-indigo-300 animate-pulse">?</div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight">Select Professional</h3>
                        <p className="text-slate-400 text-xs font-bold px-8 leading-relaxed">Choose a counselor on the left to view their clinical availability schedule.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══ COUNSELOR VIEW: COORDINATION CENTER ══ */}
            {user?.role === 'counselor' && (
              <div className="space-y-12">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                   <h2 className="text-sm font-black uppercase tracking-widest text-slate-400">Incoming Requests & Slots</h2>
                   <div className="w-px h-4 bg-slate-200" />
                   <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{myBookings.length} Total Units</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {myBookings.map((booking) => (
                    <div key={booking._id} className="glass-card flex flex-col group hover:!border-indigo-200">
                      <div className="flex justify-between items-start mb-10">
                        <div className={`px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                          booking.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          booking.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          {booking.status}
                        </div>
                        {booking.studentId && (
                           <button onClick={() => handleViewInsights(booking.studentId._id)} className="text-[10px] font-black uppercase text-indigo-400 hover:text-indigo-600 tracking-[0.2em] transition-colors border-b border-transparent hover:border-indigo-200">
                             Clinical Profile →
                           </button>
                        )}
                      </div>

                      <div className="flex-1">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tighter leading-none mb-6">
                           {booking.studentId?.name || 'Unassigned Session'}
                        </h3>
                        <div className="space-y-4 mb-10">
                          <div className="flex items-center gap-3 text-slate-500 font-bold p-3 rounded-2xl bg-slate-50 border border-white shadow-sm">
                            <span className="text-lg">📅</span> {formatDate(booking.slotStart)}
                          </div>
                          {booking.studentNotes && (
                            <div className="p-5 rounded-[1.5rem] bg-indigo-50/10 border border-indigo-50/30 italic text-slate-600 text-sm leading-relaxed relative">
                               <span className="absolute -top-3 left-4 text-3xl text-indigo-100 font-serif leading-none">“</span>
                               "{booking.studentNotes}"
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-8 border-t border-slate-50 flex flex-col gap-3">
                        {booking.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handleUpdateStatus(booking._id, 'approved')} className="py-4 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-500 transition-all">Approve</button>
                            <button onClick={() => handleUpdateStatus(booking._id, 'rejected')} className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-black text-xs hover:bg-rose-50 hover:text-rose-500 transition-all">Decline</button>
                          </div>
                        )}
                        {(booking.status === 'available' || booking.status === 'rejected') && (
                          <button onClick={() => handleDeleteSlot(booking._id)} className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 font-black text-xs transition-all uppercase tracking-widest">
                            Purge Records
                          </button>
                        )}
                        {booking.status === 'approved' && (
                          <Link to="/schedule" className="w-full py-4 text-center rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xs hover:bg-indigo-100 transition-all uppercase tracking-widest">
                             System Calendar
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- REFINED MODALS --- */}
        {showAvailabilityModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center z-[200] p-6">
            <div className="bg-white p-12 rounded-[4rem] max-w-lg w-full shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-500 border-none relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 via-pink-400 to-emerald-400" />
              <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Publish Session</h2>
              <p className="text-slate-400 text-sm font-bold mb-10 tracking-wide">Set your clinical availability parameters.</p>
              
              <form onSubmit={handleSetAvailability}>
                <div className="space-y-8 mb-12">
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Start Time Transition</label>
                    <input type="datetime-local" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black text-slate-900 focus:ring-4 ring-indigo-50 transition-all" value={newAvailability.slotStart} onChange={(e) => setNewAvailability({ ...newAvailability, slotStart: e.target.value })} required />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Conclusion Point</label>
                    <input type="datetime-local" className="w-full p-5 bg-slate-50 rounded-2xl border-none font-black text-slate-900 focus:ring-4 ring-indigo-50 transition-all" value={newAvailability.slotEnd} onChange={(e) => setNewAvailability({ ...newAvailability, slotEnd: e.target.value })} required />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <button type="button" onClick={() => setShowAvailabilityModal(false)} className="px-6 font-black text-slate-300 uppercase tracking-widest text-xs hover:text-slate-500 transition-colors">Abort</button>
                  <button type="submit" className="flex-1 btn-serene-primary !py-5 shadow-2xl shadow-indigo-200">Broadcast Now</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showInsightsModal && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl flex items-center justify-center z-[210] p-6">
             <div className="bg-white p-12 rounded-[4rem] max-w-xl w-full shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar border-none animate-in fade-in slide-in-from-bottom-5 duration-500 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400" />
                <div className="flex justify-between items-center mb-12">
                   <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Clinical Insights</h2>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Cross-Platform Data Aggregation</p>
                   </div>
                   <button onClick={() => setShowInsightsModal(false)} className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 font-bold transition-all">✕</button>
                </div>
                
                {insightsLoading ? (
                  <div className="py-24 text-center">
                    <div className="w-12 h-12 border-4 border-indigo-50 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
                    <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Filtering Signal from Noise...</p>
                  </div>
                ) : selectedStudentInsights && (
                  <div className="space-y-12">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-[2.5rem] bg-indigo-50/30 border border-indigo-50">
                           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Total Touchpoints</p>
                           <p className="text-4xl font-black text-indigo-600">{selectedStudentInsights.moodHistory?.length || 0}</p>
                        </div>
                        <div className="p-6 rounded-[2.5rem] bg-pink-50/30 border border-pink-50">
                           <p className="text-[10px] font-black uppercase tracking-widest text-pink-400 mb-2">Dominant Aura</p>
                           <p className="text-2xl font-black text-pink-600 truncate">{selectedStudentInsights.emotions?.[0] || 'Neutral'}</p>
                        </div>
                     </div>

                     <div>
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-6">Sentiment Spectrum Analysis</label>
                        <div className="flex flex-wrap gap-2.5">
                           {selectedStudentInsights.emotions?.map(e => (
                             <span key={e} className="px-5 py-2.5 rounded-2xl bg-white border-2 border-slate-50 text-slate-600 text-xs font-black shadow-sm group hover:border-indigo-100 transition-all cursor-default">
                                <span className="text-indigo-400 mr-2">•</span>{e}
                             </span>
                           ))}
                        </div>
                     </div>
                     
                     <div className="pb-8">
                        <label className="block text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-6">Screening History (Chronological)</label>
                        <div className="space-y-4">
                           {selectedStudentInsights.moodHistory?.map((r, i) => (
                             <div key={i} className="flex justify-between items-center p-6 rounded-[2rem] bg-slate-50/50 border border-white hover:bg-white hover:shadow-xl hover:shadow-slate-100 transition-all group">
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-1">{new Date(r.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
                                   <span className="text-slate-700 font-black tracking-tight">{new Date(r.createdAt).toLocaleDateString(undefined, { day: 'numeric', weekday: 'short' })}</span>
                                </div>
                                <div className={`text-[10px] font-black uppercase px-6 py-2.5 rounded-full shadow-sm transition-all ${
                                  r.severityTag?.includes('Severe') ? 'bg-rose-500 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                }`}>
                                   {r.severityTag || 'Logged'}
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Connect;

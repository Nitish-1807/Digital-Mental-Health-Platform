import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { assessmentAPI } from '../services/api';

// ── Helpers ───────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

const Icons = {
  CheckIn: () => <span className="text-2xl">⚡</span>,
  Resources: () => <span className="text-2xl">📚</span>,
  Community: () => <span className="text-2xl">👥</span>,
  Chat: () => <span className="text-2xl">✨</span>,
  Bookings: () => <span className="text-2xl">🗓️</span>,
  Video: () => <span className="text-2xl">📹</span>,
  Progress: () => <span className="text-2xl">📈</span>,
  Brain: () => <span className="text-2xl">🧠</span>,
  Gear: () => <span className="text-2xl">⚙️</span>,
};

const STUDENT_CARDS = [
  { to: '/check-in', Icon: Icons.CheckIn, title: 'Pulse Check', desc: 'Quick assessment of your mood and stress.', theme: 'bg-rose-50 text-rose-600' },
  { to: '/resources', Icon: Icons.Resources, title: 'Resource Library', desc: 'Guided wisdom tailored to your results.', theme: 'bg-blue-50 text-blue-600' },
  { to: '/community', Icon: Icons.Community, title: 'Community Groups', desc: 'Join topic-based peer support spaces.', theme: 'bg-teal-50 text-teal-600' },
  { to: '/chatbot', Icon: Icons.Chat, title: 'AI Guide', desc: 'Instant support from our empathetic AI.', theme: 'bg-indigo-50 text-indigo-600' },
  { to: '/schedule', Icon: Icons.Bookings, title: 'My Schedule', desc: 'Your upcoming therapy appointments.', theme: 'bg-amber-50 text-amber-600' },
  { to: '/connect', Icon: Icons.Video, title: 'Connect', desc: 'Professional clinical interventions.', theme: 'bg-purple-50 text-purple-600' },
  { to: '/progress', Icon: Icons.Progress, title: 'Insights', desc: 'Data-driven look at your journey.', theme: 'bg-slate-50 text-slate-600' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loadingRes, setLoadingRes] = useState(true);

  useEffect(() => {
    if (user?.role !== 'student') { setLoadingRes(false); return; }
    assessmentAPI.getMyResults()
      .then(data => setResults(Array.isArray(data) ? data : []))
      .catch(() => setResults([]))
      .finally(() => setLoadingRes(false));
  }, [user]);

  const latestAny = results[0] ?? null;
  const daysSinceCheck = latestAny ? daysSince(latestAny.createdAt) : null;
  const showNudge = !loadingRes && (daysSinceCheck === null || daysSinceCheck >= 7);

  return (
    <div className="min-h-screen bg-[#fcfdfe] py-12 px-6">
      <div className="max-w-6xl mx-auto">

        {/* ── HEADER ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-[2rem] bg-indigo-600 shadow-2xl shadow-indigo-200 flex items-center justify-center text-white text-2xl font-black">
              {initials(user?.name)}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-2">
                Welcome back to MindSpace
              </p>
              <h1 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
                {greeting()}, <br />
                <span className="italic font-normal">{user?.name?.split(' ')[0]}</span>
              </h1>
            </div>
          </div>
          <div className="hidden lg:block text-right">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-2">Campus Context</p>
            <p className="text-slate-900 font-black text-xl">{user?.college?.name || 'Central Health Hub'}</p>
          </div>
        </div>

        {/* ── DASHBOARD CONTENT ── */}
        {user?.role === 'student' && (
          <div className="space-y-12">

            {/* Nudge Notification */}
            {showNudge && (
              <div className="bg-white/40 border border-indigo-100 rounded-[2.5rem] p-8 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <Icons.Brain />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl font-black text-slate-900">Check-in recommended</h3>
                  <p className="text-slate-500 font-medium">
                    {daysSinceCheck === null
                      ? "Welcome! Let's start with your first emotional baseline screening."
                      : `It has been ${daysSinceCheck} days since your last pulse check recorded.`}
                  </p>
                </div>
                <Link to="/check-in" className="btn-serene-primary">
                  Begin Baseline
                </Link>
              </div>
            )}

            {/* Stats Row */}
            {!loadingRes && results.length > 0 && (() => {
              const latest = results[0];
              const severityParts = latest.severityTag ? latest.severityTag.split(',') : [];
              const phqPart = severityParts.find(p => p.includes('PHQ-9'));
              const moodLabel = phqPart ? phqPart.replace('PHQ-9:', '').trim() : '—';
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div className="glass-card flex flex-col items-center justify-center text-center p-6 bg-white/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Check-ins Done</p>
                    <p className="text-4xl font-black text-slate-900">{results.length}</p>
                  </div>
                  <div className="glass-card flex flex-col items-center justify-center text-center p-6 bg-white/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Mood (Latest)</p>
                    <p className="text-2xl font-black text-indigo-600 leading-tight">{moodLabel}</p>
                  </div>
                  <div className="glass-card flex flex-col items-center justify-center text-center p-6 bg-white/60">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Last Check-in</p>
                    <p className="text-2xl font-black text-slate-700">{daysSinceCheck === 0 ? 'Today' : `${daysSinceCheck}d ago`}</p>
                  </div>
                </div>
              );
            })()}

            {/* Action Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {STUDENT_CARDS.map(card => (
                <Link
                  key={card.to}
                  to={card.to}
                  className="glass-card group flex flex-col h-full hover:border-indigo-200"
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-black/5 ${card.theme} group-hover:scale-110 transition-transform`}>
                    <card.Icon />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{card.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed flex-1">
                    {card.desc}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── COUNSELOR DASHBOARD ── */}
        {user?.role === 'counselor' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass-card bg-indigo-600 text-white border-transparent">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-8">
                <Icons.Bookings />
              </div>
              <h2 className="text-3xl font-black mb-2">My Schedule</h2>
              <p className="text-indigo-100 font-medium text-sm mb-12">
                Unified clinical calendar for approving student appointments and managing time.
              </p>
              <Link to="/schedule" className="btn-serene-secondary w-full text-center block !bg-white !text-indigo-600 shadow-xl shadow-indigo-900/20">
                Manage Schedule
              </Link>
            </div>

            <div className="glass-card">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8">
                <Icons.Video />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Telehealth</h2>
              <p className="text-slate-500 font-medium text-sm mb-12">
                Secure, end-to-end encrypted video intervention rooms for private sessions.
              </p>
              <Link to="/video/join" className="btn-serene-primary w-full text-center block">
                Enter Lobby
              </Link>
            </div>

            <div className="glass-card">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-8">
                <Icons.Resources />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">Resource Library</h2>
              <p className="text-slate-500 font-medium text-sm mb-12">
                System content management: Upload assessments, articles, and guided exercises.
              </p>
              <Link to="/manage-resources" className="btn-serene-primary w-full text-center block">
                Publish Resources
              </Link>
            </div>
          </div>
        )}

        {/* ── ADMIN DASHBOARD ── */}
        {user?.role === 'admin' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="glass-card border-indigo-600/20 bg-indigo-50/30">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mb-8">
                <Icons.Gear />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-2">System Admin</h2>
              <p className="text-slate-500 font-medium text-sm mb-12">
                Full control over users, college nodes, and system-wide flagged content.
              </p>
              <Link to="/admin" className="btn-serene-primary w-full text-center block">
                Open Engine
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

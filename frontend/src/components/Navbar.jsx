import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-100 px-8 py-5 flex flex-wrap items-center justify-between transition-all duration-300">
      <Link to="/" className="group flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
          <span className="text-xl">🌿</span>
        </div>
        <span className="font-['Playfair_Display'] font-black text-2xl tracking-tighter text-slate-900 leading-none">
          MindSpace
        </span>
      </Link>

      <div className="flex flex-wrap items-center gap-6 text-sm font-bold">
        {!isAuthenticated ? (
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-500 hover:text-indigo-600 transition-colors px-2">
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-2xl transition-all shadow-lg shadow-indigo-100 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            {/* Student nav */}
            {user?.role === 'student' && (
              <>
                <Link to="/dashboard" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Dashboard
                </Link>
                <Link to="/community" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Community
                </Link>
                <Link to="/schedule" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  My Schedule
                </Link>
                <Link to="/connect" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Connect
                </Link>
                <Link to="/chatbot" className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md shadow-indigo-100 font-black tracking-wide">
                  AI Support ✨
                </Link>
              </>
            )}

            {/* Counselor nav */}
            {user?.role === 'counselor' && (
              <>
                <Link to="/dashboard" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Home
                </Link>
                <Link to="/community" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Community
                </Link>
                <Link to="/schedule" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  My Schedule
                </Link>
                <Link to="/connect" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Manage Access
                </Link>
                <Link to="/manage-resources" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Resource Library
                </Link>
              </>
            )}

            {/* Admin nav */}
            {user?.role === 'admin' && (
              <>
                <Link to="/dashboard" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Dashboard
                </Link>
                <Link to="/admin" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  System Mgmt
                </Link>
                <Link to="/community" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Community
                </Link>
                <Link to="/manage-resources" className="px-4 py-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">
                  Resources
                </Link>
              </>
            )}

            <div className="w-px h-6 bg-slate-200 mx-2 hidden sm:block"></div>

            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl text-rose-500 hover:bg-rose-50 font-black transition-all"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

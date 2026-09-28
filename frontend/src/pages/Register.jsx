import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

import { getGoogleClientId } from '../utils/googleAuth';

const GOOGLE_CLIENT_ID = getGoogleClientId();
const hasGoogleAuth = Boolean(GOOGLE_CLIENT_ID);

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    alias: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const navigateBasedOnRole = (user) => {
    const { role, hasCompletedOnboarding } = user;
    if (role === 'admin') navigate('/admin');
    else if (role === 'student' && !hasCompletedOnboarding) navigate('/onboarding');
    else navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      navigateBasedOnRole(result.user);
    } else {
      setError(result.message || 'Registration failed.');
    }
    setLoading(false);
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);
    const result = await googleLogin(credentialResponse.credential);
    if (result.success) {
      navigateBasedOnRole(result.user);
    } else {
      setError(result.message || 'Google authentication failed.');
    }
    setLoading(false);
  };

  const GoogleSection = () => {
    if (!hasGoogleAuth) return null;
    return (
      <>
        <div className="mb-6 flex justify-center w-full">
           <GoogleLogin
             onSuccess={handleGoogleSuccess}
             onError={() => setError('Google sign-in failed. Please try again.')}
             size="large"
             width="380"
             theme="filled_black"
             shape="pill"
             text="signup_with"
           />
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">or register with email</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
      </>
    );
  };

  const content = (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-6xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row-reverse min-h-[800px]">
        
        {/* Right Panel: Form (Reversed layout for Register) */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative bg-white z-10 overflow-y-auto">
          <div className="mb-10">
             <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl mb-6 shadow-xl shadow-indigo-200">
               <span className="text-white">🌱</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Create account</h1>
             <p className="text-slate-500 text-base font-medium">Join our secure clinical support network.</p>
          </div>
          
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold mb-6">
              {error}
            </div>
          )}

          <GoogleSection />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold tracking-tight placeholder:text-slate-300 focus:ring-4 ring-indigo-50 focus:border-indigo-100 transition-all outline-none"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Email</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold tracking-tight placeholder:text-slate-300 focus:ring-4 ring-indigo-50 focus:border-indigo-100 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="role" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Access Level</label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold tracking-tight focus:ring-4 ring-indigo-50 focus:border-indigo-100 transition-all outline-none appearance-none cursor-pointer"
                >
                  <option value="student">Student Member</option>
                  <option value="counselor">Clinical Partner</option>
                </select>
              </div>

              <div>
                <label htmlFor="alias" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Alias (Optional)</label>
                <input
                  id="alias"
                  name="alias"
                  type="text"
                  placeholder="Username"
                  value={formData.alias}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold tracking-tight placeholder:text-slate-300 focus:ring-4 ring-indigo-50 focus:border-indigo-100 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Min 6 chars"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold tracking-tight placeholder:text-slate-300 focus:ring-4 ring-indigo-50 focus:border-indigo-100 transition-all outline-none"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 ml-1">Confirm Password</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-900 font-bold tracking-tight placeholder:text-slate-300 focus:ring-4 ring-indigo-50 focus:border-indigo-100 transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl transition-all duration-300 mt-4 ${
                loading
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5'
              }`}
            >
              {loading ? 'Initializing...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center font-bold text-slate-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              Sign in
            </Link>
          </p>
        </div>

        {/* Left Panel: Artwork */}
        <div className="hidden md:flex md:w-1/2 bg-slate-900 relative p-12 overflow-hidden flex-col justify-between">
           <div className="absolute inset-0 z-0">
              <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-teal-500/20 rounded-full blur-[120px] -ml-[400px] -mt-[400px]" />
              <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] -mr-[400px] -mb-[400px]" />
           </div>
           
           <div className="relative z-10 flex items-center gap-2 text-white/50 text-sm font-bold">
              MindSpace Protocol 1.0
           </div>
           
           <div className="relative z-10 text-white max-w-lg mb-12">
              <h2 className="text-5xl font-black tracking-tight mb-6 leading-tight">Start your journey to <br/><span className="text-teal-300 font-serif italic font-normal">wellbeing.</span></h2>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">Join a supportive ecosystem designed with clinical integrity and total privacy at its core.</p>
           </div>
           
           <div className="relative z-10 glass-panel !rounded-[2rem] p-6 bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl">🔒</div>
                 <div>
                    <p className="text-white font-bold text-sm">Data Anonymization</p>
                    <p className="text-slate-400 text-xs">Your identity is cryptographically shielded.</p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );

  if (hasGoogleAuth) {
    return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{content}</GoogleOAuthProvider>;
  }
  return content;
};

export default Register;

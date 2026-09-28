import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

import { getGoogleClientId } from '../utils/googleAuth';

const GOOGLE_CLIENT_ID = getGoogleClientId();
const hasGoogleAuth = Boolean(GOOGLE_CLIENT_ID);

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const navigateBasedOnRole = (user) => {
    const { role, hasCompletedOnboarding } = user;
    if (role === 'admin') navigate('/dashboard');
    else if (role === 'student' && !hasCompletedOnboarding) navigate('/onboarding');
    else navigate('/dashboard');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(formData.email, formData.password);
    if (result.success) {
      navigateBasedOnRole(result.user);
    } else {
      setError(result.message || 'The credentials provided do not match our records.');
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
        <div className="mb-8 flex justify-center">
           <GoogleLogin
             onSuccess={handleGoogleSuccess}
             onError={() => setError('Google sign-in failed. Please try again.')}
             size="large"
             width="380"
             theme="filled_black"
             shape="pill"
             text="signin_with"
           />
        </div>
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">or sign in with email</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>
      </>
    );
  };

  const content = (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-6xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[800px]">
        
        {/* Left Panel: Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 lg:p-24 flex flex-col justify-center relative bg-white z-10">
          <div className="mb-12">
             <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-2xl mb-8 shadow-xl shadow-indigo-200">
               <span className="text-white">🌿</span>
             </div>
             <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">Welcome back</h1>
             <p className="text-slate-500 text-lg font-medium">Please enter your details to sign in.</p>
          </div>
          
          {error && (
            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold mb-8">
              {error}
            </div>
          )}

          <GoogleSection />

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@college.edu"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-6 py-5 rounded-3xl bg-slate-50 border border-slate-100 text-slate-900 font-bold tracking-tight placeholder:text-slate-300 focus:ring-4 ring-indigo-50 focus:border-indigo-100 transition-all outline-none"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-6 py-5 rounded-3xl bg-slate-50 border border-slate-100 text-slate-900 font-bold tracking-tight placeholder:text-slate-300 focus:ring-4 ring-indigo-50 focus:border-indigo-100 transition-all outline-none"
              />
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                 <input type="checkbox" className="w-5 h-5 rounded-md border-slate-200 text-indigo-600 focus:ring-indigo-500" />
                 <span className="text-sm font-semibold text-slate-500 group-hover:text-slate-900 transition-colors">Remember me</span>
              </label>
              <a href="#" className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl transition-all duration-300 mt-4 ${loading
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5'
              }`}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center font-bold text-slate-500 mt-12">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-800 transition-colors">
              Sign up
            </Link>
          </p>
        </div>

        {/* Right Panel: Artwork */}
        <div className="hidden md:flex md:w-1/2 bg-slate-900 relative p-12 overflow-hidden flex-col justify-between">
           <div className="absolute inset-0 z-0">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/20 rounded-full blur-[120px] -mr-[400px] -mt-[400px]" />
              <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-pink-500/20 rounded-full blur-[120px] -ml-[400px] -mb-[400px]" />
           </div>
           <div className="relative z-10 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="w-3 h-3 rounded-full bg-white/20" />
              <div className="w-3 h-3 rounded-full bg-white/60" />
           </div>
           
           <div className="relative z-10 text-white max-w-lg mb-12">
              <h2 className="text-5xl font-black tracking-tight mb-6 leading-tight">Your safe space<br/><span className="text-indigo-300 font-serif italic font-normal">reimagined.</span></h2>
              <p className="text-slate-400 text-lg leading-relaxed font-medium">Join thousands of students accessing clinical-grade mental wellness tools and anonymous peer support tailored for campus life.</p>
           </div>
           
           <div className="relative z-10 glass-panel !rounded-[2rem] p-6 bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-xl">🛡️</div>
                 <div>
                    <p className="text-white font-bold text-sm">Enterprise Security</p>
                    <p className="text-slate-400 text-xs">HIPAA Compliant Infrastructure</p>
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

export default Login;
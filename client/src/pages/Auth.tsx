import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { ListTodo, Eye } from 'lucide-react';

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLogin) {
      if (password !== confirmPassword) {
        alert("Passwords do not match");
        return;
      }
      if (!agreeTerms) {
        alert("You must agree to the Terms & Privacy Policy");
        return;
      }
    }
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { email, password } : { name, email, password };
      const { data } = await api.post(endpoint, payload);
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#0a0a0a] p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-600/30 via-purple-900/20 to-transparent blur-3xl"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-blue-600/30 via-indigo-900/20 to-transparent blur-3xl"></div>

      <div className="relative w-full max-w-[1200px] h-full max-h-[800px] bg-white rounded-[32px] shadow-2xl flex overflow-hidden p-2 lg:p-3">

        <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-[#1a0b2e] via-[#4a1c6a] to-[#db2777] rounded-[24px] p-12 flex-col overflow-hidden">

          <div className="absolute top-12 left-12 flex items-center gap-2 z-20">
            <img src="/logo.png" className="w-6 h-6 object-contain invert" alt="Day Drive Logo" />
            <span className="font-semibold text-white text-[16px]">Day Drive</span>
          </div>

          <div className="absolute top-0 right-0 w-[120%] h-[120%] -translate-y-1/4 translate-x-1/4 opacity-60 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/50 via-purple-600/30 to-transparent blur-[80px] transform rotate-12"></div>
          <div className="absolute bottom-0 left-0 w-[100%] h-[100%] translate-y-1/3 -translate-x-1/4 opacity-70 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400/40 via-cyan-400/20 to-transparent blur-[60px] transform -rotate-12"></div>
          <div className="absolute top-1/2 left-1/2 w-[150%] h-[50%] -translate-y-1/2 -translate-x-1/2 opacity-50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-pink-500/40 via-purple-500/10 to-transparent blur-[100px] transform rotate-[-15deg]"></div>

          <div className="relative mt-auto z-10">
            <h1 className="text-white text-[48px] lg:text-[56px] leading-[1.1] mb-6 font-voice tracking-tight">
              Get everything<br/>done, calmly.
            </h1>
            <p className="text-white/80 text-[14px] max-w-[280px] leading-[1.7]">
              No stress, no clutter. Just you and your most important tasks for the day.
            </p>
          </div>
        </div>

        <div className="relative flex-1 flex flex-col items-center justify-center px-6 sm:px-12 lg:px-24 py-8 bg-white rounded-r-[24px] overflow-y-auto">

          <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2">
            <img src="/logo.png" className="w-5 h-5 object-contain" alt="Day Drive Logo" />
            <span className="font-semibold text-gray-900 text-[15px]">Day Drive</span>
          </div>

          <div className="w-full max-w-[360px]">
            <div className="text-center mb-6 lg:mb-8">
              <h2 className="text-[32px] lg:text-[40px] text-gray-900 mb-2 lg:mb-3 font-voice tracking-tight">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-[13px] text-gray-500">
                {isLogin ? 'Enter your email and password to access your account' : 'Sign up to start organizing your tasks'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#e8e6dc] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all text-[14px] text-gray-900 placeholder:text-gray-400"
                    placeholder="Enter your name"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3.5 bg-[#e8e6dc] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all text-[14px] text-gray-900 placeholder:text-gray-400"
                  placeholder="Enter your email"
                  required 
                />
              </div>
              
              <div>
                <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#e8e6dc] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all text-[14px] text-gray-900 placeholder:text-gray-400"
                    placeholder={isLogin ? "Enter your password" : "Create a password"}
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Eye size={18} />
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-[13px] text-gray-700 font-medium mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3.5 bg-[#e8e6dc] border border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 focus:bg-white transition-all text-[14px] text-gray-900 placeholder:text-gray-400"
                      placeholder="Confirm your password"
                      required={!isLogin}
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              )}

              {isLogin ? (
                <div className="flex justify-between items-center pt-2 pb-4">
                  <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer">
                    <input type="checkbox" className="w-3.5 h-3.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer" />
                    <span>Remember me</span>
                  </label>
                  <button type="button" className="text-[12px] text-gray-600 hover:text-gray-900 transition-colors">
                    Forgot Password?
                  </button>
                </div>
              ) : (
                <div className="pt-2 pb-4">
                  <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-black focus:ring-black cursor-pointer" 
                    />
                    <span>I agree to the Terms & Privacy Policy</span>
                  </label>
                </div>
              )}

              <button type="submit" className="w-full py-3.5 bg-black text-white rounded-xl text-[14px] font-medium hover:bg-gray-900 transition-colors shadow-sm active:scale-[0.98]">
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-[12px]">
                  <span className="bg-white px-4 text-gray-500">or continue with</span>
                </div>
              </div>

              <button type="button" className="w-full py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors active:scale-[0.98]">
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Sign {isLogin ? 'In' : 'Up'} with Google</span>
              </button>
            </form>

            <p className="text-center text-[13px] text-gray-500 mt-10">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button onClick={() => setIsLogin(!isLogin)} className="text-black font-semibold hover:underline">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

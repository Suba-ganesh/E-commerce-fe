import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { authService } from '../../services/authService';
import { Button } from '../common/Button';

interface AuthViewsProps {
  initialSubView?: 'login' | 'register' | 'forgot' | 'reset';
}

export const AuthViews: React.FC<AuthViewsProps> = ({
  initialSubView = 'login',
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();
  const toast = useToast();

  const [subView, setSubView] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialSubView);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register Form States
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerFieldErrors, setRegisterFieldErrors] = useState<{ [key: string]: string }>({});

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [forgotEmailTouched, setForgotEmailTouched] = useState(false);

  const validateForgotEmail = (emailVal: string) => {
    if (!emailVal) {
      return 'Email is required';
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(emailVal)) {
      return 'Please enter a valid email address (e.g. name@domain.com)';
    }
    return '';
  };

  // Reset password
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (token && email) {
      setSubView('reset');
    }
  }, [token, email]);

  useEffect(() => {
    const fbWindow = window as any;
    const initFB = () => {
      if (fbWindow.FB) {
        fbWindow.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID || '1234567890',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        });
      }
    };
    
    if (fbWindow.FB) {
      initFB();
    } else {
      fbWindow.fbAsyncInit = initFB;
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Please fill in all credentials.');
      return;
    }

    setIsSubmitting(true);
    const res = await login(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (!res.success) {
      setLoginError(res.message || 'Invalid email or password.');
    } else {
      navigate('/');
    }
  };

  /* Commented out social handlers for now
  const handleSocialClick = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoginError('');
    setRegisterError('');

    if (provider === 'google') {
      const gWindow = window as any;
      if (gWindow.google) {
        setIsSubmitting(true);
        const client = gWindow.google.accounts.oauth2.initTokenClient({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-mockclientid.apps.googleusercontent.com',
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              const res = await loginWithSocial('google', tokenResponse.access_token);
              setIsSubmitting(false);
              if (res.success) {
                navigate('/');
              } else {
                const errMsg = res.message || 'Google authentication failed.';
                toast.error(errMsg);
                if (subView === 'login') setLoginError(errMsg);
                else setRegisterError(errMsg);
              }
            } else {
              setIsSubmitting(false);
            }
          },
          error_callback: (err: any) => {
            setIsSubmitting(false);
            console.error('Google auth error', err);
            toast.error('Google login failed or window closed.');
          }
        });
        client.requestAccessToken();
      } else {
        toast.error('Google client library is not loaded yet.');
      }
    } else if (provider === 'facebook') {
      const fbWindow = window as any;
      if (fbWindow.FB) {
        setIsSubmitting(true);
        fbWindow.FB.login(async (response: any) => {
          if (response.authResponse && response.authResponse.accessToken) {
            const res = await loginWithSocial('facebook', response.authResponse.accessToken);
            setIsSubmitting(false);
            if (res.success) {
              navigate('/');
            } else {
              const errMsg = res.message || 'Facebook authentication failed.';
              toast.error(errMsg);
              if (subView === 'login') setLoginError(errMsg);
              else setRegisterError(errMsg);
            }
          } else {
            setIsSubmitting(false);
            toast.error('Facebook login cancelled or not authorized.');
          }
        }, { scope: 'public_profile,email' });
      } else {
        toast.error('Facebook client library is not loaded yet.');
      }
    } else if (provider === 'apple') {
      const appleWindow = window as any;
      if (appleWindow.AppleID) {
        appleWindow.AppleID.auth.init({
          clientId: import.meta.env.VITE_APPLE_CLIENT_ID || 'com.chennis.app',
          scope: 'name email',
          redirectURI: window.location.origin + '/login',
          usePopup: true
        });

        try {
          setIsSubmitting(true);
          const response = await appleWindow.AppleID.auth.signIn();
          if (response && response.authorization && response.authorization.id_token) {
            const res = await loginWithSocial('apple', response.authorization.id_token, {
              firstName: response.user?.name?.firstName,
              lastName: response.user?.name?.lastName
            });
            setIsSubmitting(false);
            if (res.success) {
              navigate('/');
            } else {
              const errMsg = res.message || 'Apple authentication failed.';
              toast.error(errMsg);
              if (subView === 'login') setLoginError(errMsg);
              else setRegisterError(errMsg);
            }
          } else {
            setIsSubmitting(false);
          }
        } catch (err: any) {
          setIsSubmitting(false);
          console.error('Apple Sign-In error:', err);
          toast.error('Apple login cancelled or encountered an error.');
        }
      } else {
        toast.error('Apple client library is not loaded yet.');
      }
    }
  };
  */

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterFieldErrors({});

    if (!registerFirstName || !registerLastName || !registerEmail || !registerPhone || !registerPassword) {
      setRegisterError('Please fill in all required fields.');
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setRegisterError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const res = await register({
      first_name: registerFirstName,
      last_name: registerLastName,
      email: registerEmail,
      password: registerPassword,
      phone_number: registerPhone
    });
    setIsSubmitting(false);

    if (!res.success) {
      setRegisterError(res.message || 'Registration failed.');
      if (res.errors) {
        const fieldErrs: { [key: string]: string } = {};
        res.errors.forEach((err: any) => {
          fieldErrs[err.field] = err.message;
        });
        setRegisterFieldErrors(fieldErrs);
      }
    } else {
      toast.success('Account registered successfully! Please log in.');
      setLoginEmail(registerEmail);
      setSubView('login');
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotEmailTouched(true);
    const err = validateForgotEmail(forgotEmail);
    if (err) {
      setForgotEmailError(err);
      toast.error(err);
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(forgotEmail);
      setForgotSuccess(true);
      toast.success('Recovery link sent! Please check your terminal console.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit recovery request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetPassword !== resetConfirmPassword) {
      toast.error('Passwords do not match!');
      return;
    }
    setIsSubmitting(true);
    try {
      await authService.resetPassword({
        token,
        email,
        password: resetPassword
      });
      setResetSuccess(true);
      toast.success('Password has been reset successfully!');
      setResetPassword('');
      setResetConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in flex flex-col md:flex-row w-full min-h-screen">

      {/* Promotional Banner (Hidden on Mobile, Visible on Tablet+) */}
      <div className="hidden md:flex flex-col md:w-1/2 relative bg-[#004220] items-start justify-center p-10 lg:p-20 overflow-hidden min-h-[300px] md:min-h-full">
        <img
          src={subView === 'login'
            ? '/images/login_bg_colorful.png'
            : '/images/register_bg_colorful.png'}
          alt="Promotional background"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#002A14]/40" />

        <div className="relative z-10 w-full max-w-lg">
          <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 mb-6 text-g1 font-extrabold text-[13px] shadow-sm">
            <i className="fa-solid fa-star"></i>
            {subView === 'login' ? 'Trusted by 10,000+ Customers' : 'Join the Community'}
          </div>
          <h1 className="text-white text-4xl lg:text-5xl font-extrabold leading-tight mb-5 drop-shadow-md">
            {subView === 'login' ? (
              <>Welcome back to <br /><span className="text-g2">Pure Nature</span></>
            ) : (
              <>Start your <br /><span className="text-g2">Natural Journey</span></>
            )}
          </h1>
          <p className="text-white text-[16px] lg:text-[18px] font-semibold max-w-[420px] leading-relaxed drop-shadow-md">
            {subView === 'login' ?
              'Access your curated selection of premium organic food, natural cosmetics, and sustainable construction materials.' :
              'Create an account to track your orders and discover a healthier lifestyle.'}
          </p>
        </div>
      </div>

      {/* Auth Card Area */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-12 bg-off">
        <div className="bg-white border border-border-design rounded-[24px] p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.08)] w-full max-w-[480px]">

          {/* LOGIN SUB-VIEW */}
          {subView === 'login' && (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-5">
              <div className="text-center mb-2">
                <h2 className="font-extrabold text-[32px] text-g1 leading-tight mb-2">Welcome Back</h2>
                <p className="text-gray-800 text-[15px] font-semibold">Log In to your Chenni's account</p>
              </div>

              {/* Login Tab switcher */}
              <div className="flex border-b border-border-design mb-2">
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className={`flex-1 pb-3.5 text-[15px] font-extrabold transition-all relative cursor-pointer bg-transparent border-none ${loginMethod === 'email' ? 'text-g1' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Email
                  {loginMethod === 'email' && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-g1 rounded-t-full" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 pb-3.5 text-[15px] font-extrabold transition-all relative cursor-pointer bg-transparent border-none ${loginMethod === 'phone' ? 'text-g1' : 'text-gray-500 hover:text-gray-900'
                    }`}
                >
                  Phone Number
                  {loginMethod === 'phone' && (
                    <div className="absolute bottom-[-1px] left-0 w-full h-[3px] bg-g1 rounded-t-full" />
                  )}
                </button>
              </div>

              {loginError && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-[13px] font-bold flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  {loginError}
                </div>
              )}

              {/* Email/Phone field */}
              <div className="flex flex-col gap-2 text-left">
                <label className="text-[14px] font-extrabold text-gray-900">
                  {loginMethod === 'email' ? 'Email Address' : 'Phone Number'}
                </label>
                <input
                  type={loginMethod === 'email' ? 'email' : 'tel'}
                  placeholder={loginMethod === 'email' ? 'Enter your email' : '+60 1x-xxxxxxx'}
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="border border-border-design rounded-xl px-4 py-3 text-[15px] outline-none focus:border-g1 text-gray-900 font-medium w-full transition-colors bg-white placeholder:text-gray-500"
                />
              </div>

              {/* Password field */}
              <div className="flex flex-col gap-2 text-left relative">
                <div className="flex justify-between items-center">
                  <label className="text-[14px] font-extrabold text-gray-900">Password</label>
                  <button
                    type="button"
                    onClick={() => setSubView('forgot')}
                    className="text-[13px] text-g1 hover:underline font-extrabold bg-transparent border-none cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="border border-border-design rounded-xl pl-4 pr-11 py-3 text-[15px] outline-none focus:border-g1 text-gray-900 font-medium w-full transition-colors bg-white placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-900"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full mt-2"
                style={{ padding: '1rem', borderRadius: '12px' }}
              >
                Sign In
              </Button>

              {/* Commented out Social Login Buttons for now
              <div className="flex items-center gap-3 my-2">
                <div className="h-[1px] bg-border-design flex-1" />
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Or continue with</span>
                <div className="h-[1px] bg-border-design flex-1" />
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSocialClick('google')}
                  className="flex items-center justify-center gap-3 border border-border-design rounded-xl px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors w-full"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[14px] font-extrabold text-gray-800">Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialClick('facebook')}
                  className="flex items-center justify-center gap-3 border border-[#1877F2] rounded-xl px-4 py-3 bg-[#1877F2] hover:bg-[#166fe5] cursor-pointer transition-colors w-full"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-[14px] font-extrabold text-white">Continue with Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialClick('apple')}
                  className="flex items-center justify-center gap-3 border border-black rounded-xl px-4 py-3 bg-black hover:bg-neutral-900 cursor-pointer transition-colors w-full"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.029-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.51 12.059 1.01 1.454 2.187 3.064 3.763 3.002 1.52-.061 2.09-.982 3.931-.982 1.829 0 2.35.982 3.933.95 1.611-.027 2.651-1.455 3.633-2.885 1.13-1.665 1.6-3.275 1.62-3.355-.04-.02-3.14-1.205-3.172-4.767-.03-2.979 2.441-4.407 2.55-4.469-1.39-2.04-3.531-2.27-4.281-2.316-1.969-.159-3.414 1.182-4.063 1.182zm2.665-4.02c.828-1.002 1.385-2.395 1.233-3.776-1.187.048-2.625.79-3.477 1.787-.738.847-1.383 2.257-1.207 3.616 1.32.102 2.66-.632 3.451-1.627z"/>
                  </svg>
                  <span className="text-[14px] font-extrabold text-white">Continue with Apple</span>
                </button>
              </div>
              */}

              <div className="text-center text-[14px] text-gray-800 font-semibold mt-1">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setSubView('register')}
                  className="text-g1 font-extrabold hover:underline bg-transparent border-none cursor-pointer ml-1"
                >
                  Register here
                </button>
              </div>
            </form>
          )}

          {/* REGISTER SUB-VIEW */}
          {subView === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="font-extrabold text-[32px] text-g1 leading-tight mb-2">Create an Account</h2>
                <p className="text-gray-800 text-[15px] font-semibold">Join Chenni's for exclusive offers and faster checkout</p>
              </div>

              {registerError && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-xl text-[13px] font-bold flex items-center gap-2">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  {registerError}
                </div>
              )}

              <div className="flex gap-4">
                <div className="flex flex-col gap-2 text-left flex-1">
                  <label className="text-[14px] font-extrabold text-gray-900">First Name</label>
                  <input
                    type="text"
                    placeholder="First Name"
                    value={registerFirstName}
                    onChange={(e) => setRegisterFirstName(e.target.value)}
                    required
                    className={`border rounded-xl px-4 py-3 text-[15px] outline-none text-gray-900 font-medium w-full transition-colors bg-white placeholder:text-gray-500 ${registerFieldErrors.first_name ? 'border-red-500 focus:border-red-500' : 'border-border-design focus:border-g1'}`}
                  />
                  {registerFieldErrors.first_name && (
                    <span className="text-[12px] font-bold text-red-600">{registerFieldErrors.first_name}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 text-left flex-1">
                  <label className="text-[14px] font-extrabold text-gray-900">Last Name</label>
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={registerLastName}
                    onChange={(e) => setRegisterLastName(e.target.value)}
                    required
                    className={`border rounded-xl px-4 py-3 text-[15px] outline-none text-gray-900 font-medium w-full transition-colors bg-white placeholder:text-gray-500 ${registerFieldErrors.last_name ? 'border-red-500 focus:border-red-500' : 'border-border-design focus:border-g1'}`}
                  />
                  {registerFieldErrors.last_name && (
                    <span className="text-[12px] font-bold text-red-600">{registerFieldErrors.last_name}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label className="text-[14px] font-extrabold text-gray-900">Email Address</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={registerEmail}
                  onChange={(e) => setRegisterEmail(e.target.value)}
                  required
                  className={`border rounded-xl px-4 py-3 text-[15px] outline-none text-gray-900 font-medium w-full transition-colors bg-white placeholder:text-gray-500 ${registerFieldErrors.email ? 'border-red-500 focus:border-red-500' : 'border-border-design focus:border-g1'}`}
                />
                {registerFieldErrors.email && (
                  <span className="text-[12px] font-bold text-red-600">{registerFieldErrors.email}</span>
                )}
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label className="text-[14px] font-extrabold text-gray-900">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+60 1x-xxxxxxx"
                  value={registerPhone}
                  onChange={(e) => setRegisterPhone(e.target.value)}
                  required
                  className={`border rounded-xl px-4 py-3 text-[15px] outline-none text-gray-900 font-medium w-full transition-colors bg-white placeholder:text-gray-500 ${registerFieldErrors.phone_number ? 'border-red-500 focus:border-red-500' : 'border-border-design focus:border-g1'}`}
                />
                {registerFieldErrors.phone_number && (
                  <span className="text-[12px] font-bold text-red-600">{registerFieldErrors.phone_number}</span>
                )}
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label className="text-[14px] font-extrabold text-gray-900">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    className={`border rounded-xl pl-4 pr-11 py-3 text-[15px] outline-none text-gray-900 font-medium w-full transition-colors bg-white placeholder:text-gray-500 ${registerFieldErrors.password ? 'border-red-500 focus:border-red-500' : 'border-border-design focus:border-g1'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-900"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                {registerFieldErrors.password && (
                  <span className="text-[12px] font-bold text-red-600">{registerFieldErrors.password}</span>
                )}
              </div>

              <div className="flex flex-col gap-2 text-left">
                <label className="text-[14px] font-extrabold text-gray-900">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    className="border border-border-design rounded-xl pl-4 pr-11 py-3 text-[15px] outline-none focus:border-g1 text-gray-900 font-medium w-full transition-colors bg-white placeholder:text-gray-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-500 hover:text-gray-900"
                  >
                    <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={isSubmitting}
                className="w-full mt-2"
                style={{ padding: '1rem', borderRadius: '12px' }}
              >
                Create Account
              </Button>

              {/* Commented out Social Login Buttons for now
              <div className="flex items-center gap-3 my-2">
                <div className="h-[1px] bg-border-design flex-1" />
                <span className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">Or continue with</span>
                <div className="h-[1px] bg-border-design flex-1" />
              </div>

              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSocialClick('google')}
                  className="flex items-center justify-center gap-3 border border-border-design rounded-xl px-4 py-3 bg-white hover:bg-gray-50 cursor-pointer transition-colors w-full"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                  </svg>
                  <span className="text-[14px] font-extrabold text-gray-800">Continue with Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialClick('facebook')}
                  className="flex items-center justify-center gap-3 border border-[#1877F2] rounded-xl px-4 py-3 bg-[#1877F2] hover:bg-[#166fe5] cursor-pointer transition-colors w-full"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span className="text-[14px] font-extrabold text-white">Continue with Facebook</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialClick('apple')}
                  className="flex items-center justify-center gap-3 border border-black rounded-xl px-4 py-3 bg-black hover:bg-neutral-900 cursor-pointer transition-colors w-full"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.029-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.51 12.059 1.01 1.454 2.187 3.064 3.763 3.002 1.52-.061 2.09-.982 3.931-.982 1.829 0 2.35.982 3.933.95 1.611-.027 2.651-1.455 3.633-2.885 1.13-1.665 1.6-3.275 1.62-3.355-.04-.02-3.14-1.205-3.172-4.767-.03-2.979 2.441-4.407 2.55-4.469-1.39-2.04-3.531-2.27-4.281-2.316-1.969-.159-3.414 1.182-4.063 1.182zm2.665-4.02c.828-1.002 1.385-2.395 1.233-3.776-1.187.048-2.625.79-3.477 1.787-.738.847-1.383 2.257-1.207 3.616 1.32.102 2.66-.632 3.451-1.627z"/>
                  </svg>
                  <span className="text-[14px] font-extrabold text-white">Continue with Apple</span>
                </button>
              </div>
              */}

              <div className="text-center text-[14px] text-gray-800 font-semibold mt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setSubView('login')}
                  className="text-g1 font-extrabold hover:underline bg-transparent border-none cursor-pointer ml-1"
                >
                  Sign in here
                </button>
              </div>
            </form>
          )}

          {/* FORGOT PASSWORD SUB-VIEW */}
          {subView === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-5">
              <div className="text-center mb-2">
                <h2 className="font-extrabold text-[32px] text-g1 leading-tight mb-2">Reset Password</h2>
                <p className="text-gray-800 text-[15px] font-semibold">Enter your email to receive a recovery link</p>
              </div>

              {forgotSuccess ? (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-6 rounded-2xl text-[15px] font-extrabold text-center flex flex-col gap-3 items-center">
                  <i className="fa-solid fa-circle-check text-g1 text-[36px]"></i>
                  Recovery link sent! Check your email inbox for password recovery steps.
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[14px] font-extrabold text-gray-900">Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForgotEmail(val);
                        if (forgotEmailTouched) {
                          setForgotEmailError(validateForgotEmail(val));
                        }
                      }}
                      onBlur={() => {
                        setForgotEmailTouched(true);
                        setForgotEmailError(validateForgotEmail(forgotEmail));
                      }}
                      required
                      className={`border rounded-xl px-4 py-3 text-[15px] outline-none w-full transition-colors bg-white placeholder:text-gray-500 ${
                        forgotEmailError 
                          ? 'border-red-500 focus:border-red-600 text-red-900 bg-red-50/10 font-semibold' 
                          : 'border-border-design focus:border-g1 text-gray-900 font-medium'
                      }`}
                    />
                    {forgotEmailError && (
                      <span className="text-[12.5px] font-bold text-red-600 flex items-center gap-1.5 mt-0.5 animate-fade-in">
                        <i className="fa-solid fa-circle-exclamation text-[13.5px]"></i>
                        {forgotEmailError}
                      </span>
                    )}
                  </div>

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                    style={{ padding: '1rem', borderRadius: '12px' }}
                  >
                    Send Recovery Link
                  </Button>
                </>
              )}

              <button
                type="button"
                onClick={() => { setSubView('login'); setForgotSuccess(false); }}
                className="text-gray-900 hover:text-g1 text-[15px] font-extrabold text-center bg-transparent border-none cursor-pointer mt-2"
              >
                &larr; Back to Login
              </button>
            </form>
          )}

          {/* RESET PASSWORD SUB-VIEW */}
          {subView === 'reset' && (
            <form onSubmit={handleResetSubmit} className="flex flex-col gap-5">
              <div className="text-center mb-2">
                <h2 className="font-extrabold text-[32px] text-g1 leading-tight mb-2">Create New Password</h2>
                <p className="text-gray-800 text-[15px] font-semibold">Enter your new password for {email}</p>
              </div>

              {resetSuccess ? (
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 p-6 rounded-2xl text-[15px] font-extrabold text-center flex flex-col gap-3 items-center">
                  <i className="fa-solid fa-circle-check text-g1 text-[36px]"></i>
                  Password Reset Successful!
                  <button
                    type="button"
                    onClick={() => {
                      setSubView('login');
                      setResetSuccess(false);
                      navigate('/login');
                    }}
                    className="bg-g1 hover:bg-[#007A3A] text-white border-none rounded-xl py-3 px-6 text-[15px] font-extrabold cursor-pointer mt-2"
                  >
                    Go to Login
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[14px] font-extrabold text-gray-900">New Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      required
                      minLength={6}
                      className="border border-border-design rounded-xl px-4 py-3 text-[15px] outline-none focus:border-g1 text-gray-900 font-medium w-full transition-colors bg-white placeholder:text-gray-500"
                    />
                  </div>

                  <div className="flex flex-col gap-2 text-left">
                    <label className="text-[14px] font-extrabold text-gray-900">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="Repeat new password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="border border-border-design rounded-xl px-4 py-3 text-[15px] outline-none focus:border-g1 text-gray-900 font-medium w-full transition-colors bg-white placeholder:text-gray-500"
                    />
                  </div>

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    className="w-full"
                    style={{ padding: '1rem', borderRadius: '12px' }}
                  >
                    Reset Password
                  </Button>
                </>
              )}

              {!resetSuccess && (
                <button
                  type="button"
                  onClick={() => {
                    setSubView('login');
                    navigate('/login');
                  }}
                  className="text-gray-900 hover:text-g1 text-[15px] font-extrabold text-center bg-transparent border-none cursor-pointer mt-2"
                >
                  &larr; Back to Login
                </button>
              )}
            </form>
          )}

        </div>
      </div>
    </div>
  );
};

export default AuthViews;

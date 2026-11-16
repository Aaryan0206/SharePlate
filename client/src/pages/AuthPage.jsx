import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  User, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  HeartHandshake, 
  Building2, 
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  Sparkles,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export default function AuthPage({ initialMode = 'login' }) {
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [role, setRole] = useState('donor'); // 'donor' or 'recipient'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationType, setOrganizationType] = useState('');

  // Validation & feedback state
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after authentication
  const destination = location.state?.from?.pathname || (user?.role ? `/${user.role}/dashboard` : '/');

  // Handle Quick Demo Account Pre-fill
  const handleQuickDemo = (demoType) => {
    setIsRegister(false);
    setServerError('');
    setFieldErrors({});

    if (demoType === 'admin') {
      setEmail('admin@shareplate.org');
      setPassword('Admin@SharePlate2026');
    } else if (demoType === 'donor') {
      setEmail('donor@greenhearth.com');
      setPassword('BakeryPassword2026!');
    } else if (demoType === 'recipient') {
      setEmail('recipient@metroshelter.org');
      setPassword('ShelterPassword2026!');
    }
  };

  // Validate form before submission
  const validate = () => {
    const errors = {};
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }

    if (isRegister) {
      if (!name.trim()) {
        errors.name = 'Full name or organization name is required';
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
      if (!['donor', 'recipient'].includes(role)) {
        errors.role = 'Please select a valid role (Donor or Recipient)';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      if (isRegister) {
        const newUser = await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          phone: phone.trim(),
          organizationType: organizationType.trim(),
        });
        navigate(`/${newUser.role}/dashboard`, { replace: true });
      } else {
        const loggedInUser = await login(email.trim().toLowerCase(), password);
        const targetRoute = location.state?.from?.pathname || `/${loggedInUser.role}/dashboard`;
        navigate(targetRoute, { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'An error occurred during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 sm:py-16 bg-cream-50 min-h-screen flex flex-col justify-center">
      <div className="max-w-lg w-full mx-auto px-4 sm:px-6">
        
        {/* Phase 2 MongoDB Live Notice */}
        <div className="mb-6 p-3.5 bg-forest-50 border border-forest-200 rounded-2xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-forest-900">
              Live MongoDB Authentication &bull; bcrypt Hash & JWT Verified
            </span>
          </div>
          <Badge variant="forest" size="sm">Phase 2</Badge>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-card space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-forest-800 rounded-2xl flex items-center justify-center text-sage-300 mx-auto shadow-md">
              <KeyRound className="w-6 h-6 text-sage-300" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-charcoal-900 tracking-tight">
              {isRegister ? 'Create Your Account' : 'Welcome Back'}
            </h1>
            <p className="text-xs sm:text-sm text-charcoal-500">
              {isRegister 
                ? 'Join SharePlate to donate excess food or claim free portions' 
                : 'Sign in to access your dashboard and active listings'}
            </p>
          </div>

          {/* Quick Demo Pre-fills (Interview Friendly) */}
          <div className="bg-cream-50 p-3.5 rounded-2xl border border-stone-200/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <span>Quick Demo Logins (MongoDB Verified)</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemo('donor')}
                className="py-1.5 px-2 rounded-xl bg-white border border-stone-200 hover:border-forest-700 hover:bg-forest-50 text-forest-900 font-semibold transition-all shadow-xs"
              >
                Donor
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('recipient')}
                className="py-1.5 px-2 rounded-xl bg-white border border-stone-200 hover:border-forest-700 hover:bg-forest-50 text-forest-900 font-semibold transition-all shadow-xs"
              >
                Recipient
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('admin')}
                className="py-1.5 px-2 rounded-xl bg-white border border-stone-200 hover:border-forest-700 hover:bg-forest-50 text-forest-900 font-semibold transition-all shadow-xs"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {serverError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Authentication Error: </span>
                <span>{serverError}</span>
              </div>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Account Role Selector (Register Only) */}
            {isRegister && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700">
                  Select Account Role *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('donor')}
                    className={`py-3 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                      role === 'donor' 
                        ? 'border-forest-800 bg-forest-50 text-forest-900 font-bold shadow-xs' 
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-forest-700" />
                    <span className="text-xs">Food Donor</span>
                    <span className="text-[10px] text-stone-500 font-normal">Cafeteria, Cafe, Hostels</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('recipient')}
                    className={`py-3 px-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all ${
                      role === 'recipient' 
                        ? 'border-forest-800 bg-forest-50 text-forest-900 font-bold shadow-xs' 
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <HeartHandshake className="w-5 h-5 text-forest-700" />
                    <span className="text-xs">Food Recipient</span>
                    <span className="text-[10px] text-stone-500 font-normal">Individual, Volunteer, NGO</span>
                  </button>
                </div>
                {fieldErrors.role && (
                  <p className="text-[11px] text-red-600 font-medium">{fieldErrors.role}</p>
                )}
              </div>
            )}

            {/* Name Field (Register Only) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                  Full Name / Organization *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. City Campus Dining Services"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                      fieldErrors.name ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.name}</p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@organization.com"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                    fieldErrors.email ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                    fieldErrors.password ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field (Register Only) */}
            {isRegister && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-forest-600 ${
                      fieldErrors.confirmPassword ? 'border-red-400 bg-red-50/20' : 'border-stone-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>
            )}

            {/* Optional Phone / Org Type (Register Only) */}
            {isRegister && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                    Phone (Optional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1-555-0100"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-1">
                    Org Type (Optional)
                  </label>
                  <input
                    type="text"
                    value={organizationType}
                    onChange={(e) => setOrganizationType(e.target.value)}
                    placeholder="e.g. Cafeteria / NGO"
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-forest-600"
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                type="submit"
                loading={isSubmitting}
                className="w-full shadow-md"
                icon={ArrowRight}
                iconPosition="right"
              >
                {isRegister ? 'Complete Registration' : 'Sign In to Account'}
              </Button>
            </div>

          </form>

          {/* Toggle Switch */}
          <div className="text-center pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setServerError('');
                setFieldErrors({});
              }}
              className="text-xs text-forest-800 hover:text-forest-900 hover:underline font-semibold"
            >
              {isRegister 
                ? 'Already have a SharePlate account? Sign In' 
                : "Don't have an account? Register as Donor or Recipient"}
            </button>
          </div>

          {/* Link back to home */}
          <div className="text-center">
            <Link to="/" className="text-xs text-stone-400 hover:text-stone-600">
              &larr; Back to Landing Page
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

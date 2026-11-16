import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  MapPin, 
  PlusCircle, 
  Menu, 
  X, 
  User, 
  LogOut,
  Building2,
  HeartHandshake,
  ShieldAlert,
  ChevronDown,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from './Button';
import Badge from './Badge';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  // Dynamic navigation links based on user role
  const getNavLinks = () => {
    const baseLinks = [
      { label: 'Browse Food', path: '/browse' },
      { label: 'Nearby Map', path: '/map', badge: 'Map' },
      { label: 'How It Works', path: '/#how-it-works' },
      { label: 'Our Impact', path: '/#impact' },
    ];

    if (isAuthenticated && user) {
      if (user.role === 'donor') {
        baseLinks.push({ label: 'Donor Dashboard', path: '/donor/dashboard', badge: 'Donor' });
      } else if (user.role === 'recipient') {
        baseLinks.push({ label: 'My Dashboard', path: '/recipient/dashboard', badge: 'Recipient' });
      } else if (user.role === 'admin') {
        baseLinks.push({ label: 'Admin Portal', path: '/admin/dashboard', badge: 'Admin' });
      }
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'donor': return Building2;
      case 'recipient': return HeartHandshake;
      case 'admin': return ShieldAlert;
      default: return User;
    }
  };

  const RoleIcon = user ? getRoleIcon(user.role) : User;

  return (
    <header className="sticky top-0 z-40 w-full bg-cream-50/90 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-forest-800 flex items-center justify-center text-sage-200 shadow-md group-hover:bg-forest-900 group-hover:scale-105 transition-all">
              <UtensilsCrossed className="w-6 h-6 text-sage-300" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-forest-900 font-sans">
                  Share<span className="text-sage-700">Plate</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold bg-sage-100 text-forest-800 rounded border border-sage-200">
                  Surplus Food
                </span>
              </div>
              <span className="text-xs text-charcoal-500 font-medium tracking-wide">
                Share more. Waste less.
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.path);
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    active 
                      ? 'text-forest-900 bg-forest-50 font-semibold' 
                      : 'text-charcoal-700 hover:text-forest-800 hover:bg-stone-100/60'
                  }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-sage-100 text-forest-800 border border-sage-200">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action / Auth Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-white border border-stone-200 hover:border-forest-700 transition-all shadow-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-forest-800 text-white flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left hidden lg:block">
                    <div className="text-xs font-bold text-charcoal-900 truncate max-w-[120px]">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-forest-800 font-semibold uppercase tracking-wider">
                      {user.role}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-stone-400" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-stone-200 z-50 animate-in fade-in duration-150">
                    <div className="p-2 border-b border-stone-100 mb-1">
                      <div className="text-xs font-bold text-charcoal-900">{user.name}</div>
                      <div className="text-[11px] text-stone-500 truncate">{user.email}</div>
                      <Badge variant="forest" size="sm" className="mt-1.5 capitalize">
                        {user.role} Account
                      </Badge>
                    </div>

                    <Link
                      to={`/${user.role}/dashboard`}
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-charcoal-700 hover:bg-forest-50 hover:text-forest-900 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-forest-700" />
                      <span>{user.role === 'admin' ? 'Admin Portal' : 'My Dashboard'}</span>
                    </Link>

                    {user.role === 'donor' && (
                      <Link
                        to="/donate"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-charcoal-700 hover:bg-forest-50 hover:text-forest-900 transition-colors"
                      >
                        <PlusCircle className="w-4 h-4 text-forest-700" />
                        <span>Post Surplus Food</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="md" icon={User}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/donate">
                  <Button variant="primary" size="md" icon={PlusCircle}>
                    Share Surplus
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <Link to="/donate" className="p-2 text-forest-800 bg-sage-100 rounded-xl">
              <PlusCircle className="w-5 h-5" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-charcoal-700 hover:text-forest-900 hover:bg-stone-100 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-stone-200 bg-white/98 px-4 pt-3 pb-6 shadow-xl">
          {isAuthenticated && user && (
            <div className="p-3 mb-3 bg-cream-50 rounded-2xl border border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-forest-800 text-white flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-bold text-charcoal-900">{user.name}</div>
                  <div className="text-[10px] text-forest-800 uppercase font-semibold">{user.role}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-red-600 font-semibold px-2.5 py-1 bg-red-50 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          )}

          <div className="flex flex-col gap-1 pb-4">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-xl text-base font-medium flex items-center justify-between ${
                  isActive(link.path)
                    ? 'text-forest-900 bg-forest-50 font-semibold'
                    : 'text-charcoal-700 hover:text-forest-800 hover:bg-stone-50'
                }`}
              >
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-xs px-2 py-0.5 rounded bg-sage-100 text-forest-800">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {!isAuthenticated && (
            <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
              <Link to="/donate" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="primary" size="md" className="w-full" icon={PlusCircle}>
                  Share Surplus Food
                </Button>
              </Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="w-full">
                <Button variant="outline" size="md" className="w-full" icon={User}>
                  Sign In / Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

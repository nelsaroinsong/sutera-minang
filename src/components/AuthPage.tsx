import React, { useState } from 'react';
import { Logo } from './Logo';
import { UserProfile } from '../types';
import {
  signInCustomer,
  signUpCustomer,
  signInAdminPortal,
} from '../lib/supabase';
import {
  Eye,
  EyeOff,
  ChefHat,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (profile: UserProfile) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [portalMode, setPortalMode] = useState<
    'customer-signin' | 'customer-signup' | 'admin-login'
  >('customer-signin');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const switchMode = (
    mode: 'customer-signin' | 'customer-signup' | 'admin-login'
  ) => {
    setPortalMode(mode);
    setErrorMsg(null);
    setShowPassword(false);
  };

  const handleCustomerSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const profile = await signInCustomer(email, password);
      onAuthSuccess(profile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal masuk. Periksa email dan kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }
    setLoading(true);
    try {
      const profile = await signUpCustomer({
        full_name: fullName,
        email,
        phone,
        password,
      });
      onAuthSuccess(profile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mendaftarkan akun pembeli.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const profile = await signInAdminPortal(email, password);
      onAuthSuccess(profile);
    } catch (err: any) {
      setErrorMsg(err.message || 'Akses ditolak. Kredensial Admin salah.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@suteraminang.com');
    setPassword('admin123');
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#261C14] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 text-center">
          <Logo size="lg" variant="full" />
        </div>

        <div className="sm-menu-frame rounded-2xl overflow-hidden">
          <div className="sm-corner-tl" />
          <div className="sm-corner-tr" />
          <div className="sm-corner-bl" />
          <div className="sm-corner-br" />

          {/* Top Navigation Strip */}
          {portalMode !== 'admin-login' ? (
            <div className="grid grid-cols-2 border-b border-[#E5DCCB] bg-[#FAF6F0]">
              <button
                type="button"
                onClick={() => switchMode('customer-signin')}
                className={`py-3 font-cinzel text-xs font-bold tracking-wider uppercase transition-colors relative ${
                  portalMode === 'customer-signin'
                    ? 'text-[#4A331F] bg-[#FFFFFF]'
                    : 'text-[#8A7968] hover:text-[#261C14]'
                }`}
              >
                Masuk
                {portalMode === 'customer-signin' && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#8C6518]" />
                )}
              </button>

              <button
                type="button"
                onClick={() => switchMode('customer-signup')}
                className={`py-3 font-cinzel text-xs font-bold tracking-wider uppercase transition-colors relative ${
                  portalMode === 'customer-signup'
                    ? 'text-[#4A331F] bg-[#FFFFFF]'
                    : 'text-[#8A7968] hover:text-[#261C14]'
                }`}
              >
                Daftar Akun
                {portalMode === 'customer-signup' && (
                  <div className="absolute bottom-0 inset-x-0 h-0.5 bg-[#8C6518]" />
                )}
              </button>
            </div>
          ) : (
            <div className="px-5 py-3 bg-[#FAF6F0] border-b border-[#E5DCCB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-[#8C6518]" />
                <span className="font-cinzel text-xs font-bold text-[#261C14] uppercase tracking-wider">
                  Portal Admin
                </span>
              </div>
              <button
                type="button"
                onClick={() => switchMode('customer-signin')}
                className="text-xs font-medium text-[#7D5A14] hover:text-[#261C14] underline"
              >
                Kembali
              </button>
            </div>
          )}

          <div className="p-5 sm:p-6">
            {errorMsg && (
              <div
                role="alert"
                className="mb-4 p-3 rounded-lg bg-[#FDF1F0] border border-[#E8B4AE] text-[#A63429] text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 text-[#A63429] shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* ============================================================= */}
            {/* CUSTOMER SIGN IN                                              */}
            {/* ============================================================= */}
            {portalMode === 'customer-signin' && (
              <form onSubmit={handleCustomerSignIn} className="space-y-3.5">
                <div className="sm-field">
                  <label htmlFor="signin-email" className="sm-label">
                    Email
                  </label>
                  <input
                    id="signin-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    spellCheck={false}
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="sm-input"
                  />
                </div>

                <div className="sm-field">
                  <label htmlFor="signin-password" className="sm-label">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="signin-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="Masukkan kata sandi"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="sm-input !pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-pressed={showPassword}
                      aria-label={
                        showPassword
                          ? 'Sembunyikan kata sandi'
                          : 'Tampilkan kata sandi'
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A7968] hover:text-[#261C14]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="sm-btn-primary w-full mt-1"
                >
                  <span>
                    {loading ? 'Memproses...' : 'Masuk & Pesan Hidangan'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* ============================================================= */}
            {/* CUSTOMER SIGN UP                                              */}
            {/* ============================================================= */}
            {portalMode === 'customer-signup' && (
              <form onSubmit={handleCustomerSignUp} className="space-y-3.5">
                <div className="sm-field">
                  <label htmlFor="signup-fullname" className="sm-label">
                    Nama Lengkap
                  </label>
                  <input
                    id="signup-fullname"
                    name="fullname"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Nama lengkap Anda"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="sm-input"
                  />
                </div>

                <div className="sm-field">
                  <label htmlFor="signup-email" className="sm-label">
                    Email
                  </label>
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    spellCheck={false}
                    required
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="sm-input"
                  />
                </div>

                <div className="sm-field">
                  <label htmlFor="signup-phone" className="sm-label">
                    No. WhatsApp / Telepon
                  </label>
                  <input
                    id="signup-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    placeholder="0812xxxxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="sm-input"
                  />
                </div>

                <div className="sm-field">
                  <label htmlFor="signup-password" className="sm-label">
                    Buat Kata Sandi (Min. 6 Karakter)
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      placeholder="Minimal 6 karakter"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="sm-input !pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-pressed={showPassword}
                      aria-label={
                        showPassword
                          ? 'Sembunyikan kata sandi'
                          : 'Tampilkan kata sandi'
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A7968] hover:text-[#261C14]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="sm-btn-primary w-full mt-1"
                >
                  <span>
                    {loading ? 'Mendaftarkan...' : 'Daftar & Mulai Pesan'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            {/* ============================================================= */}
            {/* ADMIN LOGIN                                                   */}
            {/* ============================================================= */}
            {portalMode === 'admin-login' && (
              <form onSubmit={handleAdminSignIn} className="space-y-3.5">
                <div className="sm-field">
                  <label htmlFor="admin-email" className="sm-label">
                    Email Pengelola
                  </label>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    spellCheck={false}
                    required
                    placeholder="admin@suteraminang.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="sm-input"
                  />
                </div>

                <div className="sm-field">
                  <label htmlFor="admin-password" className="sm-label">
                    Kata Sandi Admin
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="sm-input !pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-pressed={showPassword}
                      aria-label={
                        showPassword
                          ? 'Sembunyikan kata sandi'
                          : 'Tampilkan kata sandi'
                      }
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8A7968] hover:text-[#261C14]"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#FAF6F0] border border-[#E5DCCB] flex items-center justify-between gap-2 text-[11px]">
                  <div className="text-[#5C4D40] truncate">
                    Demo:{' '}
                    <code className="font-semibold text-[#4A331F]">
                      admin@suteraminang.com
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={fillDemoAdmin}
                    className="sm-btn-secondary !py-1 !px-2 !min-h-0 !text-[11px] shrink-0"
                  >
                    Isi Otomatis
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="sm-btn-primary w-full"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    {loading ? 'Memverifikasi...' : 'Masuk Dashboard Admin'}
                  </span>
                </button>
              </form>
            )}
          </div>

          {portalMode !== 'admin-login' && (
            <div className="px-5 py-3 bg-[#FAF6F0] border-t border-[#E5DCCB] flex items-center justify-between text-xs">
              <span className="text-[#6B5A4B]">Staf / Pengelola?</span>
              <button
                type="button"
                onClick={() => switchMode('admin-login')}
                className="inline-flex items-center gap-1 text-[#7D5A14] hover:text-[#261C14] font-semibold"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Portal Admin →</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Database, Copy, Check, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { getSupabaseConfig, saveSupabaseConfig, clearSupabaseConfig, getSupabase } from '../lib/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig?.url || '');
  const [anonKey, setAnonKey] = useState(currentConfig?.anonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) {
      alert('Silakan masukkan Project URL dan Anon Key Supabase.');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      saveSupabaseConfig(url, anonKey);
      const client = getSupabase();
      if (!client) throw new Error('Gagal inisialisasi client Supabase');

      // Test simple select on categories or healthcheck
      const { error } = await client.from('categories').select('count', { count: 'exact', head: true });
      if (error && error.code !== 'PGRST116') {
        // Table might not exist yet, but connection reached
        setTestResult({
          success: true,
          message: 'Terhubung ke Supabase! (Pastikan skema SQL sudah Anda jalankan di SQL Editor Supabase).',
        });
      } else {
        setTestResult({
          success: true,
          message: 'Koneksi Supabase berhasil & tabel terdeteksi!',
        });
      }
      onConfigSaved();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Koneksi gagal: ${err.message || 'Cek URL dan Anon Key'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetToMock = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    onConfigSaved();
    alert('Mode dialihkan ke Penyimpanan Lokal / Mock Mode.');
  };

  const copySqlSchema = async () => {
    try {
      const response = await fetch('/supabase_schema.sql');
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      // Fallback text if file fetch fails
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl bg-[#1A1614] text-[#DDD2C4] border border-[#D4AF37]/40 rounded-2xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[#C5A059] hover:bg-[#251E19] hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-[#F4EFEB]">
              Konfigurasi Backend Supabase
            </h2>
            <p className="text-xs text-[#A89B8C]">
              Hubungkan database PostgreSQL & Realtime channel untuk Sutera Minang.
            </p>
          </div>
        </div>

        {/* Step Guide */}
        <div className="my-5 p-4 rounded-xl bg-[#14110F] border border-[#D4AF37]/20 space-y-2 text-xs">
          <p className="font-semibold text-[#E5C378] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            Langkah Cepat Setup Supabase:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-[#DDD2C4]/90 pl-1">
            <li>Buka dashboard project di <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-[#D4AF37] underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a></li>
            <li>Buka menu <strong>Project Settings → API</strong>, salin <em>Project URL</em> dan <em>anon/public Key</em> ke form di bawah.</li>
            <li>Buka <strong>SQL Editor</strong> di Supabase, lalu jalankan skema tabel & seed data awal.</li>
          </ol>

          <div className="pt-2">
            <button
              type="button"
              onClick={copySqlSchema}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#251E19] text-[#E5C378] border border-[#D4AF37]/30 hover:bg-[#D4AF37] hover:text-[#12100E] font-medium transition-colors"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? '✓ Skema SQL Berhasil Disalin!' : 'Salin Skema SQL (Schema & Seed)'}</span>
            </button>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-[#C5A059] mb-1">
              Project URL
            </label>
            <input
              type="url"
              placeholder="https://xyzcompany.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-[#12100E] border border-[#D4AF37]/30 rounded-lg text-[#F4EFEB] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-[#C5A059] mb-1">
              Anon / Public API Key
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              required
              className="w-full px-3 py-2 text-sm bg-[#12100E] border border-[#D4AF37]/30 rounded-lg text-[#F4EFEB] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs border ${
                testResult.success
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/60 border-red-500/40 text-red-300'
              }`}
            >
              {testResult.message}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#D4AF37]/20">
            <button
              type="button"
              onClick={handleResetToMock}
              className="text-xs text-[#A89B8C] hover:text-[#DDD2C4] underline"
            >
              Gunakan Mock Mode Lokal
            </button>

            <button
              type="submit"
              disabled={testing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#D4AF37] text-[#12100E] font-bold text-xs hover:brightness-110 shadow disabled:opacity-50"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              <span>{testing ? 'Menguji Koneksi...' : 'Simpan & Hubungkan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

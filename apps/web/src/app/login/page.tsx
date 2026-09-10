'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/auth';
import { LogoMark } from '@/components/Logo';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@lockedin.test' },
  { label: 'HR', email: 'hr@lockedin.test' },
  { label: 'Team lead', email: 'lead@lockedin.test' },
  { label: 'Employee', email: 'employee@lockedin.test' },
];

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn(withEmail: string, withPassword: string) {
    setError('');
    setLoading(true);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        mode === 'login'
          ? { email: withEmail, password: withPassword }
          : { email: withEmail, password: withPassword, fullName, orgName };
      const { data } = await api.post(path, body);
      const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.access_token}` } });
      setSession(data.access_token, me.data);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      {/* Left: the pitch. */}
      <section className="aurora-hero hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-2.5">
          <span className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur grid place-items-center border border-white/15">
            <LogoMark size={25} color="#fff" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-white">LockedIn</span>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-[32px] leading-[1.15] font-semibold tracking-tight text-white">
            Every task, hour and outcome — in one honest scoreboard.
          </h2>
          <p className="text-sm text-white/70 mt-4 leading-relaxed">
            Leads assign weighted work with deadlines. People track the time it really takes. The score comes out of
            the work itself, not a once-a-year form.
          </p>
          <div className="flex gap-6 mt-8">
            {[
              ['Weighted', 'tasks'],
              ['Tracked', 'time'],
              ['Earned', 'scores'],
            ].map(([a, b]) => (
              <div key={a}>
                <div className="text-white text-sm font-medium">{a}</div>
                <div className="text-white/50 text-xs">{b}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-[11px] text-white/50">Open source · self-hosted · your data stays yours.</p>
      </section>

      {/* Right: the form. */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm animate-rise">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <span className="h-9 w-9 rounded-xl bg-black grid place-items-center">
              <LogoMark size={23} color="#fff" />
            </span>
            <span className="text-[15px] font-semibold tracking-tight text-gray-900">LockedIn</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-gray-900">
            {mode === 'login' ? 'Sign in' : 'Create your workspace'}
          </h1>
          <p className="text-[13px] text-gray-500 mt-1 mb-7">
            {mode === 'login'
              ? 'Welcome back. Pick up where your team left off.'
              : 'Start a new organization — you become its administrator.'}
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              signIn(email, password);
            }}
            className="space-y-4"
          >
            {mode === 'register' && (
              <>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Full name</label>
                  <input className="input mt-1.5" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Organization</label>
                  <input
                    className="input mt-1.5"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Acme Inc."
                  />
                </div>
              </>
            )}
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Email</label>
              <input
                type="email"
                className="input mt-1.5"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider text-gray-500">Password</label>
              <input
                type="password"
                className="input mt-1.5"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="text-[13px] text-red-400 bg-red-50 border border-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create workspace'}
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="text-[11px] uppercase tracking-wider text-gray-500 mb-2.5">Demo accounts</div>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.email}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setEmail(a.email);
                      setPassword('password123');
                      signIn(a.email, 'password123');
                    }}
                    className="btn-secondary text-xs justify-start py-2"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 mt-2.5">One click signs you straight in as that role.</p>
            </div>
          )}

          <button
            className="text-[13px] text-gray-500 hover:text-gray-900 transition-colors mt-6"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? 'New organization? Create a workspace →' : '← Back to sign in'}
          </button>
        </div>
      </section>
    </main>
  );
}

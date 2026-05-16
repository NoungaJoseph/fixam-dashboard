"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Toolbox, Lock, Mail, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (token) router.push("/dashboard")
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.185:5000/api';
      console.log('Attempting login to:', apiUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (!data.token) {
        throw new Error('No token received from server');
      }

      if (data.user.role !== 'ADMIN') {
        throw new Error('Access denied. You do not have administrator privileges.');
      }

      // Store token for subsequent requests
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      
      console.log('Login successful, redirecting...');
      router.push("/dashboard")
    } catch (err) {
      console.error('Dashboard Login Error:', err);
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Toolbox className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Fixam Admin</h1>
            <p className="text-sm text-slate-400">Sign in with an admin account.</p>
          </div>
        </div>

        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>}

        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Email</label>
        <div className="mb-4 flex h-12 items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 text-slate-200 focus-within:border-blue-600">
          <Mail className="h-4 w-4 text-slate-500" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder="admin@fixam.com" />
        </div>

        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">Password</label>
        <div className="mb-6 flex h-12 items-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 text-slate-200 focus-within:border-blue-600">
          <Lock className="h-4 w-4 text-slate-500" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" placeholder="Password" />
        </div>

        <button disabled={loading} type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  )
}

"use client";

import React, { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { Shield, Key, Mail, User, Briefcase, ChevronRight, Loader2, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("admin"); // "admin" | "hr" | "employee"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        // Sign up flow
        await signIn("password", {
          email,
          password,
          name,
          role,
          flow: "signUp",
        });
      } else {
        // Sign in flow
        await signIn("password", {
          email,
          password,
          flow: "signIn",
        });
      }
      
      // Redirect to the dashboard
      router.push("/admin");
    } catch (err: unknown) {
      console.error("Auth error:", err);
      let errMsg = "Authentication failed. Please check your credentials.";
      if (err instanceof Error) {
        const msg = err.message;
        if (msg.includes("InvalidSecret") || msg.includes("InvalidAccountId") || msg.includes("Invalid credentials")) {
          errMsg = "Incorrect email or password. Please try again.";
        } else if (msg.includes("TooManyFailedAttempts")) {
          errMsg = "Too many failed login attempts. Please try again later.";
        } else if (msg.includes("Password must be at least")) {
          // Extract password requirement message
          const match = msg.match(/Password must be at least \d+ characters/i);
          errMsg = match ? match[0] : msg;
        } else {
          // Remove ugly uncaught error prefix if it exists
          errMsg = msg.replace(/^.*?Uncaught Error:\s*/i, "");
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };




  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
        
        {/* Top Logo branding */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 border border-indigo-100">
            <Shield className="h-6 w-6 stroke-[1.5]" />
          </div>
          <h1 className="text-xl font-medium text-slate-800 tracking-tight">Nexora ERP Portal</h1>
          <p className="text-sm text-slate-500 mt-1">Unified login for Enterprise Management</p>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(""); }}
            className={`py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              !isSignUp 
                ? "bg-white text-slate-800 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(""); }}
            className={`py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isSignUp 
                ? "bg-white text-slate-800 shadow-xs" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm p-3.5 rounded-xl mb-5">
            <AlertCircle className="h-5 w-5 shrink-0 stroke-[1.5] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 stroke-[1.5]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
                  Select System Role
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 stroke-[1.5]" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200 appearance-none"
                  >
                    <option value="admin">Administrator (Access Panel)</option>
                    <option value="hr">HR Specialist (Access Panel)</option>
                    <option value="employee">Employee (Strict Data Isolation)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 stroke-[1.5]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 stroke-[1.5]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 bg-indigo-600 text-white font-medium text-sm rounded-xl hover:bg-indigo-700 active:bg-indigo-800 focus:outline-hidden disabled:opacity-50 transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? "Create Account" : "Sign In"}</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </main>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  User,
  Phone,
  MapPin,
  Lock,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Mail,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const currentUser = useQuery(api.users.current);
  const myProfileData = useQuery(api.employee.getMyProfile);
  const updateProfile = useMutation(api.employee.updateMyProfile);

  const [form, setForm] = useState({
    phone: "",
    address: "",
    emergencyContact: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (myProfileData) {
      setForm({
        phone: myProfileData.user?.phone || "",
        address: myProfileData.profile?.address || "",
        emergencyContact: myProfileData.profile?.emergencyContact || "",
        password: "",
      });
    }
  }, [myProfileData]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload: {
        phone?: string;
        address?: string;
        emergencyContact?: string;
        password?: string;
      } = {
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        emergencyContact: form.emergencyContact.trim() || undefined,
      };
      if (form.password) {
        if (form.password.length < 4) {
          throw new Error("Password must be at least 4 characters.");
        }
        payload.password = form.password;
      }

      const res = await updateProfile(payload);
      setSuccessMsg(res.message);
      setForm((prev) => ({ ...prev, password: "" }));
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || !myProfileData) {
    return (
      <div className="py-12 text-center text-slate-450 dark:text-slate-550 flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading profile settings...</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header Banner */}
      <div>
        <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">My Profile Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Manage your contact details and security credentials.</p>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3.5 rounded-xl animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3.5 rounded-xl animate-fade-in">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Card Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center gap-4 select-none">
        <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-650 dark:text-indigo-400 text-lg font-bold uppercase">
          {currentUser.name?.charAt(0) || "U"}
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-none">{currentUser.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">
              {currentUser.role}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {currentUser.email}
            </span>
          </div>
        </div>
      </div>

      {/* Form Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                <span>Contact Number</span>
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 (555) 012-3456"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {/* Emergency Contact */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                <span>Emergency Contact Reference</span>
              </label>
              <input
                type="text"
                value={form.emergencyContact}
                onChange={(e) => setForm((p) => ({ ...p, emergencyContact: e.target.value }))}
                placeholder="Name & Relation / Contact"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
              />
            </div>

          </div>

          {/* Address */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>Residential Address</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              placeholder="e.g. 123 Main St, New York, NY"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Password Change */}
          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-850">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Change Portal Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder="Leave blank to keep current password"
                className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Save Profile</span>
            </button>
          </div>

        </form>
      </div>
    </motion.div>
  );
}

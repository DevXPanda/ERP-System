"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  Settings,
  Lock,
  CheckCircle,
  Bell,
  Globe,
  DollarSign,
  ShieldAlert,
  Building,
  Loader2,
  Building2,
  MapPin,
  Navigation,
  Edit2,
  Trash2,
  Plus,
  Check,
  AlertTriangle,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const currentUser = useQuery(api.users.current);
  const offices = useQuery(api.offices.getOffices);

  const createOffice = useMutation(api.offices.createOffice);
  const updateOffice = useMutation(api.offices.updateOffice);
  const deleteOffice = useMutation(api.offices.deleteOffice);

  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    notifications: true,
    weeklyDigest: false,
    timezone: "UTC+5:30 (IST)",
    companyName: "NKTech Head Office",
    fiscalMonth: "January",
  });

  // Geofence management states
  const [editingId, setEditingId] = useState<Id<"officeLocation"> | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [officeForm, setOfficeForm] = useState({
    name: "",
    address: "",
    latitude: 28.626568,
    longitude: 77.3723755,
    radius: 30,
  });

  const [officeError, setOfficeError] = useState("");
  const [officeSuccess, setOfficeSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSuccessMsg("Settings preferences saved successfully!");
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 3500);
    }, 800);
  };

  const handleEditClick = (office: Doc<"officeLocation">) => {
    setEditingId(office._id);
    setIsAdding(false);
    setOfficeForm({
      name: office.name,
      address: office.address,
      latitude: office.latitude,
      longitude: office.longitude,
      radius: office.radius,
    });
    setOfficeError("");
    setOfficeSuccess("");
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setOfficeForm({
      name: "",
      address: "",
      latitude: 28.626568,
      longitude: 77.3723755,
      radius: 30,
    });
    setOfficeError("");
    setOfficeSuccess("");
  };

  const handleSaveOffice = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setOfficeError("");
    setOfficeSuccess("");
    try {
      if (editingId) {
        await updateOffice({
          officeId: editingId,
          name: officeForm.name,
          address: officeForm.address,
          latitude: Number(officeForm.latitude),
          longitude: Number(officeForm.longitude),
          radius: Number(officeForm.radius),
        });
        setOfficeSuccess("Office location updated successfully!");
        setEditingId(null);
      } else {
        await createOffice({
          name: officeForm.name,
          address: officeForm.address,
          latitude: Number(officeForm.latitude),
          longitude: Number(officeForm.longitude),
          radius: Number(officeForm.radius),
        });
        setOfficeSuccess("Office location created successfully!");
        setIsAdding(false);
      }
      setTimeout(() => setOfficeSuccess(""), 3500);
    } catch (err) {
      setOfficeError(err instanceof Error ? err.message : "Failed to save office location.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteOffice = async (id: Id<"officeLocation">) => {
    if (!confirm("Are you sure you want to delete this office location?")) return;
    setActionLoading(true);
    setOfficeError("");
    setOfficeSuccess("");
    try {
      await deleteOffice({ officeId: id });
      setOfficeSuccess("Office location deleted successfully!");
      setTimeout(() => setOfficeSuccess(""), 3500);
    } catch (err) {
      setOfficeError(err instanceof Error ? err.message : "Failed to delete office location.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="py-12 text-center text-slate-450 dark:text-slate-550 flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading settings...</span>
      </div>
    );
  }

  const isAdmin = currentUser.role === "admin";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Enterprise Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Configure corporate properties, notification channels, geofencing parameters, and security rules.</p>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3.5 rounded-xl animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: General settings (Shared) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex gap-3 items-center border-b border-slate-100 dark:border-slate-850 pb-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Settings className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">General Preferences</h3>
                <p className="text-[10px] text-slate-400">Configure language, timezones, and display settings.</p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Timezone / Locale</span>
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings((p) => ({ ...p, timezone: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="UTC-5 (EST)">UTC-5 (Eastern Standard Time)</option>
                  <option value="UTC-8 (PST)">UTC-8 (Pacific Standard Time)</option>
                  <option value="UTC+0 (GMT)">UTC+0 (Greenwich Mean Time)</option>
                  <option value="UTC+5:30 (IST)">UTC+5:30 (Indian Standard Time)</option>
                </select>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5" />
                  <span>Notification Settings</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings((p) => ({ ...p, notifications: e.target.checked }))}
                    className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-800 accent-indigo-650 cursor-pointer"
                  />
                  <span className="text-xs text-slate-650 dark:text-slate-350 font-medium">Enable real-time notification alerts</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.weeklyDigest}
                    onChange={(e) => setSettings((p) => ({ ...p, weeklyDigest: e.target.checked }))}
                    className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-800 accent-indigo-650 cursor-pointer"
                  />
                  <span className="text-xs text-slate-650 dark:text-slate-350 font-medium">Email weekly digest reports</span>
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Preferences</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Restricted admin panels */}
        <div className="space-y-6">
          
          {/* Company configuration */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-48 select-none">
            {!isAdmin && (
              <div className="absolute inset-0 bg-slate-50/70 dark:bg-slate-950/75 backdrop-blur-[1.5px] z-10 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-550">
                <Lock className="h-6 w-6 text-slate-400 stroke-[1.8]" />
                <span className="text-xs font-semibold uppercase tracking-wider">Admin Permission Required</span>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex gap-2.5 items-center">
                <Building className="h-4.5 w-4.5 text-slate-400" />
                <h4 className="font-bold text-slate-855 dark:text-slate-100 text-xs">Company Details</h4>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
                Update headquarters address, business registrations, legal name, tax identifiers, and contact details.
              </p>
            </div>
            
            <button
              disabled
              className="w-full py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-400 rounded-xl text-xs font-semibold"
            >
              Configure Profile
            </button>
          </div>

          {/* Payroll Configuration */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-48 select-none">
            {!isAdmin && (
              <div className="absolute inset-0 bg-slate-50/70 dark:bg-slate-950/75 backdrop-blur-[1.5px] z-10 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-550">
                <Lock className="h-6 w-6 text-slate-400 stroke-[1.8]" />
                <span className="text-xs font-semibold uppercase tracking-wider">Admin Permission Required</span>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex gap-2.5 items-center">
                <DollarSign className="h-4.5 w-4.5 text-slate-400" />
                <h4 className="font-bold text-slate-855 dark:text-slate-100 text-xs">Payroll Calendars</h4>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
                Configure salary payment intervals (semi-monthly/monthly), direct deposits, allowances categories, and tax rates.
              </p>
            </div>
            
            <button
              disabled
              className="w-full py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-400 rounded-xl text-xs font-semibold"
            >
              Configure Payroll Schedule
            </button>
          </div>

        </div>

      </div>

      {/* Office Locations Geofencing Control Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Building2 className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">Office Geofencing Locations</h3>
              <p className="text-[10px] text-slate-400">Manage GPS coordinates and allowed check-in radius for office geofencing.</p>
            </div>
          </div>

          {isAdmin && !isAdding && !editingId && (
            <button
              onClick={handleAddClick}
              className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Location</span>
            </button>
          )}
        </div>

        {/* Status/Error Messaging */}
        {officeSuccess && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl">
            <CheckCircle className="h-4 w-4 shrink-0" />
            <span>{officeSuccess}</span>
          </div>
        )}
        {officeError && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{officeError}</span>
          </div>
        )}

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSaveOffice}
            className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl space-y-4"
          >
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200">
              {isAdding ? "Add Office Location" : "Edit Office Location"}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Office Name</label>
                <input
                  type="text"
                  required
                  value={officeForm.name}
                  onChange={(e) => setOfficeForm({ ...officeForm, name: e.target.value })}
                  placeholder="e.g. NKTech Head Office"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-850 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Allowed Radius (meters)</label>
                <input
                  type="number"
                  required
                  min={5}
                  max={5000}
                  value={officeForm.radius}
                  onChange={(e) => setOfficeForm({ ...officeForm, radius: Number(e.target.value) })}
                  placeholder="e.g. 30"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-850 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Latitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  required
                  value={officeForm.latitude}
                  onChange={(e) => setOfficeForm({ ...officeForm, latitude: Number(e.target.value) })}
                  placeholder="e.g. 28.626568"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-850 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Longitude</label>
                <input
                  type="number"
                  step="0.0000001"
                  required
                  value={officeForm.longitude}
                  onChange={(e) => setOfficeForm({ ...officeForm, longitude: Number(e.target.value) })}
                  placeholder="e.g. 77.3723755"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-850 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Complete Address</label>
                <textarea
                  required
                  rows={2}
                  value={officeForm.address}
                  onChange={(e) => setOfficeForm({ ...officeForm, address: e.target.value })}
                  placeholder="Street, Floor, Building, City, State, ZIP..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-850 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-250 dark:hover:bg-slate-750 text-xs rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {actionLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                <span>Save Location</span>
              </button>
            </div>
          </motion.form>
        )}

        {/* Office Location Cards Grid */}
        {offices === undefined ? (
          <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
            <span className="text-xs">Loading office geofences...</span>
          </div>
        ) : offices.length === 0 ? (
          <div className="py-8 text-center text-slate-450 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex flex-col items-center justify-center gap-2">
            <Building2 className="h-8 w-8 text-slate-300" />
            <span className="text-xs font-medium">No office locations configured yet.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offices.map((office: Doc<"officeLocation">) => (
              <div
                key={office._id}
                className="p-4 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-850 rounded-xl space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 rounded-lg flex items-center justify-center shrink-0">
                        <MapPin className="h-3.5 w-3.5" />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{office.name}</span>
                    </div>
                    {office.name === "NKTech Head Office" && (
                      <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 rounded-md text-[8px] font-bold uppercase tracking-wider">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium leading-normal">
                    {office.address}
                  </p>

                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-650 dark:text-slate-400">
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide">Latitude</span>
                      <span className="font-mono font-medium">{office.latitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide">Longitude</span>
                      <span className="font-mono font-medium">{office.longitude.toFixed(6)}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wide">Radius limit</span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{office.radius} meters</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex justify-end gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleEditClick(office)}
                      disabled={actionLoading}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
                      title="Edit Coordinates"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteOffice(office._id)}
                      disabled={actionLoading}
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Delete Office"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </motion.div>
  );
}

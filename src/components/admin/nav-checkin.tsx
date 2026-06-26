"use client";

import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, Loader2, MapPin, X, AlertCircle, AlertTriangle } from "lucide-react";

interface GeofenceBreach {
  error: string;
  officeName: string;
  address: string;
  distance: number;
  radius: number;
  lat: number;
  lng: number;
}

/**
 * NavCheckIn
 * A compact check-in / check-out button that lives in the top navbar.
 * Works for any user role (employee, hr, admin).
 */
export function NavCheckIn() {
  const portalData = useQuery(api.employee.getDashboardData, {
    localDate: new Date().toLocaleDateString("en-CA"),
  });

  const checkInMutation = useMutation(api.employee.checkIn);
  const checkOutMutation = useMutation(api.employee.checkOut);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [workType, setWorkType] = useState<"WFO" | "WFH">("WFO");
  const [breachData, setBreachData] = useState<GeofenceBreach | null>(null);

  // Live Timer for today's working hours
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const todayAttendance = portalData?.todayAttendance;
  const checkedIn = !!todayAttendance?.checkIn;
  const checkedOut = !!todayAttendance?.checkOut;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (todayAttendance?.checkIn && !todayAttendance.checkOut) {
      const [checkInH, checkInM] = todayAttendance.checkIn.split(":").map(Number);
      const calculateSeconds = () => {
        const checkInTime = new Date();
        checkInTime.setHours(checkInH, checkInM, 0, 0);
        const diffMs = Math.max(0, Date.now() - checkInTime.getTime());
        setElapsedSeconds(Math.floor(diffMs / 1000));
      };
      calculateSeconds();
      interval = setInterval(calculateSeconds, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [todayAttendance]);

  // Return null while data is loading to avoid flash
  if (portalData === undefined) return null;

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getLocalNow = () => {
    const now = new Date();
    return {
      localTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      localDate: now.toLocaleDateString("en-CA"),
    };
  };

  // Helper to fetch live GPS coordinates from the browser
  const getCoordinates = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let msg = "Failed to retrieve location. Please check browser permissions.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Location permission denied. Please allow location access in your browser settings to verify geofencing.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "Location information is unavailable.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Retrieving location coordinates timed out.";
          }
          reject(new Error(msg));
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  };

  const handleCheckIn = async (selectedWorkType: "WFO" | "WFH") => {
    setLoading(true);
    setMessage(null);
    setBreachData(null);
    const { localTime, localDate } = getLocalNow();
    try {
      let lat = 0;
      let lng = 0;
      if (selectedWorkType === "WFO") {
        try {
          const coords = await getCoordinates();
          lat = coords.latitude;
          lng = coords.longitude;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setMessage({ type: "error", text: errMsg || "Failed to fetch GPS coordinates." });
          setLoading(false);
          return;
        }
      }

      const res = await checkInMutation({
        lat,
        lng,
        localTime,
        localDate,
        workType: selectedWorkType,
      });
      setMessage({ type: "success", text: res.message });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      // Check if it's a structured geofence breach error
      try {
        const errorDetails = JSON.parse(errMsg);
        if (errorDetails.error === "GEOFENCE_BREACH") {
          setBreachData(errorDetails);
          return;
        }
      } catch {}
      setMessage({ type: "error", text: errMsg || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setMessage(null);
    setBreachData(null);
    const { localTime } = getLocalNow();
    const isCurrentlyWFH = todayAttendance?.location === "Work from Home";
    try {
      let lat = undefined;
      let lng = undefined;
      if (!isCurrentlyWFH) {
        try {
          const coords = await getCoordinates();
          lat = coords.latitude;
          lng = coords.longitude;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          setMessage({ type: "error", text: errMsg || "Failed to fetch GPS coordinates." });
          setLoading(false);
          return;
        }
      }

      const res = await checkOutMutation({
        localTime,
        lat,
        lng,
      });
      setMessage({ type: "success", text: res.message });
      setPopoverOpen(false);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      // Check if it's a structured geofence breach error
      try {
        const errorDetails = JSON.parse(errMsg);
        if (errorDetails.error === "GEOFENCE_BREACH") {
          setBreachData(errorDetails);
          return;
        }
      } catch {}
      setMessage({ type: "error", text: errMsg || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Pill label and color based on state
  const pillLabel = checkedOut
    ? `Out ${todayAttendance!.checkOut}`
    : checkedIn
    ? `In ${formatTimer(elapsedSeconds)}`
    : "Check In";

  const pillCls = checkedOut
    ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
    : checkedIn
    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60"
    : "bg-indigo-600 hover:bg-indigo-700 text-white border-transparent cursor-pointer";

  return (
    <div className="relative flex items-center gap-2">
      {/* Work Location Dropdown — only shown when not checked in/out */}
      {!checkedIn && !checkedOut && (
        <select
          value={workType}
          onChange={(e) => setWorkType(e.target.value as "WFO" | "WFH")}
          className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-[11px] font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs animate-fade-in"
        >
          <option value="WFO">🏢 Work From Office</option>
          <option value="WFH">🏠 Work From Home</option>
        </select>
      )}

      {/* Trigger pill */}
      <button
        onClick={() => {
          if (checkedOut) return; // no action once fully done
          if (!checkedIn) {
            // Check-in with the selected work type
            handleCheckIn(workType);
          } else {
            setPopoverOpen((p) => !p);
          }
        }}
        disabled={loading || checkedOut}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-xl border text-[11px] font-semibold transition-all duration-150 ${pillCls} disabled:opacity-70`}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : checkedOut ? (
          <CheckCircle className="h-3.5 w-3.5" />
        ) : checkedIn ? (
          <Clock className="h-3.5 w-3.5" />
        ) : (
          <MapPin className="h-3.5 w-3.5" />
        )}
        <span className="hidden sm:inline">{pillLabel}</span>
      </button>

      {/* Popover — shown when already checked in, offers checkout */}
      <AnimatePresence>
        {popoverOpen && (
          <>
            {/* Backdrop to close */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => {
                setPopoverOpen(false);
                setMessage(null);
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">Attendance</span>
                <button
                  onClick={() => {
                    setPopoverOpen(false);
                    setMessage(null);
                  }}
                  className="h-6 w-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Status row */}
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-center">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">Checked In</p>
                <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{todayAttendance?.checkIn}</p>
                <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  Active: {formatTimer(elapsedSeconds)}
                </p>
                <p className="text-[9px] text-emerald-500 mt-0.5">{new Date().toLocaleDateString("en-CA")}</p>
              </div>

              {/* Feedback message */}
              {message && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                    message.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400"
                      : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              {/* Check Out button */}
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Clock className="h-3.5 w-3.5" />}
                Check Out Shift
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast message for direct check-in (no popover) */}
      <AnimatePresence>
        {message && !popoverOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 top-full mt-2 w-64 p-3 rounded-xl border text-xs font-medium flex items-start gap-2 shadow-lg z-50 ${
              message.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-slate-900 dark:border-emerald-900 dark:text-emerald-400"
                : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-slate-900 dark:border-rose-900 dark:text-rose-400"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            )}
            <span className="flex-1">{message.text}</span>
            <button onClick={() => setMessage(null)} className="shrink-0 text-current opacity-50 hover:opacity-100">
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Geofence Breach Warning Popup Modal */}
      <AnimatePresence>
        {breachData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with backdrop blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setBreachData(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-150 dark:border-slate-800 shadow-2xl overflow-hidden p-6 text-center space-y-5"
            >
              {/* Pulsing Alert Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-25 scale-150" />
                  <div className="relative h-12 w-12 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center border border-rose-100 dark:border-rose-900/50">
                    <MapPin className="h-6 w-6 stroke-[2]" />
                  </div>
                </div>
              </div>

              {/* Title and Desc */}
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100">Outside Authorized Geofence</h3>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
                  Location verification failed. You must be physically inside the permitted office area to check in or check out.
                </p>
              </div>

              {/* Metrics block */}
              <div className="bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-150 dark:border-slate-850 text-left space-y-3.5">
                <div>
                  <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Office</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{breachData.officeName}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">{breachData.address}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-150 dark:border-slate-800">
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Your Distance</span>
                    <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400 font-mono">
                      {breachData.distance >= 1000
                        ? `${(breachData.distance / 1000).toFixed(2)} km`
                        : `${breachData.distance} meters`}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Allowed Radius</span>
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-450 font-mono">
                      {breachData.radius} meters
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-2xl flex items-start gap-2.5 text-left">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-450 leading-relaxed font-medium">
                  <strong>Instruction:</strong> Please move closer to the office location (GPS: <span className="font-mono">{breachData.lat.toFixed(5)}, {breachData.lng.toFixed(5)}</span>) and retry verification.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button
                  onClick={() => setBreachData(null)}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setBreachData(null);
                    if (checkedIn) {
                      handleCheckOut();
                    } else {
                      handleCheckIn(workType);
                    }
                  }}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Retry Verification
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

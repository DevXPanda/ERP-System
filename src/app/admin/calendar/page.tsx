"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  ChevronLeft,
  ChevronRight,
  Gift,
  Sun,
  Umbrella,
} from "lucide-react";
import { motion } from "framer-motion";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  type: "holiday" | "leave" | "birthday";
  color: string;
}

export default function CalendarPage() {
  const events = useQuery(api.hr.getCalendarEvents);

  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Get calendar details
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays = [];
  
  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarDays.push({
      day: prevMonthDays - i,
      isCurrentMonth: false,
      dateString: `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, "0")}-${String(prevMonthDays - i).padStart(2, "0")}`,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
    });
  }

  // Next month padding to fill grid to 42 cells (6 rows * 7 columns)
  const remainingCells = 42 - calendarDays.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarDays.push({
      day: i,
      isCurrentMonth: false,
      dateString: `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, "0")}-${String(i).padStart(2, "0")}`,
    });
  }

  const getEventsForDate = (dateStr: string) => {
    return (events || []).filter((e: CalendarEvent) => {
      if (!e.end) {
        return e.start === dateStr;
      }
      // Check date range
      const start = new Date(e.start).getTime();
      const end = new Date(e.end).getTime();
      const current = new Date(dateStr).getTime();
      return current >= start && current <= end;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">HR Calendar</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Month view tracking employee leaves, upcoming birthdays, and holidays.</p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-1.5 shadow-xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 px-2 select-none min-w-[120px] text-center">
            {monthNames[month]} {year}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 hover:bg-slate-55 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-3 shadow-xs text-[10px] font-semibold text-slate-500 dark:text-slate-400 select-none">
        <span className="flex items-center gap-1.5"><Sun className="h-3.5 w-3.5 text-rose-500" /> Holidays</span>
        <span className="flex items-center gap-1.5"><Umbrella className="h-3.5 w-3.5 text-amber-500" /> Leaves</span>
        <span className="flex items-center gap-1.5"><Gift className="h-3.5 w-3.5 text-blue-500" /> Birthdays</span>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        
        {/* Days of Week */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 uppercase tracking-widest pb-3 border-b border-slate-100 dark:border-slate-850">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Month grid days */}
        <div className="grid grid-cols-7 gap-2.5 mt-3">
          {calendarDays.map((cell, idx) => {
            const dateEvents = getEventsForDate(cell.dateString);
            const isToday = cell.dateString === new Date().toISOString().split("T")[0];

            return (
              <div
                key={idx}
                className={`min-h-[90px] border border-slate-100 dark:border-slate-800/80 rounded-xl p-2 flex flex-col justify-between transition-colors ${
                  cell.isCurrentMonth
                    ? "bg-slate-50/50 dark:bg-slate-950/20"
                    : "bg-slate-50/10 dark:bg-slate-950/5 opacity-40"
                } ${isToday ? "ring-2 ring-indigo-500 border-transparent bg-indigo-50/10" : ""}`}
              >
                <div className="flex justify-between items-center">
                  <span className={`text-xs font-semibold ${
                    isToday ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
                  }`}>
                    {cell.day}
                  </span>
                  {isToday && (
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                  )}
                </div>

                <div className="space-y-1.5 mt-2 overflow-y-auto max-h-12 scrollbar-none">
                  {dateEvents.map((e) => (
                    <div
                      key={e.id}
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md truncate ${
                        e.type === "holiday" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-455"
                        : e.type === "leave" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-455"
                        : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-455"
                      }`}
                      title={e.title}
                    >
                      {e.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

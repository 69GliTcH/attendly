"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { getAllAttendance } from "@/lib/attendance";
import { motion, AnimatePresence } from "framer-motion";

export default function CalendarPage() {
  const { user } = useUserStore();
  const router = useRouter();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [direction, setDirection] = useState(0); // 🔥 NEW
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState({
    wfo: 0,
    wfh: 0,
    leave: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const data = await getAllAttendance(user.uid);

      const map: Record<string, string> = {};
      let wfo = 0;
      let wfh = 0;
      let leave = 0;
      let total = 0;

      data.forEach((item: any) => {
        map[item.date] = item.status;

        const d = new Date(item.date);
        if (
          d.getMonth() === currentDate.getMonth() &&
          d.getFullYear() === currentDate.getFullYear()
        ) {
          total++;

          if (item.status === "WFO") wfo++;
          if (item.status === "WFH") wfh++;
          if (item.status === "LEAVE") leave++;
        }
      });

      setAttendanceMap(map);
      setSummary({ wfo, wfh, leave, total });
    };

    fetchData();
  }, [user, currentDate]);

  const isWeekend = (day: number) => {
    const d = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    ).getDay();
    return d === 0 || d === 6;
  };

  const isToday = (day: number) => {
    const now = new Date();
    return (
      day === now.getDate() &&
      currentDate.getMonth() === now.getMonth() &&
      currentDate.getFullYear() === now.getFullYear()
    );
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);

    return days;
  };

  const formatDate = (day: number) => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const colorMap: any = {
    WFO: "bg-green-500 text-white",
    WFH: "bg-indigo-500 text-white",
    LEAVE: "bg-purple-500 text-white",
    HOLIDAY: "bg-gray-500 text-white",
  };

  const changeMonth = (dir: number) => {
    setDirection(dir); // 🔥 track direction
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + dir);
    setCurrentDate(newDate);
  };

  const days = getDaysInMonth(currentDate);

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
  });

  const workingDays = summary.wfo + summary.wfh;

  const percent = workingDays
    ? Math.round((summary.wfo / workingDays) * 100)
    : 0;

  const getInsight = () => {
    if (percent > 70) return "Strong office presence 💼";
    if (percent > 40) return "Balanced work style ⚖️";
    return "Mostly remote 🏠";
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-neutral-950 via-black to-neutral-900 px-4 pt-6 pb-24">

      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <button onClick={() => changeMonth(-1)}>◀</button>
        <h2 className="text-white font-semibold">
          {monthName} {currentDate.getFullYear()}
        </h2>
        <button onClick={() => changeMonth(1)}>▶</button>
      </div>

      {/* Calendar */}
      <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 mb-4 overflow-hidden">

        <div className="grid grid-cols-7 text-xs text-gray-500 mb-3">
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
            <p key={d}>{d}</p>
          ))}
        </div>

        {/* 🔥 Animated Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentDate.toISOString()}
            initial={{ x: direction > 0 ? 50 : -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -50 : 50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-7 gap-2"
          >
            {days.map((day, idx) => {
              if (!day) return <div key={idx}></div>;

              const dateStr = formatDate(day);
              const status = attendanceMap[dateStr];
              const weekend = isWeekend(day);
              const today = isToday(day);

              return (
                <motion.div
                  key={idx}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.01 }}
                  whileTap={!weekend ? { scale: 0.9 } : {}}
                  onClick={() => !weekend && router.push(`/calendar/${dateStr}`)}
                  className={`h-12 flex items-center justify-center rounded-xl text-sm
                    ${
                      weekend
                        ? "bg-white/5 text-gray-600"
                        : status
                        ? colorMap[status]
                        : "bg-white/5 border border-white/10 text-gray-300"
                    }
                    ${today ? "ring-2 ring-white/40" : ""}
                  `}
                >
                  {day}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

      </div>

      {/* Summary */}
      <div className="flex-1 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 flex flex-col justify-between">

        <div className="grid grid-cols-4 text-center mb-4">
          <Stat label="WFO" value={summary.wfo} />
          <Stat label="Leave" value={summary.leave} />
          <Stat label="WFH" value={summary.wfh} />
          <Stat label="Total" value={summary.total} />
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Office Ratio</span>
            <span>{percent}%</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="text-center text-sm text-gray-300 mt-4">
          {getInsight()}
        </div>

      </div>
    </div>
  );
}

/* Stat */
function Stat({ label, value }: any) {
  return (
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="text-white text-lg font-semibold">{value}</p>
    </div>
  );
}
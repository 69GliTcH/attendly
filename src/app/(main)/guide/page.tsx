"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { getAllAttendance } from "@/lib/attendance";
import { getQuarterRange, getWorkingDays } from "@/lib/utils";
import { motion } from "framer-motion";

export default function GuidePage() {
  const { user } = useUserStore();

  const [loading, setLoading] = useState(true);

  const [requiredWFO, setRequiredWFO] = useState(0);
  const [doneWFO, setDoneWFO] = useState(0);
  const [leftWFO, setLeftWFO] = useState(0);

  const [remainingDays, setRemainingDays] = useState(0);
  const [safeWFH, setSafeWFH] = useState(0);

  const [message, setMessage] = useState("");
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => {
    const calculate = async () => {
      if (!user) return;

      const { start, end } = getQuarterRange(new Date());
      const all = await getAllAttendance(user.uid);

      let wfo = 0;
      let leave = 0;
      let holiday = 0;

      all.forEach((r: any) => {
        const d = new Date(r.date);

        if (d >= start && d <= end) {
          if (r.status === "WFO") wfo++;
          if (r.status === "LEAVE") leave++;
          if (r.status === "HOLIDAY") holiday++;
        }
      });

      // 🔥 THIS WEEK (Mon → Sun)
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const monday = new Date(today);
      monday.setDate(today.getDate() + diff);

      const week: any[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);

        const key = d.toISOString().split("T")[0];

        const record = all.find((r: any) => r.date === key);

        week.push({
          day: d.toLocaleDateString("en-US", { weekday: "short" }),
          date: d.getDate(),
          status: record?.status || null,
        });
      }

      setWeeklyData(week);

      const workingDays = getWorkingDays(start, end);
      const effectiveDays = workingDays.length - leave - holiday;

      const criteria = user.attendanceCriteria || 60;
      const required = Math.ceil((criteria / 100) * effectiveDays);

      const remainingWorkingDays = getWorkingDays(today, end).length;

      const left = Math.max(required - wfo, 0);
      const safeWFHLeft = Math.max(remainingWorkingDays - left, 0);

      let msg = "";

      if (left === 0) {
        msg = "You're safe. Maintain flexibility.";
      } else if (left > remainingWorkingDays) {
        msg = "Target not achievable. High risk.";
      } else if (left === remainingWorkingDays) {
        msg = "You must go WFO every remaining day.";
      } else if (left > remainingWorkingDays / 2) {
        msg = "Prefer office most days.";
      } else {
        msg = "You're on track.";
      }

      setRequiredWFO(required);
      setDoneWFO(wfo);
      setLeftWFO(left);
      setRemainingDays(remainingWorkingDays);
      setSafeWFH(safeWFHLeft);
      setMessage(msg);

      setLoading(false);
    };

    calculate();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400">
        Loading...
      </div>
    );
  }

  const progress = requiredWFO
    ? Math.round((doneWFO / requiredWFO) * 100)
    : 0;

  const colorMap: any = {
    WFO: "bg-green-500",
    WFH: "bg-indigo-500",
    LEAVE: "bg-purple-500",
    HOLIDAY: "bg-gray-500",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-black to-neutral-900 px-4 pb-24">

      <motion.div className="w-full max-w-md space-y-6 text-center">

        {/* Greeting */}
        <div>
          <h1 className="text-white text-xl font-semibold">
            Hi, {user?.username} 👋
          </h1>
          <p className="text-gray-400 text-sm">
            Target: {user?.attendanceCriteria}%
          </p>
        </div>

        {/* Progress */}
        <div>
          <p className="text-white text-2xl font-semibold">{progress}%</p>
          <p className="text-gray-400 text-sm">
            {doneWFO} / {requiredWFO} completed
          </p>

          <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Core Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="Required" value={requiredWFO} />
          <Stat label="Done" value={doneWFO} />
          <Stat label="Left" value={leftWFO} />
        </div>

        {/* Clear Analytics */}
        <div className="grid grid-cols-2 gap-3">
          <Stat label="WFH you can still take" value={safeWFH} />
          <Stat label="Working days remaining" value={remainingDays} />
        </div>

        {/* 🔥 THIS WEEK CHART */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-3">
            This week
          </p>

          <div className="grid grid-cols-7 gap-2">
            {weeklyData.map((d, i) => (
              <div key={i} className="text-center">

                <div
                  className={`h-9 rounded-lg ${
                    d.status ? colorMap[d.status] : "bg-white/5"
                  }`}
                />

                <p className="text-[10px] text-gray-400 mt-1">
                  {d.day}
                </p>

                <p className="text-[10px] text-gray-500">
                  {d.date}
                </p>

              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        <div className="text-gray-400 text-sm">
          {message}
        </div>

      </motion.div>
    </div>
  );
}

/* Stat */
function Stat({ label, value }: any) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
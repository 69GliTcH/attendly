
"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import { getAllAttendance } from "@/lib/attendance";
import { getQuarterRange, getWorkingDays } from "@/lib/utils";
import { motion } from "framer-motion";

type AttendanceStatus = "WFO" | "WFH" | "LEAVE" | "HOLIDAY";

type AttendanceRecord = {
  date: string;
  status: AttendanceStatus;
};

export default function GuidePage() {
  const { user } = useUserStore();

  const [loading, setLoading] = useState(true);

  const [requiredWFO, setRequiredWFO] = useState(0);
  const [doneWFO, setDoneWFO] = useState(0);
  const [leftWFO, setLeftWFO] = useState(0);

  const [remainingDays, setRemainingDays] = useState(0);
  const [safeWFH, setSafeWFH] = useState(0);
  const [takenWFH, setTakenWFH] = useState(0);

  const [message, setMessage] = useState("");
  const [weeklyData, setWeeklyData] = useState<
    { day: string; date: number; status: AttendanceStatus | null }[]
  >([]);

  useEffect(() => {
    let cancelled = false;

    const calculate = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const { start, end } = getQuarterRange(new Date());
        const all = (await getAllAttendance(
          user.uid
        )) as AttendanceRecord[];

        // Use local dates to avoid UTC date shifts.
        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");

          return `${year}-${month}-${day}`;
        };

        const startDate = formatLocalDate(start);
        const endDate = formatLocalDate(end);
        const today = new Date();
        const todayKey = formatLocalDate(today);

        // Only count attendance records within the current quarter.
        const quarterRecords = all.filter(
          (record) =>
            record.date >= startDate && record.date <= endDate
        );

        let wfo = 0;
        let wfh = 0;
        let leave = 0;
        let holiday = 0;

        quarterRecords.forEach((record) => {
          switch (record.status) {
            case "WFO":
              wfo++;
              break;
            case "WFH":
              wfh++;
              break;
            case "LEAVE":
              leave++;
              break;
            case "HOLIDAY":
              holiday++;
              break;
          }
        });

        // This week's attendance, Monday through Sunday.
        const monday = new Date(today);
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

        monday.setDate(today.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        const week = [];

        for (let i = 0; i < 7; i++) {
          const date = new Date(monday);
          date.setDate(monday.getDate() + i);

          const key = formatLocalDate(date);
          const record = all.find((r) => r.date === key);

          week.push({
            day: date.toLocaleDateString("en-US", {
              weekday: "short",
            }),
            date: date.getDate(),
            status: record?.status ?? null,
          });
        }

        // Calculate quarter attendance target.
        const workingDays = getWorkingDays(start, end).length;

        // Leave and holidays do not count toward the attendance denominator.
        const effectiveDays = Math.max(
          workingDays - leave - holiday,
          0
        );

        const criteria = user.attendanceCriteria ?? 60;
        const required = Math.ceil(
          (criteria / 100) * effectiveDays
        );

        // Total WFH allowance for the quarter.
        const totalWFHAllowance = Math.max(
          effectiveDays - required,
          0
        );

        // Remaining working days: exclude today if attendance
        // for today is already recorded.
        const todayRecorded = all.some(
          (record) => record.date === todayKey
        );

        const remainingStart = new Date(today);
        remainingStart.setHours(0, 0, 0, 0);

        if (todayRecorded) {
          remainingStart.setDate(remainingStart.getDate() + 1);
        }

        const remainingWorkingDays =
          remainingStart > end
            ? 0
            : getWorkingDays(remainingStart, end).length;

        // WFO days still needed to reach the target.
        const left = Math.max(required - wfo, 0);

        // Remaining WFH allowance after already-used WFH days.
        const remainingAllowance = Math.max(
          totalWFHAllowance - wfh,
          0
        );

        // Remaining days available for WFH without compromising
        // the WFO target.
        const futureWFHCapacity = Math.max(
          remainingWorkingDays - left,
          0
        );

        const actualWFHLeft = Math.min(
          remainingAllowance,
          futureWFHCapacity
        );

        // Status message.
        let msg = "";

        if (left === 0) {
          msg = "You're safe. Maintain flexibility.";
        } else if (left > remainingWorkingDays) {
          msg = "Target not achievable. High risk.";
        } else if (left === remainingWorkingDays) {
          msg = "You must go WFO every remaining working day.";
        } else if (left > remainingWorkingDays / 2) {
          msg = "Prefer office most days.";
        } else {
          msg = "You're on track.";
        }

        if (cancelled) return;

        setWeeklyData(week);

        setRequiredWFO(required);
        setDoneWFO(wfo);
        setLeftWFO(left);

        setRemainingDays(remainingWorkingDays);
        setSafeWFH(totalWFHAllowance);
        setTakenWFH(wfh);

        setMessage(msg);
      } catch (error) {
        console.error("Failed to calculate attendance:", error);

        if (!cancelled) {
          setMessage("Unable to load attendance. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    calculate();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-gray-400">
        Loading...
      </div>
    );
  }

  const progress = requiredWFO
    ? Math.min(Math.round((doneWFO / requiredWFO) * 100), 100)
    : 100;

  const wfhLeft = Math.min(
    Math.max(safeWFH - takenWFH, 0),
    Math.max(remainingDays - leftWFO, 0)
  );

  const colorMap: Record<AttendanceStatus, string> = {
    WFO: "bg-green-500",
    WFH: "bg-indigo-500",
    LEAVE: "bg-purple-500",
    HOLIDAY: "bg-gray-500",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-black to-neutral-900 px-4 pb-24">
      <motion.div
        className="w-full max-w-md space-y-6 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Greeting */}
        <div>
          <h1 className="text-white text-xl font-semibold">
            Hi, {user?.username} 👋
          </h1>
          <p className="text-gray-400 text-sm">
            Target: {user?.attendanceCriteria ?? 60}%
          </p>
        </div>

        {/* Progress */}
        <div>
          <p className="text-white text-2xl font-semibold">
            {progress}%
          </p>
          <p className="text-gray-400 text-sm">
            {doneWFO} / {requiredWFO} completed
          </p>

          <div className="w-full h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* WFO */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="WFO Required" value={requiredWFO} />
          <Stat label="WFO Done" value={doneWFO} />
          <Stat label="WFO Remaining" value={leftWFO} />
        </div>

        {/* WFH */}
        <div className="grid grid-cols-3 gap-3">
          <Stat label="WFH Available" value={safeWFH} />
          <Stat label="WFH Taken" value={takenWFH} />
          <Stat label="WFH Left" value={wfhLeft} />
        </div>

        {/* This Week */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-3">This week</p>

          <div className="grid grid-cols-7 gap-2">
            {weeklyData.map((day, index) => (
              <div key={index} className="text-center">
                <div
                  title={day.status ?? "Not recorded"}
                  className={`h-9 rounded-lg ${
                    day.status
                      ? colorMap[day.status]
                      : "bg-white/5"
                  }`}
                />

                <p className="text-[10px] text-gray-400 mt-1">
                  {day.day}
                </p>

                <p className="text-[10px] text-gray-500">
                  {day.date}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        <div className="text-gray-400 text-sm">{message}</div>
      </motion.div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

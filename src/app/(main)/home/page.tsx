
"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import {
  setAttendance,
  getAttendance,
  getAllAttendance,
  Status,
} from "@/lib/attendance";
import {
  formatDate,
  displayDate,
  getQuarterRange,
  getWorkingDays,
} from "@/lib/utils";
import { motion } from "framer-motion";

export default function HomePage() {
  const { user } = useUserStore();

  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  const [wfo, setWfo] = useState(0);
  const [wfh, setWfh] = useState(0);
  const [percent, setPercent] = useState(0);

  const [prediction, setPrediction] = useState("");
  const [risk, setRisk] = useState("");

  const today = new Date();
  const todayStr = formatDate(today);
  const { day, weekday } = displayDate(today);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const data = await getAttendance(user.uid, todayStr);

        if (cancelled) return;

        setStatus(data?.status ?? null);
        await calculateStats();
      } catch (error) {
        console.error("Failed to load attendance:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [user, todayStr]);

  const calculateStats = async () => {
    if (!user) return;

    const { start, end } = getQuarterRange(new Date());
    const all = await getAllAttendance(user.uid);

    const attendanceMap: Record<string, Status> = {};

    all.forEach((record: any) => {
      attendanceMap[record.date] = record.status;
    });

    const startStr = formatDate(start);
    const endStr = formatDate(end);
    const todayKey = formatDate(new Date());

    // Attendance recorded so far in the current quarter.
    const filtered = all.filter(
      (record: any) =>
        record.date >= startStr && record.date <= todayKey
    );

    const wfoCount = filtered.filter(
      (record: any) => record.status === "WFO"
    ).length;

    const wfhCount = filtered.filter(
      (record: any) => record.status === "WFH"
    ).length;

    const workedDays = wfoCount + wfhCount;

    const ratio = workedDays
      ? Math.round((wfoCount / workedDays) * 100)
      : 0;

    setWfo(wfoCount);
    setWfh(wfhCount);
    setPercent(ratio);

    // All working days in the quarter.
    const quarterDays = getWorkingDays(start, end);

    // Exclude recorded leaves and holidays from the target denominator.
    const eligibleDays = quarterDays.filter((date: Date) => {
      const key = formatDate(date);
      const dayStatus = attendanceMap[key];

      return dayStatus !== "LEAVE" && dayStatus !== "HOLIDAY";
    });

    const criteria = user.attendanceCriteria ?? 60;

    const requiredWFO = Math.ceil(
      (criteria / 100) * eligibleDays.length
    );

    // Count only future, eligible, unmarked working days.
    const remainingDays = eligibleDays.filter((date: Date) => {
      const key = formatDate(date);

      return key > todayKey && !attendanceMap[key];
    }).length;

    const needed = Math.max(0, requiredWFO - wfoCount);

    if (needed === 0) {
      setPrediction("You're safe. No extra WFO needed.");
      setRisk("safe");
    } else if (needed > remainingDays) {
      setPrediction(
        `Target not achievable with the remaining ${remainingDays} unmarked working days.`
      );
      setRisk("danger");
    } else if (needed === remainingDays) {
      setPrediction("You must go WFO every remaining working day.");
      setRisk("warning");
    } else if (needed > remainingDays / 2) {
      setPrediction(
        `Need ${needed} more WFO days this quarter. Prioritize office.`
      );
      setRisk("warning");
    } else {
      setPrediction(
        `Need ${needed} more WFO days this quarter. You're on track.`
      );
      setRisk("safe");
    }
  };

  const handleClick = async (newStatus: Status) => {
    if (!user) return;

    try {
      await setAttendance(user.uid, todayStr, newStatus);
      setStatus(newStatus);
      await calculateStats();
    } catch (error) {
      console.error("Failed to update attendance:", error);
    }
  };

  const getMessage = () => {
    if (!status) return "No status set for today";
    if (status === "WFO") return "Working from office today";
    if (status === "WFH") return "Working from home today";
    if (status === "LEAVE") return "On leave today";
    if (status === "HOLIDAY") return "Holiday";
    return "";
  };

  const getRiskStyle = () => {
    if (risk === "safe") {
      return "bg-green-500/10 text-green-400 border-green-500/30";
    }

    if (risk === "danger") {
      return "bg-red-500/10 text-red-400 border-red-500/30";
    }

    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-black to-neutral-900 px-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 text-center"
      >
        {/* Greeting */}
        <div>
          <h1 className="text-white text-xl font-semibold">
            Hi, {user?.username || "User"} 👋
          </h1>

          <p className="text-gray-400 text-sm">
            Your attendance target is{" "}
            <span className="text-white font-medium">
              {user?.attendanceCriteria ?? 60}%
            </span>
          </p>
        </div>

        {/* Date */}
        <div>
          <p className="text-gray-500 text-sm">Today</p>
          <h1 className="text-4xl text-white">{day}</h1>
          <p className="text-gray-400">{weekday}</p>
        </div>

        {/* Progress */}
        <ProgressRing percent={percent} />

        {/* Stats */}
        <div>
          <p className="text-white text-lg font-semibold">{percent}%</p>
          <p className="text-gray-400 text-sm">
            {wfo} / {wfo + wfh} office days
          </p>
        </div>

        {/* Prediction */}
        <div className={`p-4 rounded-xl border text-sm ${getRiskStyle()}`}>
          {prediction}
        </div>

        {/* Status */}
        <p className="text-gray-400">{getMessage()}</p>

        {/* Buttons */}
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-4">
          <div className="grid grid-cols-2 gap-3">
            <StatusButton
              label="WFO"
              active={status === "WFO"}
              color="green"
              onClick={() => handleClick("WFO")}
            />

            <StatusButton
              label="WFH"
              active={status === "WFH"}
              color="indigo"
              onClick={() => handleClick("WFH")}
            />

            <StatusButton
              label="Leave"
              active={status === "LEAVE"}
              color="purple"
              onClick={() => handleClick("LEAVE")}
            />

            <StatusButton
              label="Holiday"
              active={status === "HOLIDAY"}
              color="gray"
              onClick={() => handleClick("HOLIDAY")}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* Progress Ring */

type ProgressRingProps = {
  percent: number;
};

function ProgressRing({ percent }: ProgressRingProps) {
  const radius = 45;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const safePercent = Math.max(0, Math.min(100, percent));
  const offset = circumference - (safePercent / 100) * circumference;

  return (
    <div className="flex justify-center relative">
      <svg height={radius * 2} width={radius * 2}>
        <circle
          stroke="rgba(255,255,255,0.08)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />

        <circle
          stroke="white"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>

      <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">
        {safePercent}%
      </div>
    </div>
  );
}

/* Status Button */

type StatusButtonProps = {
  label: string;
  active: boolean;
  color: "green" | "indigo" | "purple" | "gray";
  onClick: () => void;
};

function StatusButton({
  label,
  active,
  color,
  onClick,
}: StatusButtonProps) {
  const colorMap = {
    green: "bg-green-500 text-white",
    indigo: "bg-indigo-500 text-white",
    purple: "bg-purple-500 text-white",
    gray: "bg-gray-500 text-white",
  };

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`p-3 rounded-xl ${
        active
          ? colorMap[color]
          : "bg-white/5 border border-white/10 text-gray-300"
      }`}
    >
      {label}
    </motion.button>
  );
}

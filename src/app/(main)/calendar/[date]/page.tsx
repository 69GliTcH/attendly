"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useUserStore } from "@/store/userStore";
import {
  getAttendance,
  setAttendance,
  deleteAttendance,
  Status,
} from "@/lib/attendance";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function DayPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUserStore();

  const date = params.date as string;

  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !date) return;

      const data = await getAttendance(user.uid, date);
      if (data) setStatus(data.status);
    };

    fetchData();
  }, [user, date]);

  const handleUpdate = async (newStatus: Status) => {
    if (!user) return;

    await setAttendance(user.uid, date, newStatus);
    setStatus(newStatus);
  };

  /* 🔥 CLEAR WITH UNDO */
  const handleClear = async () => {
    if (!user || !status) return;

    const oldStatus = status;

    // optimistic update
    setStatus(null);

    await deleteAttendance(user.uid, date);

    toast("Selection removed", {
      description: `${oldStatus} removed`,
      action: {
        label: "Undo",
        onClick: async () => {
          if (!user) return;

          await setAttendance(user.uid, date, oldStatus);
          setStatus(oldStatus);
        },
      },
    });
  };

  const dateObj = new Date(date);

  const formattedDate = dateObj.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const isWeekend =
    dateObj.getDay() === 0 || dateObj.getDay() === 6;

  const getStatusText = () => {
    if (!status) return "No status selected yet";
    if (status === "WFO") return "You worked from office";
    if (status === "WFH") return "You worked from home";
    if (status === "LEAVE") return "You were on leave";
    if (status === "HOLIDAY") return "It was a holiday";
  };

  /* ✅ FIXED TYPES */
  const options: {
    label: string;
    value: Status;
    color: "green" | "indigo" | "purple" | "gray";
  }[] = [
    { label: "WFO", value: "WFO", color: "green" },
    { label: "WFH", value: "WFH", color: "indigo" },
    { label: "Leave", value: "LEAVE", color: "purple" },
    { label: "Holiday", value: "HOLIDAY", color: "gray" },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-black to-neutral-900 px-4">

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-2xl p-6 rounded-2xl border border-white/10 text-center space-y-6"
      >

        {/* 📅 Date */}
        <div>
          <p className="text-gray-500 text-sm">Selected Day</p>
          <h1 className="text-lg font-semibold text-white mt-1">
            {formattedDate}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {isWeekend ? "Weekend" : "Working Day"}
          </p>
        </div>

        {/* 🧠 Status */}
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-gray-300"
        >
          {getStatusText()}
        </motion.div>

        {/* 🎯 Options */}
        <div className="grid grid-cols-2 gap-3">
          {options.map((opt) => (
            <StatusOption
              key={opt.value}
              label={opt.label}
              active={status === opt.value}
              color={opt.color}
              onClick={() => handleUpdate(opt.value)}
            />
          ))}
        </div>

        {/* 🔥 Clear */}
        {status && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleClear}
            className="w-full p-3 rounded-xl text-sm font-medium bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition"
          >
            Clear Selection
          </motion.button>
        )}

        {/* 🔙 Back */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          ← Back to Calendar
        </motion.button>

      </motion.div>
    </div>
  );
}

/* 🔥 Status Option */
function StatusOption({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: "green" | "indigo" | "purple" | "gray";
  onClick: () => void;
}) {
  const colorMap = {
    green:
      "bg-green-500 text-white shadow-lg shadow-green-500/30 border-transparent",
    indigo:
      "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 border-transparent",
    purple:
      "bg-purple-500 text-white shadow-lg shadow-purple-500/30 border-transparent",
    gray:
      "bg-gray-500 text-white shadow-lg shadow-gray-500/30 border-transparent",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      className={`p-4 rounded-xl text-sm font-medium transition-all border ${
        active
          ? `${colorMap[color]} scale-[1.04]`
          : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
      }`}
    >
      {label}
    </motion.button>
  );
}
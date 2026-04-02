"use client";

import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Calendar, BarChart3, LogOut } from "lucide-react";
import { useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useUserStore } from "@/store/userStore";

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { setUser } = useUserStore();

  const [showLogout, setShowLogout] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    router.push("/login");
  };

  const tabs = [
    { icon: Home, path: "/home", type: "route" },
    { icon: Calendar, path: "/calendar", type: "route" },
    { icon: BarChart3, path: "/guide", type: "route" },
    { icon: LogOut, path: "logout", type: "action" }, // 🔥 NEW
  ];

  return (
    <>
      {/* 🔥 Bottom Nav */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">

        <div className="flex items-center gap-6 px-6 py-3 rounded-2xl 
          bg-white/10 backdrop-blur-2xl border border-white/10
          shadow-[0_10px_40px_rgba(0,0,0,0.5)]">

          {tabs.map((tab, i) => {
            const isActive =
              tab.type === "route" && pathname.startsWith(tab.path);

            const Icon = tab.icon;

            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (tab.type === "route") {
                    router.push(tab.path);
                  } else {
                    setShowLogout(true);
                  }
                }}
                className="relative flex items-center justify-center"
              >

                {/* Active Glow */}
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 -z-10 rounded-xl bg-white/10 blur-md"
                  />
                )}

                {/* Icon */}
                <motion.div
                  animate={{
                    y: isActive ? -2 : 0,
                    scale: isActive ? 1.1 : 1,
                  }}
                >
                  <Icon
                    size={22}
                    className={`transition ${
                      isActive
                        ? "text-white"
                        : tab.type === "action"
                        ? "text-red-400"
                        : "text-gray-400"
                    }`}
                  />
                </motion.div>

                {/* Dot */}
                {isActive && (
                  <motion.div
                    layoutId="active-dot"
                    className="absolute -bottom-2 w-1.5 h-1.5 bg-white rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 🔥 Logout Bottom Sheet */}
      <AnimatePresence>
        {showLogout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLogout(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center pb-24"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 text-center mb-4"
            >

              {/* Handle */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

              <h2 className="text-white text-lg font-semibold mb-2">
                Confirm Logout
              </h2>

              <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to log out?
              </p>

              <div className="flex gap-3">

                {/* Cancel */}
                <button
                  onClick={() => setShowLogout(false)}
                  className="flex-1 p-3 rounded-xl bg-white/5 border border-white/10 text-gray-300"
                >
                  Cancel
                </button>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex-1 p-3 rounded-xl bg-red-500 text-white font-medium"
                >
                  Logout
                </button>

              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
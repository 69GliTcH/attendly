"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { useUserStore } from "@/store/userStore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!username || !password) {
      return setError("Please fill all fields");
    }

    try {
      setLoading(true);

      const userCred = await login(username, password);
      const userDoc = await getDoc(doc(db, "users", userCred.uid));

      if (!userDoc.exists()) {
        throw new Error("User data not found");
      }

      const data = userDoc.data();

      setUser({
        uid: userCred.uid,
        username: data.username,
        attendanceCriteria: data.attendanceCriteria,
      });

      router.push("/home");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-black to-neutral-900 px-4 relative overflow-hidden">

      {/* 🔥 Background Glow */}
      <div className="absolute w-72 h-72 bg-indigo-500/20 blur-[120px] rounded-full top-10 left-1/2 -translate-x-1/2" />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl p-7 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(255,255,255,0.05)]"
      >

        {/* Title */}
        <div className="text-center mb-7">
          <h1 className="text-3xl font-semibold text-white tracking-tight">
            Attendly
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Track your attendance effortlessly
          </p>
        </div>

        {/* Username */}
        <FloatingInput
          label="Username"
          value={username}
          onChange={setUsername}
        />

        {/* Password */}
        <div className="relative mb-4">
          <FloatingInput
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
          />

          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {/* Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-indigo-600/90 text-white py-3 rounded-xl font-medium hover:bg-indigo-500 transition-all disabled:opacity-60 shadow-lg shadow-indigo-500/20 flex items-center justify-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Login"
          )}
        </motion.button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-white/10"></div>
          <span className="px-3 text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-white/10"></div>
        </div>

        {/* Signup */}
        <p
          onClick={() => router.push("/signup")}
          className="text-sm text-center text-gray-400 cursor-pointer hover:text-white transition"
        >
          Don’t have an account?{" "}
          <span className="text-indigo-400 font-medium">Sign up</span>
        </p>
      </motion.div>
    </div>
  );
}

/* 🔥 Floating Input Component */
function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}) {
  return (
    <div className="relative mb-4">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="peer w-full px-3 pt-5 pb-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/70 focus:bg-white/10"
        placeholder={label}
      />

      <label
        className="absolute left-3 top-2 text-xs text-gray-400 transition-all 
        peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm 
        peer-focus:top-2 peer-focus:text-xs"
      >
        {label}
      </label>
    </div>
  );
}
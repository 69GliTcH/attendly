"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signup, isUsernameTaken } from "@/lib/auth";
import { useUserStore } from "@/store/userStore";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [criteria, setCriteria] = useState(50);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);

  /* 🔍 Username check */
  useEffect(() => {
    if (!username) {
      setUsernameError("");
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingUsername(true);
      const taken = await isUsernameTaken(username);
      setUsernameError(taken ? "Username already taken" : "");
      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  /* 🔐 Password validation */
  const validatePassword = (pwd: string) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

    if (!regex.test(pwd)) {
      return "Weak password (use upper, lower, number, symbol)";
    }
    return "";
  };

  useEffect(() => {
    if (!password) return;
    setPasswordError(validatePassword(password));
  }, [password]);

  useEffect(() => {
    if (!confirmPassword) return;
    setConfirmError(
      password === confirmPassword ? "" : "Passwords do not match"
    );
  }, [confirmPassword, password]);

  const handleSignup = async () => {
    setGeneralError("");

    if (!username || !password || !confirmPassword) {
      return setGeneralError("Please fill all fields");
    }

    if (usernameError || passwordError || confirmError) return;

    try {
      setLoading(true);

      const user = await signup(username, password, criteria);

      setUser({
        uid: user.uid,
        username,
        attendanceCriteria: criteria,
      });

      router.push("/home");
    } catch {
      setGeneralError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-neutral-950 via-black to-neutral-900 px-4 relative overflow-hidden">

      <div className="absolute w-72 h-72 bg-indigo-500/20 blur-[120px] rounded-full top-10 left-1/2 -translate-x-1/2" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-md bg-white/10 backdrop-blur-2xl p-7 rounded-2xl border border-white/10"
      >

        <div className="text-center mb-7">
          <h1 className="text-2xl font-semibold text-white">
            Create Account
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Start tracking your attendance
          </p>
        </div>

        <FloatingInput label="Username" value={username} onChange={setUsername} />

        {checkingUsername && (
          <p className="text-xs text-gray-400 mb-2">Checking...</p>
        )}

        {usernameError && (
          <p className="text-red-400 text-xs mb-2">{usernameError}</p>
        )}

        {/* Password */}
        <div className="relative">
          <FloatingInput
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-gray-400"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {passwordError && (
          <p className="text-red-400 text-xs mb-2">{passwordError}</p>
        )}

        {/* Confirm */}
        <div className="relative">
          <FloatingInput
            label="Confirm Password"
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={setConfirmPassword}
          />
          <button
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-3 text-gray-400"
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {confirmError && (
          <p className="text-red-400 text-xs mb-2">{confirmError}</p>
        )}

        {/* Criteria */}
        <FloatingInput
          label="Attendance %"
          type="number"
          value={criteria.toString()}
          onChange={(val: string) => setCriteria(Number(val))}
        />

        {generalError && (
          <div className="mb-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {generalError}
          </div>
        )}

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSignup}
          disabled={loading}
          className="w-full bg-indigo-600/90 text-white py-3 rounded-xl font-medium flex justify-center items-center"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Create Account"
          )}
        </motion.button>

        <p
          onClick={() => router.push("/login")}
          className="text-sm text-center mt-5 text-gray-400 cursor-pointer"
        >
          Already have an account?{" "}
          <span className="text-indigo-400">Login</span>
        </p>
      </motion.div>
    </div>
  );
}

/* ✅ FIXED TYPES */
type FloatingInputProps = {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
};

function FloatingInput({
  label,
  value,
  onChange,
  type = "text",
}: FloatingInputProps) {
  return (
    <div className="relative mb-4">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={label}
        className="peer w-full px-3 pt-5 pb-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/70"
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
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { Button, Input, useToast } from "../components/ui";
import api from "../utils/api";

const roleOptions = [
  { value: "FARMER_GROUP", label: "Farmer Group Lead" },
  { value: "COLLECTIVE", label: "Zone Coordinator (Collective)" },
];

const Signup = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("FARMER_GROUP");
  const [loading, setLoading] = useState(false);

  const confirmError = confirm && confirm !== password ? "Passwords do not match" : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (confirmError) return;
    setLoading(true);
    try {
      await api.post("/auth/register", { username, email, password, role });
      toast.success("Your coordinator account is ready.", { title: "Account created" });
      navigate("/login");
    } catch (err) {
      toast.error(err.message || "Registration failed", { title: "Error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center px-5 sm:px-8 pt-28 pb-16 transition-colors duration-300 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`w-full max-w-md rounded-3xl border p-7 sm:p-9 ${
          isDark
            ? "bg-slate-900/70 border-slate-800 shadow-2xl shadow-black/40"
            : "bg-white border-slate-200 shadow-xl shadow-slate-300/40"
        }`}
      >
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className={`p-2.5 rounded-full ${isDark ? "bg-emerald-800 text-emerald-200" : "bg-emerald-100 text-emerald-700"}`}>
            <Icon icon="ph:user-plus-fill" className="w-7 h-7" />
          </div>
          <h1 className={`font-display text-2xl font-bold quantico uppercase tracking-widest ${isDark ? "text-white" : "text-slate-900"}`}>
            Become a Partner
          </h1>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Register your farmer group with the collective.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Username"
            placeholder="e.g. debendra_semwal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon="ph:user-fill"
            required
          />
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="ph:envelope-fill"
            required
          />

          <div className="space-y-1.5">
            <label className={`block text-sm font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors ${
                isDark
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              {roleOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon="ph:lock-key-fill"
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            icon="ph:lock-key-fill"
            error={confirmError}
            required
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <p className={`text-center text-sm mt-7 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          Already a coordinator?{" "}
          <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-semibold">
            Log in
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;

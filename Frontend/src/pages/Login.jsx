import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { Button, Input, useToast } from "../components/ui";
import api from "../utils/api";

const Login = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast.success("Welcome back to the collective.", { title: "Logged in" });
      navigate("/");
    } catch (err) {
      toast.error(err.message || "Login failed", { title: "Error" });
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
            <Icon icon="ph:plant-fill" className="w-7 h-7" />
          </div>
          <h1 className={`font-display text-2xl font-bold quantico uppercase tracking-widest ${isDark ? "text-white" : "text-slate-900"}`}>
            Coordinator Login
          </h1>
          <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            Sign in to manage harvest cycles and collection routes.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@mandakini-organic.org"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon="ph:envelope-fill"
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon="ph:lock-key-fill"
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className={`flex items-center gap-2 cursor-pointer select-none ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              <input type="checkbox" className="rounded accent-emerald-500" />
              Remember me
            </label>
            <Link to="/login" className="text-emerald-500 hover:text-emerald-400 font-medium">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full">
            Log In
          </Button>
        </form>

        <p className={`text-center text-sm mt-7 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
          New to the collective?{" "}
          <Link to="/signup" className="text-emerald-500 hover:text-emerald-400 font-semibold">
            Create an account
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;

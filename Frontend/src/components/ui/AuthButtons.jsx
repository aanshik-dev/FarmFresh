import React from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

export const LoginButton = ({ isDark, className = "", full = false }) => {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate("/login")}
      className={`
        inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-medium
        px-4 py-2 transition-all duration-200 cursor-pointer border
        ${full ? "w-full" : ""}
        ${
          isDark
            ? "border-emerald-700/60 text-emerald-100 hover:bg-emerald-900/40"
            : "border-emerald-300 text-emerald-800 hover:bg-emerald-50"
        }
        ${className}
      `}
    >
      <Icon icon="ph:sign-in-bold" className="w-4 h-4" />
      <span>Log In</span>
    </motion.button>
  );
};

export const SignupButton = ({ isDark, className = "", full = false }) => {
  const navigate = useNavigate();
  return (
    <motion.button
      whileHover={{
        scale: 1.03,
        boxShadow: "0 0 24px rgba(52, 211, 153, 0.35)",
      }}
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate("/register")}
      className={`
        inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-semibold
        px-4 py-2 transition-all duration-200 cursor-pointer shadow-lg
        ${full ? "w-full" : ""}
        bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500
        text-white shadow-emerald-500/20
      `}
    >
      <Icon icon="ph:user-plus-bold" className="w-4 h-4" />
      <span>Register</span>
    </motion.button>
  );
};

const AuthButtons = ({ isDark, layout = "row" }) => {
  const wrap =
    layout === "row"
      ? "flex items-center gap-2.5"
      : "flex flex-col gap-2.5 w-full";
  return (
    <div className={wrap}>
      <LoginButton isDark={isDark} full={layout !== "row"} />
      <SignupButton isDark={isDark} full={layout !== "row"} />
    </div>
  );
};

export default AuthButtons;

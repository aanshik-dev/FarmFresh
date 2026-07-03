import React from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useToast, Button } from "../../components/ui";

const AdminSettings = () => {
  const { isDark } = useTheme();
  const { toast } = useToast();
  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-2xl mx-auto">
        <h1 className={`text-2xl font-bold mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>Admin Settings</h1>
        <div className={`rounded-2xl border p-6 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
          <div className="flex flex-col items-center gap-3 text-center py-8">
            <Icon icon="ph:gear-six-fill" className="w-14 h-14 text-amber-400" />
            <h2 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Platform Settings</h2>
            <p className={`text-sm max-w-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Advanced admin settings including platform configuration, zone management, and notification templates — coming soon.</p>
            <Button variant="primary" icon="ph:bell-fill" onClick={() => toast.info("Settings module coming soon!")}>Notify Me When Ready</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useToast, Button, Input } from "../../components/ui";
import ConfirmModal from "../../components/common/ConfirmModal";

const Section = ({ title, icon, children, isDark }) => (
  <div className={`rounded-2xl border p-5 ${isDark ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200"}`}>
    <div className="flex items-center gap-2 mb-5">
      <Icon icon={icon} className={`w-5 h-5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`} />
      <h2 className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{title}</h2>
    </div>
    {children}
  </div>
);

const FarmerSettings = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notifs, setNotifs] = useState({ scheduleAlerts: true, membershipUpdates: true, announcements: true, statusRequests: true });

  const handleChangePass = async () => {
    if (!oldPass || !newPass || !confirmPass) { toast.error("Fill all password fields"); return; }
    if (newPass !== confirmPass) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    toast.success("Password changed successfully!");
    setOldPass(""); setNewPass(""); setConfirmPass("");
    setSaving(false);
  };

  const toggleNotif = (key) => setNotifs(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className={`min-h-screen p-5 sm:p-7 ${isDark ? "bg-slate-950" : "bg-slate-50"}`}>
      <div className="max-w-2xl mx-auto space-y-5">
        <div className="mb-2">
          <h1 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Settings</h1>
          <p className={`text-sm mt-0.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Manage your account and preferences</p>
        </div>

        {/* Account */}
        <Section title="Account Information" icon="ph:user-circle-fill" isDark={isDark}>
          <div className="space-y-3">
            {[
              { label: "Email", value: user?.email, icon: "ph:envelope-fill" },
              { label: "Phone", value: user?.phone || "Not set", icon: "ph:phone-fill" },
              { label: "Role", value: "Farmer Group", icon: "ph:plant-fill" },
              { label: "Group Name", value: user?.groupName, icon: "ph:users-three-fill" },
            ].map(item => (
              <div key={item.label} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                <Icon icon={item.icon} className={`w-4 h-4 ${isDark ? "text-slate-400" : "text-slate-500"}`} />
                <div className="flex-1">
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.label}</p>
                  <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Password */}
        <Section title="Change Password" icon="ph:lock-key-fill" isDark={isDark}>
          <div className="space-y-3">
            <Input label="Current Password" type="password" placeholder="••••••••" value={oldPass} onChange={e => setOldPass(e.target.value)} icon="ph:lock-fill" />
            <Input label="New Password" type="password" placeholder="At least 8 characters" value={newPass} onChange={e => setNewPass(e.target.value)} icon="ph:lock-key-fill" />
            <Input label="Confirm New Password" type="password" placeholder="Re-enter new password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} icon="ph:lock-key-fill" error={confirmPass && confirmPass !== newPass ? "Passwords don't match" : ""} />
            <Button variant="primary" onClick={handleChangePass} loading={saving} icon="ph:check-bold">Update Password</Button>
          </div>
        </Section>

        {/* Notifications */}
        <Section title="Notification Preferences" icon="ph:bell-fill" isDark={isDark}>
          <div className="space-y-3">
            {[
              { key: "scheduleAlerts",     label: "Pickup Schedule Alerts",       desc: "Get notified when a pickup is scheduled" },
              { key: "membershipUpdates",  label: "Membership Status Updates",    desc: "Approval, rejection of membership requests" },
              { key: "announcements",      label: "Collective Announcements",     desc: "Price updates and general notices" },
              { key: "statusRequests",     label: "Crop Status Requests",        desc: "When a collective requests crop updates" },
            ].map(item => (
              <div key={item.key} className={`flex items-center justify-between p-3 rounded-xl ${isDark ? "bg-slate-800/50" : "bg-slate-50"}`}>
                <div>
                  <p className={`text-sm font-medium ${isDark ? "text-slate-200" : "text-slate-800"}`}>{item.label}</p>
                  <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>{item.desc}</p>
                </div>
                <button
                  onClick={() => toggleNotif(item.key)}
                  className={`relative w-11 h-6 rounded-full transition-all cursor-pointer ${notifs[item.key] ? "bg-emerald-500" : isDark ? "bg-slate-700" : "bg-slate-300"}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${notifs[item.key] ? "translate-x-5" : ""}`} />
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Danger zone */}
        <div className={`rounded-2xl border p-5 ${isDark ? "bg-red-950/20 border-red-900/30" : "bg-red-50 border-red-200"}`}>
          <div className="flex items-center gap-2 mb-3">
            <Icon icon="ph:warning-fill" className="w-5 h-5 text-red-400" />
            <h2 className={`font-semibold ${isDark ? "text-red-300" : "text-red-800"}`}>Danger Zone</h2>
          </div>
          <p className={`text-sm mb-4 ${isDark ? "text-red-400/70" : "text-red-600"}`}>Deleting your account is permanent and cannot be undone. All your crop data and memberships will be lost.</p>
          <Button variant="danger" onClick={() => setShowDeleteModal(true)} icon="ph:trash-fill">Delete Account</Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => { toast.error("Account deletion requires backend support."); setShowDeleteModal(false); }}
        title="Delete Account?"
        description="This action is permanent. All your data, crop records, and memberships will be deleted."
        confirmLabel="Yes, Delete Account"
        variant="danger"
        icon="ph:trash-fill"
      />
    </div>
  );
};

export default FarmerSettings;

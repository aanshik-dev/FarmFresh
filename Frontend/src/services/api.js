import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Only redirect if not already on the login page (to avoid infinite loops on failed logins)
    if (err.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post("/auth/login", data),
  register: (data) => api.post("/auth/register", data),
  verifyOtp: (data) => api.post("/auth/verify-otp", data),
  logout: () => api.post("/auth/logout"),
  getMe: () => api.get("/user/me"),
};

// ── Common (public) ───────────────────────────────────────────────────────────
export const commonAPI = {
  getCrops: () => api.get("/data/crops"),
  getCollectives: (params) => api.get("/data/collectives", { params }),
};

// ── Farmer Crops ──────────────────────────────────────────────────────────────
export const farmerCropAPI = {
  add: (data) => api.post("/farmer/me/crops", data),
  get: () => api.get("/farmer/me/crops"),
  edit: (data) => api.patch("/farmer/me/crops", data),
  delete: (data) => api.delete("/farmer/me/crops", { data }),
};

// ── Farmer Memberships ────────────────────────────────────────────────────────
export const farmerMemberAPI = {
  sendRequest: (data) => api.post("/farmer/me/members/request", data),
  cancel: (data) => api.post("/farmer/me/members/cancel", data),
  terminate: (data) => api.post("/farmer/me/members/terminate", data),
  get: () => api.get("/farmer/me/members"),
};

// ── Farmer Deals / Crop Status ────────────────────────────────────────────────
export const farmerDealAPI = {
  updateStatus: (dealId, data) => api.post(`/farmer/me/deals/${dealId}/update-status`, data),
  getHistory: (dealId) => api.get(`/farmer/me/deals/${dealId}/status-history`),
  getActive: () => api.get("/farmer/me/deals/active"),
};

// ── Farmer Pickups & Balance ──────────────────────────────────────────────────
export const farmerPickupAPI = {
  getPickups: () => api.get("/farmer/me/pickups"),
  getBalance: () => api.get("/farmer/me/balance"),
};

// ── Farmer Notifications & Announcements & Dashboard ──────────────────────────────
export const farmerNotifAPI = {
  get: () => api.get("/farmer/me/notifications"),
  markRead: (notifId) => api.patch(`/farmer/me/notifications/${notifId}/read`),
  markAllRead: () => api.patch("/farmer/me/notifications/read-all"),
};

export const farmerAnnouncementAPI = {
  get: () => api.get("/farmer/me/announcements"),
  markRead: (announcementId) => api.patch(`/farmer/me/announcements/${announcementId}/read`),
};

export const farmerDashboardAPI = {
  get: () => api.get("/farmer/me/dashboard"),
};

// ── Collective Crops ──────────────────────────────────────────────────────────
export const collectiveCropAPI = {
  add: (data) => api.post("/collective/me/crops", data),
  get: () => api.get("/collective/me/crops"),
  edit: (data) => api.patch("/collective/me/crops", data),
  delete: (data) => api.delete("/collective/me/crops", { data }),
};

// ── Collective Memberships ────────────────────────────────────────────────────
export const collectiveMemberAPI = {
  get: () => api.get("/collective/me/members"),
  accept: (data) => api.post("/collective/me/members/accept", data),
  reject: (data) => api.post("/collective/me/members/reject", data),
  terminate: (data) => api.post("/collective/me/members/terminate", data),
  assignZone: (membershipId, data) => api.patch(`/collective/me/members/${membershipId}/zone`, data),
};

// ── Collective Zones ──────────────────────────────────────────────────────────
export const collectiveZoneAPI = {
  add: (data) => api.post("/collective/me/zones", data),
  get: () => api.get("/collective/me/zones"),
  edit: (zoneId, data) => api.patch(`/collective/me/zones/${zoneId}`, data),
  delete: (zoneId) => api.delete(`/collective/me/zones/${zoneId}`),
};

// ── Collective Drivers ────────────────────────────────────────────────────────
export const collectiveDriverAPI = {
  add: (data) => api.post("/collective/me/drivers", data),
  get: () => api.get("/collective/me/drivers"),
  edit: (driverId, data) => api.patch(`/collective/me/drivers/${driverId}`, data),
  delete: (driverId) => api.delete(`/collective/me/drivers/${driverId}`),
};

// ── Collective Deals / Crop Status ────────────────────────────────────────────
export const collectiveDealAPI = {
  queryStatus: (dealId) => api.post(`/collective/me/deals/${dealId}/query-status`),
  setPickupDate: (dealId, data) => api.patch(`/collective/me/deals/${dealId}/pickup-date`, data),
  getHistory: (dealId) => api.get(`/collective/me/deals/${dealId}/status-history`),
  getReadyDeals: () => api.get("/collective/me/ready-deals"),
};

// ── Collective Schedules ──────────────────────────────────────────────────────
export const collectiveScheduleAPI = {
  create: (data) => api.post("/collective/me/schedules", data),
  get: (params) => api.get("/collective/me/schedules", { params }),
  getDetail: (scheduleId) => api.get(`/collective/me/schedules/${scheduleId}`),
  updateStatus: (scheduleId, data) => api.patch(`/collective/me/schedules/${scheduleId}/status`, data),
  markItemPaid: (scheduleId, itemId, data) => api.patch(`/collective/me/schedules/${scheduleId}/items/${itemId}/pay`, data),
};

// ── Collective Notifications ──────────────────────────────────────────────────
export const collectiveNotifAPI = {
  get: () => api.get("/collective/me/notifications"),
  markRead: (notifId) => api.patch(`/collective/me/notifications/${notifId}/read`),
  markAllRead: () => api.patch("/collective/me/notifications/read-all"),
};

// ── Collective Announcements ──────────────────────────────────────────────────
export const collectiveAnnouncementAPI = {
  create: (data) => api.post("/collective/me/announcements", data),
  get: () => api.get("/collective/me/announcements"),
};

export const collectiveDashboardAPI = {
  get: () => api.get("/collective/me/dashboard"),
};

export default api;

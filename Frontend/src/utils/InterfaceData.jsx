// ──────────────────────────────────────────────────
// Navigation data
// ──────────────────────────────────────────────────

export const navLinks = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/features", label: "Features" },
  { path: "/contact", label: "Contact" },
];

export const farmerSidebarLinks = [
  { path: "/dashboard/farmer/overview",   label: "Dashboard",      icon: "ph:squares-four-fill" },
  { path: "/dashboard/farmer/crops",      label: "My Crops",       icon: "ph:plant-fill" },
  { path: "/dashboard/farmer/collectives",label: "Collectives",    icon: "ph:buildings-fill" },
  { path: "/dashboard/farmer/schedules",  label: "Schedules",      icon: "ph:calendar-fill" },
  { path: "/dashboard/farmer/notifications", label: "Notifications", icon: "ph:bell-fill", badge: true },
  { path: "/dashboard/farmer/profile",    label: "Profile",        icon: "ph:user-circle-fill" },
  { path: "/dashboard/farmer/settings",   label: "Settings",       icon: "ph:gear-six-fill" },
];

export const collectiveSidebarLinks = [
  { path: "/dashboard/collective/overview",     label: "Dashboard",      icon: "ph:squares-four-fill" },
  { path: "/dashboard/collective/farmers",      label: "Farmer Groups",  icon: "ph:users-three-fill" },
  { path: "/dashboard/collective/crops",        label: "Crop Inventory", icon: "ph:leaf-fill" },
  { path: "/dashboard/collective/drivers",      label: "Drivers",        icon: "ph:truck-fill" },
  { path: "/dashboard/collective/zones",        label: "Zones",          icon: "ph:map-trifold-fill" },
  { path: "/dashboard/collective/schedules",    label: "Schedules",      icon: "ph:calendar-check-fill" },
  { path: "/dashboard/collective/history",      label: "History",        icon: "ph:clock-counter-clockwise-fill" },
  { path: "/dashboard/collective/announcements",label: "Announcements",  icon: "ph:megaphone-fill" },
  { path: "/dashboard/collective/notifications",label: "Notifications",  icon: "ph:bell-fill", badge: true },
  { path: "/dashboard/collective/profile",      label: "Profile",        icon: "ph:user-circle-fill" },
  { path: "/dashboard/collective/settings",     label: "Settings",       icon: "ph:gear-six-fill" },
];

export const adminSidebarLinks = [
  { path: "/dashboard/admin/overview",      label: "Dashboard",      icon: "ph:squares-four-fill" },
  { path: "/dashboard/admin/users",         label: "Users",          icon: "ph:users-three-fill" },
  { path: "/dashboard/admin/farmer-groups", label: "Farmer Groups",  icon: "ph:plant-fill" },
  { path: "/dashboard/admin/collectives",   label: "Collectives",    icon: "ph:buildings-fill" },
  { path: "/dashboard/admin/issues",        label: "Issues",         icon: "ph:warning-circle-fill", badge: true },
  { path: "/dashboard/admin/settings",      label: "Settings",       icon: "ph:gear-six-fill" },
];

// ──────────────────────────────────────────────────
// Farmer group mock data
// ──────────────────────────────────────────────────

export const farmerGroups = [
  {
    id: "fg_001",
    groupName: "Triyuginarayan Organic Pulse Pioneers",
    address: "Triyuginarayan • 2,200m",
    distance: "8.4 km",
    leadFarmer: "Debendra Semwal",
    numberOfFarmers: 12,
    yield: "450 kg",
    phone: "+91 94120 78234",
    email: "debendra@pulsecollective.in",
    zone: "Zone C • High Alpine",
    lastUpdated: "2 hours ago",
    crops: ["Rajma", "Red Rice", "Amaranth"],
    status: "active",
    profilePhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    banner: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200",
    coordinates: { lat: 30.7, lng: 79.1 },
    rating: 4.8,
    reviews: 14,
    description: "We grow high-altitude organic rajma and red rice in the sacred Triyuginarayan valley.",
    collective: "Mandakini Organic Collective",
    memberSince: "March 2022",
  },
  {
    id: "fg_002",
    groupName: "Mandal Valley Growers",
    address: "Mandal • 1,950m",
    distance: "5.2 km",
    leadFarmer: "Anita Rawat",
    numberOfFarmers: 18,
    yield: "390 kg",
    phone: "+91 98765 43210",
    email: "anita@mandalgrowers.in",
    zone: "Zone B",
    lastUpdated: "Today",
    crops: ["Potato", "Buckwheat", "Peas"],
    status: "active",
    profilePhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    banner: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200",
    coordinates: { lat: 30.58, lng: 79.0 },
    rating: 4.5,
    reviews: 9,
    description: "Family-run collective of 18 farmers growing premium mountain potatoes.",
    collective: "Kedarnath Valley Organics",
    memberSince: "January 2023",
  },
  {
    id: "fg_003",
    groupName: "Kedar Highlands Collective",
    address: "Kedarnath Route • 2,500m",
    distance: "14 km",
    leadFarmer: "Mahesh Rana",
    numberOfFarmers: 8,
    yield: "620 kg",
    phone: "+91 91234 56789",
    email: "mahesh@kedarcollective.in",
    zone: "Zone D",
    lastUpdated: "Yesterday",
    crops: ["Rajma", "Barley", "Amaranth"],
    status: "active",
    profilePhoto: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    banner: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200",
    coordinates: { lat: 30.73, lng: 79.07 },
    rating: 4.9,
    reviews: 21,
    description: "High-altitude group known for the finest rajma in the Kedarnath corridor.",
    collective: "Mandakini Organic Collective",
    memberSince: "June 2021",
  },
  {
    id: "fg_004",
    groupName: "Guptkashi Green Farms",
    address: "Guptkashi • 1,450m",
    distance: "3.1 km",
    leadFarmer: "Pooja Negi",
    numberOfFarmers: 24,
    yield: "510 kg",
    phone: "+91 99887 66554",
    email: "pooja@guptkashi.in",
    zone: "Zone A",
    lastUpdated: "4 hours ago",
    crops: ["Spinach", "Cabbage", "Potato"],
    status: "active",
    profilePhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    banner: "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200",
    coordinates: { lat: 30.52, lng: 79.04 },
    rating: 4.6,
    reviews: 17,
    description: "Largest group in Zone A, specializing in fresh green vegetables.",
    collective: "Rudraprayag Farmers Alliance",
    memberSince: "September 2022",
  },
  {
    id: "fg_005",
    groupName: "Sonprayag Mountain Harvesters",
    address: "Sonprayag • 2,050m",
    distance: "11.3 km",
    leadFarmer: "Rakesh Bisht",
    numberOfFarmers: 15,
    yield: "580 kg",
    phone: "+91 97654 32109",
    email: "rakesh@sonprayag.in",
    zone: "Zone C",
    lastUpdated: "1 day ago",
    crops: ["Rajma", "Turmeric", "Millets"],
    status: "active",
    profilePhoto: "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400",
    banner: "https://images.unsplash.com/photo-1463123081488-789f998ac9c4?w=1200",
    coordinates: { lat: 30.63, lng: 79.02 },
    rating: 4.7,
    reviews: 12,
    description: "Expert growers of organic turmeric and millets at 2,000m elevation.",
    collective: "Mandakini Organic Collective",
    memberSince: "November 2021",
  },
];

// ──────────────────────────────────────────────────
// Collectives mock data
// ──────────────────────────────────────────────────

export const collectivesList = [
  {
    id: "col_001",
    name: "Mandakini Organic Collective",
    address: "Rudraprayag District, Uttarakhand",
    phone: "+91 1372 264211",
    email: "coordination@mandakini-organic.org",
    description: "The premier organic produce collective in the Kedarnath corridor, operating since 2018.",
    workers: 45,
    zones: ["Zone B", "Zone C", "Zone D"],
    crops: [
      { name: "Rajma", pricePerKg: 120, stock: 850 },
      { name: "Amaranth", pricePerKg: 95, stock: 340 },
      { name: "Red Rice", pricePerKg: 110, stock: 520 },
      { name: "Barley", pricePerKg: 70, stock: 680 },
    ],
    farmerGroups: 14,
    rating: 4.8,
    reviews: 62,
    profilePhoto: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400",
    established: "2018",
    coordinates: { lat: 30.60, lng: 79.06 },
    totalHarvest: "18.4t",
    isVerified: true,
  },
  {
    id: "col_002",
    name: "Kedarnath Valley Organics",
    address: "Okhimath, Rudraprayag",
    phone: "+91 97600 12345",
    email: "info@kedarnathvalley.in",
    description: "Focused on mid-altitude crops, serving Zone A and B farmer groups.",
    workers: 28,
    zones: ["Zone A", "Zone B"],
    crops: [
      { name: "Potato", pricePerKg: 40, stock: 1200 },
      { name: "Buckwheat", pricePerKg: 85, stock: 290 },
      { name: "Peas", pricePerKg: 60, stock: 470 },
    ],
    farmerGroups: 8,
    rating: 4.5,
    reviews: 38,
    profilePhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
    established: "2020",
    coordinates: { lat: 30.55, lng: 79.02 },
    totalHarvest: "9.8t",
    isVerified: true,
  },
  {
    id: "col_003",
    name: "Rudraprayag Farmers Alliance",
    address: "Agastmuni, Rudraprayag",
    phone: "+91 98760 54321",
    email: "alliance@rudraprayag.in",
    description: "Specializing in fresh vegetables and spices for the Rishikesh-Haridwar market.",
    workers: 32,
    zones: ["Zone A"],
    crops: [
      { name: "Spinach", pricePerKg: 30, stock: 650 },
      { name: "Cabbage", pricePerKg: 25, stock: 820 },
      { name: "Turmeric", pricePerKg: 150, stock: 180 },
      { name: "Ginger", pricePerKg: 120, stock: 210 },
    ],
    farmerGroups: 6,
    rating: 4.6,
    reviews: 29,
    profilePhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
    established: "2019",
    coordinates: { lat: 30.48, lng: 78.98 },
    totalHarvest: "7.2t",
    isVerified: false,
  },
];

// ──────────────────────────────────────────────────
// Crops master list
// ──────────────────────────────────────────────────

export const CROPS_MASTER = [
  { id: "rajma",      name: "Rajma",              icon: "ph:plant-fill",  category: "Pulse",     season: "Kharif",    color: "#dc2626" },
  { id: "potato",     name: "Potato",             icon: "ph:plant-fill",  category: "Vegetable", season: "Rabi",      color: "#ca8a04" },
  { id: "amaranth",   name: "Amaranth",           icon: "ph:plant-fill",  category: "Grain",     season: "Kharif",    color: "#7c3aed" },
  { id: "buckwheat",  name: "Buckwheat (Kuttu)",  icon: "ph:plant-fill",  category: "Grain",     season: "Kharif",    color: "#059669" },
  { id: "millets",    name: "Millets",            icon: "ph:plant-fill",  category: "Grain",     season: "Kharif",    color: "#d97706" },
  { id: "turmeric",   name: "Turmeric",           icon: "ph:plant-fill",  category: "Spice",     season: "Kharif",    color: "#f59e0b" },
  { id: "red_rice",   name: "Red Rice",           icon: "ph:plant-fill",  category: "Grain",     season: "Kharif",    color: "#b91c1c" },
  { id: "barley",     name: "Barley",             icon: "ph:plant-fill",  category: "Grain",     season: "Rabi",      color: "#92400e" },
  { id: "spinach",    name: "Spinach",            icon: "ph:plant-fill",  category: "Vegetable", season: "Rabi",      color: "#16a34a" },
  { id: "peas",       name: "Peas",              icon: "ph:plant-fill",   category: "Vegetable", season: "Rabi",      color: "#65a30d" },
  { id: "cabbage",    name: "Cabbage",            icon: "ph:plant-fill",  category: "Vegetable", season: "Rabi",      color: "#4ade80" },
  { id: "ginger",     name: "Ginger",            icon: "ph:plant-fill",   category: "Spice",     season: "Kharif",    color: "#d97706" },
  { id: "garlic",     name: "Garlic",             icon: "ph:plant-fill",  category: "Spice",     season: "Rabi",      color: "#9ca3af" },
  { id: "tomato",     name: "Tomato",             icon: "ph:plant-fill",  category: "Vegetable", season: "Kharif",    color: "#ef4444" },
  { id: "maize",      name: "Maize (Corn)",       icon: "ph:plant-fill",  category: "Grain",     season: "Kharif",    color: "#eab308" },
];

// ──────────────────────────────────────────────────
// Drivers mock data
// ──────────────────────────────────────────────────

export const driversData = [
  { id: "drv_001", name: "Suresh Kumar Thapa", phone: "+91 94500 12345", license: "UK07T1234", zones: ["Zone B", "Zone C"], status: "active", activePickups: 1, totalDeliveries: 84, profilePhoto: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400", joinedDate: "Jan 2022" },
  { id: "drv_002", name: "Gopal Semwal", phone: "+91 97600 98765", license: "UK07T5678", zones: ["Zone A"], status: "active", activePickups: 0, totalDeliveries: 67, profilePhoto: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=400", joinedDate: "Mar 2022" },
  { id: "drv_003", name: "Mohan Rawat", phone: "+91 98100 11223", license: "UK07T9012", zones: ["Zone D"], status: "active", activePickups: 2, totalDeliveries: 112, profilePhoto: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400", joinedDate: "Aug 2021" },
  { id: "drv_004", name: "Ramesh Bisht", phone: "+91 96300 44556", license: "UK07T3456", zones: ["Zone A", "Zone B"], status: "inactive", activePickups: 0, totalDeliveries: 43, profilePhoto: "https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400", joinedDate: "May 2023" },
];

// ──────────────────────────────────────────────────
// Zones mock data
// ──────────────────────────────────────────────────

export const zonesData = [
  { id: "zone_a", name: "Zone A", altitude: "1,400–1,700m", farmerGroupCount: 4, coordinator: "Aman Singh", description: "Low-altitude zone near Guptkashi and Agastmuni, suitable for vegetables.", cropTypes: ["Vegetable", "Spice"], color: "#10b981" },
  { id: "zone_b", name: "Zone B", altitude: "1,700–2,000m", farmerGroupCount: 6, coordinator: "Priya Negi", description: "Mid-altitude zone covering Mandal valley and Okhimath area.", cropTypes: ["Pulse", "Grain", "Vegetable"], color: "#3b82f6" },
  { id: "zone_c", name: "Zone C", altitude: "2,000–2,300m", farmerGroupCount: 7, coordinator: "Vijay Rawat", description: "High-altitude zone around Triyuginarayan and Sonprayag.", cropTypes: ["Pulse", "Grain"], color: "#8b5cf6" },
  { id: "zone_d", name: "Zone D", altitude: "2,300m+", farmerGroupCount: 3, coordinator: "Durga Prasad", description: "Very high altitude — Kedarnath route. Limited crops, speciality varieties only.", cropTypes: ["Pulse", "Grain"], color: "#f59e0b" },
];

// ──────────────────────────────────────────────────
// Pickup schedules mock data
// ──────────────────────────────────────────────────

export const pickupSchedules = [
  {
    id: "sch_001",
    farmerGroup: "Triyuginarayan Organic Pulse Pioneers",
    farmerGroupId: "fg_001",
    collective: "Mandakini Organic Collective",
    crop: "Rajma",
    quantity: 120,
    driver: "Suresh Kumar Thapa",
    driverId: "drv_001",
    date: "2026-07-10",
    time: "09:00",
    status: "scheduled",
    zone: "Zone C",
    notes: "Bring extra cold storage containers.",
  },
  {
    id: "sch_002",
    farmerGroup: "Kedar Highlands Collective",
    farmerGroupId: "fg_003",
    collective: "Mandakini Organic Collective",
    crop: "Amaranth",
    quantity: 85,
    driver: "Mohan Rawat",
    driverId: "drv_003",
    date: "2026-07-08",
    time: "07:30",
    status: "in_progress",
    zone: "Zone D",
    notes: "",
  },
  {
    id: "sch_003",
    farmerGroup: "Sonprayag Mountain Harvesters",
    farmerGroupId: "fg_005",
    collective: "Mandakini Organic Collective",
    crop: "Turmeric",
    quantity: 60,
    driver: "Suresh Kumar Thapa",
    driverId: "drv_001",
    date: "2026-07-05",
    time: "08:00",
    status: "completed",
    zone: "Zone C",
    notes: "Dry run went smoothly.",
  },
  {
    id: "sch_004",
    farmerGroup: "Guptkashi Green Farms",
    farmerGroupId: "fg_004",
    collective: "Rudraprayag Farmers Alliance",
    crop: "Spinach",
    quantity: 200,
    driver: "Gopal Semwal",
    driverId: "drv_002",
    date: "2026-07-07",
    time: "06:00",
    status: "completed",
    zone: "Zone A",
    notes: "Harvested early due to hail forecast.",
  },
  {
    id: "sch_005",
    farmerGroup: "Mandal Valley Growers",
    farmerGroupId: "fg_002",
    collective: "Kedarnath Valley Organics",
    crop: "Potato",
    quantity: 300,
    driver: "Gopal Semwal",
    driverId: "drv_002",
    date: "2026-07-15",
    time: "10:00",
    status: "scheduled",
    zone: "Zone B",
    notes: "",
  },
];

// ──────────────────────────────────────────────────
// Notifications mock data
// ──────────────────────────────────────────────────

export const farmerNotifications = [
  { id: "notif_001", type: "schedule", title: "Pickup Scheduled", message: "Your Rajma pickup is scheduled for July 10, 9:00 AM. Driver: Suresh Kumar Thapa.", time: "2 hours ago", read: false, icon: "ph:calendar-check-fill" },
  { id: "notif_002", type: "membership", title: "Membership Approved", message: "Mandakini Organic Collective approved your Rajma membership.", time: "1 day ago", read: false, icon: "ph:check-circle-fill" },
  { id: "notif_003", type: "status_request", title: "Status Update Requested", message: "Mandakini Organic Collective has requested an update on your Amaranth crop.", time: "2 days ago", read: true, icon: "ph:question-fill" },
  { id: "notif_004", type: "announcement", title: "Announcement: Price Update", message: "Mandakini Organic Collective has updated Rajma price to ₹120/kg for the season.", time: "3 days ago", read: true, icon: "ph:megaphone-fill" },
  { id: "notif_005", type: "pickup_complete", title: "Pickup Completed", message: "Your Turmeric pickup was completed successfully. 60 kg collected.", time: "5 days ago", read: true, icon: "ph:package-fill" },
];

export const collectiveNotifications = [
  { id: "cnotif_001", type: "membership_request", title: "New Membership Request", message: "Triyuginarayan Organic Pulse Pioneers has requested membership for Rajma crops.", time: "1 hour ago", read: false, icon: "ph:user-plus-fill" },
  { id: "cnotif_002", type: "status_response", title: "Crop Status Received", message: "Kedar Highlands Collective updated their Amaranth: 85% growth, ready in 2 weeks.", time: "5 hours ago", read: false, icon: "ph:plant-fill" },
  { id: "cnotif_003", type: "pickup_complete", title: "Pickup Completed", message: "Driver Suresh Kumar Thapa completed the Turmeric pickup from Sonprayag.", time: "1 day ago", read: true, icon: "ph:truck-fill" },
  { id: "cnotif_004", type: "review", title: "New Review Received", message: "Guptkashi Green Farms gave you 5 stars: 'Excellent coordination and fair pricing!'", time: "3 days ago", read: true, icon: "ph:star-fill" },
];

// ──────────────────────────────────────────────────
// Announcements mock data
// ──────────────────────────────────────────────────

export const announcementsData = [
  {
    id: "ann_001",
    title: "Rajma Price Update for Kharif Season 2026",
    content: "Dear farmer groups, we are pleased to announce that the Rajma procurement price has been revised to ₹120/kg for the current Kharif season, up from ₹105/kg last year. This reflects the improved market demand and your excellent quality.",
    target: "All Farmer Groups",
    author: "Ravi Kumar Sharma",
    createdAt: "2026-07-01",
    readCount: 12,
    totalRecipients: 14,
    pinned: true,
  },
  {
    id: "ann_002",
    title: "Collection Schedule Changes — July 8-15",
    content: "Due to the annual Kedarnath pilgrimage season, vehicle movement on NH-107 will be restricted from July 8-15. Collection schedules in Zone D will be adjusted accordingly. Please ensure crops are ready 2 days ahead.",
    target: "Zone D",
    author: "Ravi Kumar Sharma",
    createdAt: "2026-06-28",
    readCount: 3,
    totalRecipients: 3,
    pinned: false,
  },
  {
    id: "ann_003",
    title: "New Cold Storage Facility Operational",
    content: "We are excited to announce that our new cold storage unit at Rudraprayag has become operational. This increases our capacity by 40% and will allow us to handle more produce during peak harvest season.",
    target: "All Farmer Groups",
    author: "System",
    createdAt: "2026-06-20",
    readCount: 14,
    totalRecipients: 14,
    pinned: false,
  },
];

// ──────────────────────────────────────────────────
// Admin: Issues mock data
// ──────────────────────────────────────────────────

export const issuesData = [
  { id: "iss_001", title: "Payment dispute — Zone C pickup July 3", type: "payment", priority: "high", status: "open", reportedBy: "Debendra Semwal", reportedByRole: "FARMER_GROUP", assignedTo: null, createdAt: "2026-07-03", description: "The payment for 120 kg of Rajma (₹14,400) has not been credited 48 hours after pickup." },
  { id: "iss_002", title: "Driver Mohan Rawat – vehicle breakdown", type: "operational", priority: "medium", status: "in_progress", reportedBy: "Ravi Kumar Sharma", reportedByRole: "COLLECTIVE", assignedTo: "Admin", createdAt: "2026-07-02", description: "Vehicle breakdown on the Kedarnath route during Zone D pickup. Alternate driver arranged." },
  { id: "iss_003", title: "Wrong crop quantity recorded in history", type: "data", priority: "low", status: "resolved", reportedBy: "Anita Rawat", reportedByRole: "FARMER_GROUP", assignedTo: "Admin", createdAt: "2026-06-29", description: "Schedule sch_004 shows 200 kg but actual was 185 kg." },
  { id: "iss_004", title: "Collective profile details incorrect", type: "account", priority: "low", status: "resolved", reportedBy: "Priya Negi", reportedByRole: "COLLECTIVE", assignedTo: "Admin", createdAt: "2026-06-25", description: "Phone number and address need to be updated for Kedarnath Valley Organics." },
];

// ──────────────────────────────────────────────────
// Charts / stats data (keep existing + add new)
// ──────────────────────────────────────────────────

export const monthlyHarvest = [
  { month: "Jan", kg: 1180 }, { month: "Feb", kg: 1340 }, { month: "Mar", kg: 1620 },
  { month: "Apr", kg: 1890 }, { month: "May", kg: 2210 }, { month: "Jun", kg: 2550 },
  { month: "Jul", kg: 2330 }, { month: "Aug", kg: 2680 }, { month: "Sep", kg: 2940 },
  { month: "Oct", kg: 3120 }, { month: "Nov", kg: 2780 }, { month: "Dec", kg: 2105 },
];

export const zoneBreakdown = [
  { zone: "Zone A", groups: 4, altitude: "1,400–1,700m", kg: 2840 },
  { zone: "Zone B", groups: 6, altitude: "1,700–2,000m", kg: 4120 },
  { zone: "Zone C", groups: 7, altitude: "2,000–2,300m", kg: 5360 },
  { zone: "Zone D", groups: 3, altitude: "2,300m+",      kg: 1980 },
];

export const cropDistribution = [
  { name: "Rajma",     value: 32 }, { name: "Potato",    value: 21 },
  { name: "Amaranth",  value: 14 }, { name: "Buckwheat", value: 12 },
  { name: "Millets",   value: 11 }, { name: "Other",     value: 10 },
];

export const decayTrend = [
  { month: "Jan", decay: 18 }, { month: "Feb", decay: 16 }, { month: "Mar", decay: 15 },
  { month: "Apr", decay: 13 }, { month: "May", decay: 11 }, { month: "Jun", decay: 9 },
  { month: "Jul", decay: 9 },  { month: "Aug", decay: 8 },  { month: "Sep", decay: 7 },
  { month: "Oct", decay: 7 },  { month: "Nov", decay: 6 },  { month: "Dec", decay: 6 },
];

export const dashboardStats = [
  { label: "Active Farmer Groups", value: "20",     icon: "ph:users-three-fill",  trend: "+3 this quarter" },
  { label: "Total Harvest (YTD)",  value: "28.4t",  icon: "ph:scales-fill",       trend: "+18% vs last year" },
  { label: "Post-Harvest Decay",   value: "6%",     icon: "ph:trend-down-fill",   trend: "down from 18%" },
  { label: "Avg. Collection Time", value: "9.2 hrs",icon: "ph:clock-fill",        trend: "-2.1 hrs improved" },
];

export const timeline = [
  { year: "2019", title: "First Coordinator Network", text: "Five farmer groups around Guptkashi began sharing a single harvest calendar by phone." },
  { year: "2021", title: "Zone System Introduced", text: "Altitude-based zones (A–D) let coordinators plan collection routes around terrain and weather." },
  { year: "2023", title: "Digital Collection Tracking", text: "Paper logbooks were replaced with shared digital status boards across all zones." },
  { year: "2025", title: "20 Groups, Four Valleys", text: "The collective now spans Triyuginarayan to Sonprayag, coordinating over 28 tonnes a year." },
];

export const values = [
  { icon: "ph:mountains-fill",  title: "Terrain-First Planning",   text: "Routes and schedules are built around real Himalayan terrain, not flat-land assumptions." },
  { icon: "ph:leaf-fill",       title: "100% Organic Practice",    text: "Every member group follows certified organic cultivation, season after season." },
  { icon: "ph:handshake-fill",  title: "Farmer-Owned Coordination",text: "Lead farmers set their own harvest windows; the platform supports their decisions, not the reverse." },
  { icon: "ph:package-fill",    title: "Decay Reduction",          text: "Faster, better-timed collection has cut average post-harvest loss from 18% to 6%." },
];

export const faqs = [
  { q: "How do I report a harvest as ready for collection?", a: "Lead farmers can mark a crop status as Ready for Collection from the crop management page. A zone coordinator is automatically notified and assigned within 24 hours." },
  { q: "What altitude zones does the collective cover?", a: "Four zones from roughly 1,400m to 2,500m+, spanning Guptkashi to the Kedarnath route. Each zone has a dedicated coordinator and collection route." },
  { q: "How is post-harvest decay tracked?", a: "Each collection logs a time-from-harvest figure, which feeds into the decay analytics dashboard. Faster collection windows directly reduce decay percentages." },
  { q: "Can a new farmer group join the collective?", a: "Yes — use the Sign Up flow to register a group, then browse collectives and request membership for specific crops." },
  { q: "Who do I contact for a collection delay?", a: "Reach the relevant zone coordinator directly, or call the Uttarakhand base line for urgent rerouting." },
];

export const supportChannels = [
  { icon: "ph:phone-fill",            label: "Coordinator Hotline", value: "+91 1372 264211",                    note: "Mon–Sat, 7 AM – 7 PM IST" },
  { icon: "ph:envelope-fill",         label: "Email Support",       value: "coordination@mandakini-organic.org", note: "Response within 24 hours" },
];

// Farmer crop management mock data
export const farmerCropsData = [
  { id: "fc_001", name: "Rajma", status: "growing", growthPercent: 65, plantedDate: "2026-04-15", expectedHarvest: "2026-08-10", collective: "Mandakini Organic Collective", lastUpdate: "2 hours ago", lastUpdateText: "Plants are flowering well, expecting good yield.", season: "Kharif", image: null },
  { id: "fc_002", name: "Red Rice", status: "growing", growthPercent: 42, plantedDate: "2026-05-01", expectedHarvest: "2026-09-15", collective: null, lastUpdate: "Yesterday", lastUpdateText: "Irrigation completed, growth on track.", season: "Kharif", image: null },
  { id: "fc_003", name: "Amaranth", status: "ready", growthPercent: 100, plantedDate: "2026-03-20", expectedHarvest: "2026-07-01", collective: null, lastUpdate: "3 hours ago", lastUpdateText: "Fully mature and ready for harvest!", season: "Kharif", image: null },
  { id: "fc_004", name: "Barley", status: "out_of_season", growthPercent: 0, plantedDate: null, expectedHarvest: "2027-04-15", collective: null, lastUpdate: "1 month ago", lastUpdateText: "Declared out of season until Rabi 2027.", season: "Rabi", image: null },
];

// Collective memberships mock data
export const membershipRequests = [
  { id: "mr_001", farmerGroup: "Triyuginarayan Organic Pulse Pioneers", farmerGroupId: "fg_001", crop: "Rajma", status: "pending", requestDate: "2026-07-01", note: "High-quality produce from 2,200m altitude.", estimatedYield: "120 kg" },
  { id: "mr_002", farmerGroup: "Guptkashi Green Farms", farmerGroupId: "fg_004", crop: "Spinach", status: "approved", requestDate: "2026-06-15", note: "", estimatedYield: "200 kg", approvedDate: "2026-06-18", zone: "Zone A" },
];

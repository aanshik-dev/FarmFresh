export const navLinks = [
  { path: "/", label: "Home" },
  { path: "/collection", label: "Collection Hub" },
  { path: "/about", label: "About Collective" },
  { path: "/assistance", label: "Assistance" },
  { path: "/contacts", label: "Contacts" },
];

export const farmerGroups = [
  {
    id: 1,
    theme: "dark",
    status: "Ready",
    groupName: "Triyuginarayan Organic Pulse Pioneers",
    address: "Triyuginarayan • 2,200m",
    distance: "8.4 km",
    leadFarmer: "Debendra Semwal",
    yield: "450 kg",
    phone: "+91 94120 78234",
    email: "debendra@pulsecollective.in",
    zone: "Zone C • High Alpine",
    lastUpdated: "2 hours ago",
    crops: ["Rajma", "Red Rice", "Amaranth"],
    profile:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400",
    banner:
      "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=1200",
  },

  {
    id: 2,
    theme: "dark",
    status: "Ready",
    groupName: "Mandal Valley Growers",
    address: "Mandal • 1,950m",
    distance: "5.2 km",
    leadFarmer: "Anita Rawat",
    yield: "390 kg",
    phone: "+91 98765 43210",
    email: "anita@mandalgrowers.in",
    zone: "Zone B",
    lastUpdated: "Today",
    crops: ["Potato", "Buckwheat", "Peas"],
    profile:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400",
    banner:
      "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200",
  },

  {
    id: 3,
    theme: "dark",
    status: "Monitoring",
    groupName: "Kedar Highlands Collective",
    address: "Kedarnath Route • 2,500m",
    distance: "14 km",
    leadFarmer: "Mahesh Rana",
    yield: "620 kg",
    phone: "+91 91234 56789",
    email: "mahesh@kedarcollective.in",
    zone: "Zone D",
    lastUpdated: "Yesterday",
    crops: ["Rajma", "Barley", "Amaranth"],
    profile:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
    banner:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200",
  },

  {
    id: 4,
    theme: "dark",
    status: "Ready",
    groupName: "Guptkashi Green Farms",
    address: "Guptkashi • 1,450m",
    distance: "3.1 km",
    leadFarmer: "Pooja Negi",
    yield: "510 kg",
    phone: "+91 99887 66554",
    email: "pooja@guptkashi.in",
    zone: "Zone A",
    lastUpdated: "4 hours ago",
    crops: ["Spinach", "Cabbage", "Potato"],
    profile:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
    banner:
      "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=1200",
  },

  {
    id: 5,
    theme: "dark",
    status: "Monitoring",
    groupName: "Sonprayag Mountain Harvesters",
    address: "Sonprayag • 2,050m",
    distance: "11.3 km",
    leadFarmer: "Rakesh Bisht",
    yield: "580 kg",
    phone: "+91 97654 32109",
    email: "rakesh@sonprayag.in",
    zone: "Zone C",
    lastUpdated: "1 day ago",
    crops: ["Rajma", "Turmeric", "Millets"],
    profile:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?w=400",
    banner:
      "https://images.unsplash.com/photo-1463123081488-789f998ac9c4?w=1200",
  },
];

export const monthlyHarvest = [
  { month: "Jan", kg: 1180 },
  { month: "Feb", kg: 1340 },
  { month: "Mar", kg: 1620 },
  { month: "Apr", kg: 1890 },
  { month: "May", kg: 2210 },
  { month: "Jun", kg: 2550 },
  { month: "Jul", kg: 2330 },
  { month: "Aug", kg: 2680 },
  { month: "Sep", kg: 2940 },
  { month: "Oct", kg: 3120 },
  { month: "Nov", kg: 2780 },
  { month: "Dec", kg: 2105 },
];

export const zoneBreakdown = [
  { zone: "Zone A", groups: 4, altitude: "1,400–1,600m", kg: 2840 },
  { zone: "Zone B", groups: 6, altitude: "1,700–2,000m", kg: 4120 },
  { zone: "Zone C", groups: 7, altitude: "2,000–2,300m", kg: 5360 },
  { zone: "Zone D", groups: 3, altitude: "2,300m+", kg: 1980 },
];

export const cropDistribution = [
  { name: "Rajma", value: 32 },
  { name: "Potato", value: 21 },
  { name: "Amaranth", value: 14 },
  { name: "Buckwheat", value: 12 },
  { name: "Millets", value: 11 },
  { name: "Other", value: 10 },
];

export const decayTrend = [
  { month: "Jan", decay: 18 },
  { month: "Feb", decay: 16 },
  { month: "Mar", decay: 15 },
  { month: "Apr", decay: 13 },
  { month: "May", decay: 11 },
  { month: "Jun", decay: 9 },
  { month: "Jul", decay: 9 },
  { month: "Aug", decay: 8 },
  { month: "Sep", decay: 7 },
  { month: "Oct", decay: 7 },
  { month: "Nov", decay: 6 },
  { month: "Dec", decay: 6 },
];

export const dashboardStats = [
  {
    label: "Active Farmer Groups",
    value: "20",
    icon: "ph:users-three-fill",
    trend: "+3 this quarter",
  },
  {
    label: "Total Harvest (YTD)",
    value: "28.4t",
    icon: "ph:scales-fill",
    trend: "+18% vs last year",
  },
  {
    label: "Post-Harvest Decay",
    value: "6%",
    icon: "ph:trend-down-fill",
    trend: "down from 18%",
  },
  {
    label: "Avg. Collection Time",
    value: "9.2 hrs",
    icon: "ph:clock-fill",
    trend: "-2.1 hrs improved",
  },
];

export const timeline = [
  {
    year: "2019",
    title: "First Coordinator Network",
    text: "Five farmer groups around Guptkashi began sharing a single harvest calendar by phone.",
  },
  {
    year: "2021",
    title: "Zone System Introduced",
    text: "Altitude-based zones (A–D) let coordinators plan collection routes around terrain and weather.",
  },
  {
    year: "2023",
    title: "Digital Collection Tracking",
    text: "Paper logbooks were replaced with shared digital status boards across all zones.",
  },
  {
    year: "2025",
    title: "20 Groups, Four Valleys",
    text: "The collective now spans Triyuginarayan to Sonprayag, coordinating over 28 tonnes a year.",
  },
];

export const values = [
  {
    icon: "ph:mountains-fill",
    title: "Terrain-First Planning",
    text: "Routes and schedules are built around real Himalayan terrain, not flat-land assumptions.",
  },
  {
    icon: "ph:leaf-fill",
    title: "100% Organic Practice",
    text: "Every member group follows certified organic cultivation, season after season.",
  },
  {
    icon: "ph:handshake-fill",
    title: "Farmer-Owned Coordination",
    text: "Lead farmers set their own harvest windows; the platform supports their decisions, not the reverse.",
  },
  {
    icon: "ph:package-fill",
    title: "Decay Reduction",
    text: "Faster, better-timed collection has cut average post-harvest loss from 18% to 6%.",
  },
];

export const faqs = [
  {
    q: "How do I report a harvest as ready for collection?",
    a: "Lead farmers can mark a crop status as Ready for Collection from the group's profile page. A zone coordinator is automatically notified and assigned within 24 hours.",
  },
  {
    q: "What altitude zones does the collective cover?",
    a: "Four zones from roughly 1,400m to 2,500m+, spanning Guptkashi to the Kedarnath route. Each zone has a dedicated coordinator and collection route.",
  },
  {
    q: "How is post-harvest decay tracked?",
    a: "Each collection logs a time-from-harvest figure, which feeds into the decay analytics shown on this dashboard. Faster collection windows directly reduce decay percentages.",
  },
  {
    q: "Can a new farmer group join the collective?",
    a: "Yes — use the Sign Up flow to register a group, then a coordinator will reach out to confirm zone placement and onboarding.",
  },
  {
    q: "Who do I contact for a collection delay?",
    a: "Reach the relevant zone coordinator directly via the contact details on this page, or call the Uttarakhand base line for urgent rerouting.",
  },
];

export const supportChannels = [
  {
    icon: "ph:phone-fill",
    label: "Coordinator Hotline",
    value: "+91 1372 264211",
    note: "Mon–Sat, 7 AM – 7 PM IST",
  },
  {
    icon: "ph:envelope-fill",
    label: "Email Support",
    value: "coordination@mandakini-organic.org",
    note: "Response within 24 hours",
  },
  {
    icon: "ph:chat-circle-dots-fill",
    label: "Field Radio Relay",
    value: "Channel 4, Zones A–D",
    note: "For active collection-day issues",
  },
];

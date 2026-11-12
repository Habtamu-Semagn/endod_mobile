// App data — ported from the dedan-health web app for the mobile screens.

export type Hospital = {
  id: string;
  name: string;
  initials: string;
  website: string;
  distance: string;
  wait: string;
  rating: string;
  status: string;
  tags: string[];
  iconBg: string;
  iconText: string;
  latitude: number;
  longitude: number;
  location: string;
  phone: string;
};

export const BOOKING_HOSPITALS: Hospital[] = [
  {
    id: "h1",
    name: "St. Jude Metropolitan Hospital",
    latitude: 9.03,
    longitude: 38.74,
    initials: "SJ",
    website: "stjude-hospital.health",
    distance: "1.8 miles",
    wait: "~15 mins",
    rating: "4.9 ★ (840)",
    status: "Open 24/7",
    tags: ["Cardiology", "Emergency Care", "ENDOD FastTrack"],
    iconBg: "bg-brand-alt",
    iconText: "text-brand-heading",
    location: "Addis Ababa, Bole",
    phone: "+251 11 123 4567",
  },
  {
    id: "h2",
    name: "Apex Heart & Health Institute",
    latitude: 9.02,
    longitude: 38.76,
    initials: "AH",
    website: "apexhealthcenter.org",
    distance: "3.2 miles",
    wait: "~25 mins",
    rating: "4.8 ★ (1,120)",
    status: "Slots Today",
    tags: ["Cardiology", "Heart Surgery"],
    iconBg: "bg-brand-alt",
    iconText: "text-brand-heading",
    location: "Addis Ababa, Kazanchis",
    phone: "+251 11 234 5678",
  },
  {
    id: "h3",
    name: "Providence Memorial Hospital",
    latitude: 9.01,
    longitude: 38.75,
    initials: "PM",
    website: "providence-memorial.org",
    distance: "4.1 miles",
    wait: "~10 mins",
    rating: "4.7 ★ (560)",
    status: "Open 24/7",
    tags: ["Emergency & Trauma", "Surgery"],
    iconBg: "bg-brand-alt",
    iconText: "text-brand-heading",
    location: "Addis Ababa, Piassa",
    phone: "+251 11 345 6789",
  },
  {
    id: "h4",
    name: "City Care Specialty Clinics",
    latitude: 9.04,
    longitude: 38.73,
    initials: "CC",
    website: "citycare-clinics.com",
    distance: "5.0 miles",
    wait: "~20 mins",
    rating: "4.6 ★ (320)",
    status: "Slots Today",
    tags: ["Pediatrics", "Family Medicine"],
    iconBg: "bg-brand-alt",
    iconText: "text-brand-heading",
    location: "Addis Ababa, Megenagna",
    phone: "+251 11 456 7890",
  },
];

export const SPECIALTY_FILTERS = [
  "All Specialties",
  "Cardiology",
  "General Medicine",
  "Emergency & Trauma",
  "Pediatrics",
];

export const BOOKING_TIMES = [
  "09:30 AM – 10:15 AM",
  "11:00 AM – 11:45 AM",
  "02:00 PM – 02:45 PM",
  "04:15 PM – 05:00 PM",
];

export type Appointment = {
  id: string;
  doctor: string;
  initials: string;
  facility: string;
  date: string;
  time: string;
  type: "In-Person" | "Video";
  status: "Upcoming" | "Completed" | "Cancelled";
};

export const APPOINTMENTS: Appointment[] = [
  {
    id: "a1",
    doctor: "Dr. Marcus Vance",
    initials: "MV",
    facility: "Apex Heart & Health Institute · Cardiology",
    date: "Oct 15, 2026",
    time: "10:30 AM",
    type: "In-Person",
    status: "Upcoming",
  },
  {
    id: "a2",
    doctor: "Dr. Sarah Jenkins",
    initials: "SJ",
    facility: "ENDOD Secure Telehealth Video Room",
    date: "Oct 18, 2026",
    time: "2:00 PM",
    type: "Video",
    status: "Upcoming",
  },
  {
    id: "a3",
    doctor: "Dr. Elena Rodriguez",
    initials: "ER",
    facility: "Boston General Hospital · Internal Medicine",
    date: "Sep 28, 2026",
    time: "9:15 AM",
    type: "In-Person",
    status: "Completed",
  },
  {
    id: "a4",
    doctor: "Dr. James Park",
    initials: "JP",
    facility: "Cambridge Medical Center · Dermatology",
    date: "Aug 30, 2026",
    time: "3:00 PM",
    type: "In-Person",
    status: "Cancelled",
  },
];

export type MedicalRecord = {
  id: string;
  date: string;
  time: string;
  hospital: string;
  specialty: string;
  diagnosis: string;
  medication: string;
  followup: string;
};

export const MEDICAL_RECORDS: MedicalRecord[] = [
  {
    id: "r1",
    date: "Aug 24, 2026",
    time: "9:00 AM",
    hospital: "Apex Heart & Health Institute",
    specialty: "Cardiology Center",
    diagnosis: "Chest Discomfort",
    medication: "Atorvastatin 20mg",
    followup: "Follow-up in 7 days",
  },
  {
    id: "r2",
    date: "May 19, 2026",
    time: "8:00 AM",
    hospital: "City Care Diagnostics Center",
    specialty: "Diagnostic Lab",
    diagnosis: "Blood Panel Screening",
    medication: "None",
    followup: "No follow-up",
  },
  {
    id: "r3",
    date: "Jan 14, 2026",
    time: "10:00 AM",
    hospital: "Walgreens Pharmacy #4102",
    specialty: "Prescription Refill",
    diagnosis: "Hypertension",
    medication: "Lisinopril 10mg",
    followup: "—",
  },
];

export type Notification = {
  id: string;
  title: string;
  message: string;
  time: string;
  kind: "appointment" | "lab" | "medication" | "payment";
  action?: string;
  unread: boolean;
};

export const NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "Upcoming appointment reminder",
    message: "Dr. Marcus Vance tomorrow at 10:30 AM — Apex Heart & Health Institute.",
    time: "2 hours ago",
    kind: "appointment",
    action: "View in Appointments",
    unread: true,
  },
  {
    id: "n2",
    title: "Lab results available",
    message: "Your blood panel screening from City Care Diagnostics is ready to view.",
    time: "Yesterday",
    kind: "lab",
    action: "View Records",
    unread: true,
  },
  {
    id: "n3",
    title: "Medication refill due",
    message: "Atorvastatin 20mg — 3 days of supply remaining. Refill at Walgreens #4102.",
    time: "2 days ago",
    kind: "medication",
    unread: false,
  },
  {
    id: "n4",
    title: "Payment receipt",
    message: "Copay of $45.00 for your Aug 24 cardiology visit has been processed.",
    time: "1 week ago",
    kind: "payment",
    unread: false,
  },
];

export const DEFAULT_PROFILE = {
  firstName: "Daniel",
  middleName: "James",
  lastName: "Everett",
  email: "daniel.everett@healthmail.com",
  phone: "+251911234567",
  patientId: "DE482731",
  address: "742 Evergreen Terrace",
  city: "Addis Ababa",
  stateRegion: "Addis Ababa",
  zipcode: "1000",
  country: "ET",
};

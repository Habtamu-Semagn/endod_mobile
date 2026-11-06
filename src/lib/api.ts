export class ApiError extends Error {
  constructor(message: string, readonly status: number = 0, readonly details?: unknown) {
    super(message);
  }
}

const MOCK_APPOINTMENTS = [
  {
    appointment_id: "a1",
    appointment_type: "consultation",
    scheduled_at: new Date(Date.now() + 86400000).toISOString(),
    duration_minutes: 30,
    status: "SCHEDULED",
    location: "Apex Heart & Health Institute",
    meeting_url: null,
    visit_mode: "in_person",
    department: "cardiology",
    time_window: "exact",
    facility: { id: "h1", name: "Apex Heart & Health Institute" },
    provider_name: "Dr. Marcus Vance",
    notes: null,
    timezone: "UTC",
    hospital_booking: null,
  },
  {
    appointment_id: "a2",
    appointment_type: "consultation",
    scheduled_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    duration_minutes: 30,
    status: "SCHEDULED",
    location: null,
    meeting_url: "https://meet.example.com/abc",
    visit_mode: "telehealth",
    department: "general_medicine",
    time_window: "morning",
    facility: { id: "h2", name: "ENDOD Secure Telehealth" },
    provider_name: "Dr. Sarah Jenkins",
    notes: null,
    timezone: "UTC",
    hospital_booking: null,
  },
];

export async function api<T = any>(path: string, options: any = {}): Promise<T> {
  const p = path.replace(/^\/+/, "");
  if (p === "users/me/appointments") {
    return MOCK_APPOINTMENTS as T;
  }
  if (p === "users/me/payments/status") {
    return { online_payments: false, checkout_origins: [] } as T;
  }
  if (p.startsWith("users/me/appointments/") && p.endsWith("/reschedule")) {
    return {} as T;
  }
  if (p.startsWith("users/me/appointments/") && p.endsWith("/status")) {
    return {} as T;
  }
  if (p.startsWith("users/me/booking-payments/")) {
    return { tx_ref: "", status: "pending", appointment: MOCK_APPOINTMENTS[0] } as T;
  }
  if (p === "users/me/inbox") {
    return {
      items: [
        {
          id: "n1",
          category: "appointments",
          kind: "reminder",
          title: "Upcoming appointment reminder",
          body: "Dr. Marcus Vance tomorrow at 10:30 AM — Apex Heart & Health Institute.",
          link: { screen: "appointment", id: "a1" },
          created_at: new Date().toISOString(),
          read: false,
        },
      ],
      next_cursor: null,
      unread_count: 1,
      unread_by_category: { appointments: 1, records: 0, messages: 0, security: 0 },
    } as T;
  }
  if (p.startsWith("users/me/inbox/") && p.endsWith("/read")) {
    return {} as T;
  }
  if (p.startsWith("users/me/inbox/") ) {
    return {} as T;
  }
  if (p === "users/me/inbox/read-all") {
    return {} as T;
  }
    if (p === "users/me/queue") {
      return {
        entries: [
          {
            entry_id: "q1",
            hospital_id: "h1",
            hospital_name: "Apex Heart & Health Institute",
            doctor_name: "Dr. Marcus Vance",
            day: new Date().toISOString().slice(0, 10),
            ticket: 12,
            status: "waiting",
            ahead: 3,
            position: 4,
            updated_at: new Date().toISOString(),
          },
          {
            entry_id: "q2",
            hospital_id: "h2",
            hospital_name: "ENDOD Secure Telehealth",
            doctor_name: "Dr. Sarah Jenkins",
            day: new Date().toISOString().slice(0, 10),
            ticket: 7,
            status: "waiting",
            ahead: 1,
            position: 2,
            updated_at: new Date().toISOString(),
          },
        ],
      } as T;
    }
  if (p === "users/me/history") {
    return {
      items: [
        {
          id: "r1",
          kind: "hospital",
          category: "visit_note",
          title: "Cardiology follow-up",
          hospital_id: "h1",
          hospital_name: "Apex Heart & Health Institute",
          occurred_at: new Date().toISOString(),
          recorded_by: "Dr. Marcus Vance",
          verified: true,
          source: null,
          visit_id: null,
          details: {},
          files: [],
        },
      ],
      summary: { total: 1, verified: 1, self_reported: 0, hospitals: 1, by_category: {} },
    } as T;
  }
  if (p === "users/me/shares") {
    return { shares: [] } as T;
  }
  if (p === "users/me/follow-ups") {
    return { follow_ups: [] } as T;
  }
  if (p === "users/me") {
    return {
      dedan_user_id: "DE482731",
      first_name: "Daniel",
      middle_name: "",
      last_name: "Everett",
      display_name: "Daniel Everett",
      email: "daniel.everett@healthmail.com",
      phone: "+251911234567",
      phone_verified: true,
      address_line: "742 Evergreen Terrace",
      city: "Addis Ababa",
      region: "Addis Ababa",
      postal_code: "1000",
      country_code: "ET",
      preferences: { email_notifications: true, sms_notifications: true, care_search_radius_km: 15 },
      consent: { treatment_processing: true, data_sharing_with_clinicians: true },
      created_at: new Date().toISOString(),
    } as T;
  }
  if (p === "users/me/health-profile") {
    return { blood_type: "O+", allergies: ["Penicillin"], emergency_contact_name: "Jane Everett", emergency_contact_phone: "+251911234568" } as T;
  }
  if (p === "users/me/consent" || p === "users/me/preferences") {
    return {} as T;
  }
  if (p === "users/me/bills") {
    return {
      items: [
        {
          id: "b1",
          hospital_name: "Apex Heart & Health Institute",
          items: [
            { category: "consultation", name: "Cardiology consultation", amount: 150000, quantity: 1 },
            { category: "lab", name: "ECG", amount: 50000, quantity: 1 },
          ],
          subtotal: 200000,
          service_fee: 5000,
          total: 205000,
          currency: "ETB",
          status: "open",
          paid_at: null,
          created_at: new Date().toISOString(),
        },
      ],
      open_total: 205000,
      currency: "ETB",
    } as T;
  }
  return {} as T;
}

export function redirectToLogin() {}
export async function logout() {}
export function passwordProblem(password: string) { return null; }
export function safeNext(next: string | null, fallback: string) { return fallback; }

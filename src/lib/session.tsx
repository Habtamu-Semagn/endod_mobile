import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_PROFILE } from "./data";
import { useRouter } from "expo-router";
import { api, setAuthToken, setOnUnauthorized, ensureTokenLoaded, getAuthToken } from "./api";
import { unregisterPush } from "./push";

export type Session = {
  phone: string;
  token: string | null;
  firstName: string;
  middleName: string;
  lastName: string;
  lookingFor: string[];
  sex: string;
  ageRange: string;
  onboarded: boolean;
};

type SessionValue = {
  session: Session | null;
  signIn: (phone: string, token?: string | null) => void;
  beginSignUp: (phone: string) => void;
  completeOnboarding: (data: {
    firstName: string;
    middleName: string;
    lastName: string;
    lookingFor: string[];
    sex: string;
    ageRange: string;
  }, token?: string | null) => void;
  updateProfile: (data: Partial<Pick<Session, "firstName" | "lastName">>) => void;
  signOut: () => void;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    setOnUnauthorized(() => {
      setSession(null);
      setAuthToken(null);
      router.replace("/login");
    });
    return () => setOnUnauthorized(null);
  }, [router]);

  // Restore session from a persisted token so users stay logged in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureTokenLoaded();
      if (!getAuthToken()) return;
      try {
        const data = await api<{ profile: any }>("/auth/session");
        const p = data?.profile;
        if (cancelled || !p) return;
        setSession({
          phone: p.phone ?? "",
          token: getAuthToken(),
          firstName: p.first_name ?? "",
          middleName: p.middle_name ?? "",
          lastName: p.last_name ?? "",
          lookingFor: [],
          sex: "",
          ageRange: "",
          onboarded: p.onboarding_complete ?? true,
        });
      } catch {
        setAuthToken(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback((phone: string, token: string | null = null) => {
    if (token) setAuthToken(token);
    setSession({
      phone,
      token,
      firstName: DEFAULT_PROFILE.firstName,
      middleName: "",
      lastName: DEFAULT_PROFILE.lastName,
      lookingFor: [],
      sex: "",
      ageRange: "",
      onboarded: true,
    });
  }, []);

  const beginSignUp = useCallback((phone: string) => {
    // Session is only committed after onboarding completes; the auth flow
    // screens pass the phone along via route params.
    setSession((prev) =>
      prev
        ? prev
        : {
            phone,
            token: null,
            firstName: "",
            middleName: "",
            lastName: "",
            lookingFor: [],
            sex: "",
            ageRange: "",
            onboarded: false,
          },
    );
  }, []);

  const completeOnboarding = useCallback(
    (data: {
      firstName: string;
      middleName: string;
      lastName: string;
      lookingFor: string[];
      sex: string;
      ageRange: string;
    }, token: string | null = null) => {
      if (token) setAuthToken(token);
      setSession((prev) => ({
        phone: prev?.phone ?? "",
        token: token ?? prev?.token ?? null,
        ...data,
        onboarded: true,
      }));
    },
    [],
  );

  const updateProfile = useCallback(
    (data: Partial<Pick<Session, "firstName" | "lastName">>) => {
      setSession((prev) => (prev ? { ...prev, ...data } : prev));
    },
    [],
  );

  // The phone stops getting this account's pushes (the request leaves before the token is cleared).
  const signOut = useCallback(() => { void unregisterPush(); setAuthToken(null); setSession(null); }, []);

  const value = useMemo(
    () => ({ session, signIn, beginSignUp, completeOnboarding, updateProfile, signOut }),
    [session, signIn, beginSignUp, completeOnboarding, updateProfile, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

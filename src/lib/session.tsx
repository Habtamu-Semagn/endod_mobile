import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_PROFILE } from "./data";
import { setAuthToken } from "./api";

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
  const [session, setSession] = useState<Session | null>(null);

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

  const signOut = useCallback(() => { setAuthToken(null); setSession(null); }, []);

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

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Text, View } from "react-native";

type ToastValue = {
  showToast: (title: string, message?: string) => void;
};

const ToastContext = createContext<ToastValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((title: string, message = "") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ title, message });
    timer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          className="absolute top-12 left-4 right-4 z-50 bg-slate-900 rounded-2xl px-4 py-3 shadow-lg"
        >
          <Text className="text-white font-bold text-sm">{toast.title}</Text>
          {toast.message ? (
            <Text className="text-slate-300 text-xs mt-0.5">{toast.message}</Text>
          ) : null}
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

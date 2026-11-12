import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { useSession } from "../lib/session";
import { useI18n } from "../lib/i18n";
import { listenForPushes, pushRoute, registerForPush } from "../lib/push";

/**
 * Connects push notifications to the session: registers the phone once the
 * patient is signed in (and again when the app's language changes, so pushes
 * come in that language), and opens the right screen when a push is tapped.
 */
export function PushBridge() {
  const router = useRouter();
  const { session } = useSession();
  const { language } = useI18n();
  const signedIn = Boolean(session?.token);
  const asked = useRef(false);

  useEffect(() => {
    if (!signedIn) {
      asked.current = false;
      return;
    }
    // The permission is asked once per sign-in; a language change only refreshes.
    void registerForPush(language, !asked.current);
    asked.current = true;
  }, [signedIn, language]);

  useEffect(() => (signedIn ? listenForPushes() : undefined), [signedIn]);

  // A tapped push, including the one that opened the app.
  const response = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!signedIn || !response) return;
    const id = response.notification.request.identifier;
    if (handled.current === id) return;
    handled.current = id;
    router.push(pushRoute(response.notification.request.content.data) as never);
  }, [response, signedIn, router]);

  return null;
}

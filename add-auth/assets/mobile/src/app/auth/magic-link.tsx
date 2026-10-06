import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';

/** Opened from the sign-in email: verifies the token and stores the session. */
export default function MagicLinkScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [failed, setFailed] = useState(!token);

  useEffect(() => {
    if (!token) return;
    authClient.magicLink.verify({ query: { token } }).then(({ data, error }) => {
      // A used or expired token redirects to a web page instead of returning an error.
      if (error || !data || typeof data !== 'object' || !('session' in data)) return setFailed(true);
      router.replace('/');
    });
  }, [token]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.content}>
        {failed ? (
          <>
            <ThemedText type="subtitle">הקישור פג או שכבר השתמשתם בו</ThemedText>
            <Link href="/sign-in" replace>
              <ThemedText type="linkPrimary">בקשו קישור חדש</ThemedText>
            </Link>
          </>
        ) : (
          <ThemedText>מתחברים…</ThemedText>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: Spacing.four, gap: Spacing.three },
});

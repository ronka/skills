import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';

/** Account block for the settings screen: sign in, or sign out and delete the account. */
export function AccountSection() {
  const { data: session } = authClient.useSession();
  const [message, setMessage] = useState<string | null>(null);

  function confirmDelete() {
    Alert.alert('מחיקת החשבון', 'למחוק את החשבון וכל המידע שלו? אי אפשר לבטל את זה.', [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחיקה',
        style: 'destructive',
        onPress: async () => {
          const { error } = await authClient.deleteUser();
          if (!error) return authClient.signOut();
          // Deleting needs a recent sign-in. Older sessions sign in again first.
          setMessage(
            error.code === 'SESSION_EXPIRED'
              ? 'מטעמי אבטחה, התנתקו, התחברו מחדש ונסו שוב.'
              : 'לא הצלחנו למחוק את החשבון. נסו שוב.',
          );
        },
      },
    ]);
  }

  return (
    <ThemedView style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        חשבון
      </ThemedText>
      {session ? (
        <>
          <ThemedText>
            מחוברים בתור <ThemedText type="code">{session.user.email}</ThemedText>
          </ThemedText>
          <Pressable accessibilityRole="button" onPress={() => authClient.signOut()}>
            <ThemedText type="linkPrimary">התנתקות</ThemedText>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={confirmDelete}>
            <ThemedText type="link">מחיקת החשבון</ThemedText>
          </Pressable>
          {message ? <ThemedText accessibilityRole="alert">{message}</ThemedText> : null}
        </>
      ) : (
        <Link href="/sign-in">
          <ThemedText type="linkPrimary">התחברות</ThemedText>
        </Link>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
});

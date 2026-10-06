import { useState } from 'react';
import { Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { authClient } from '@/lib/auth-client';
import { rtlTextAlign } from '@/utils/rtl';

export default function SignInScreen() {
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function sendLink() {
    setState('sending');
    const { error } = await authClient.signIn.magicLink({
      email: email.trim(),
      // The Expo plugin turns this into the app's own deep link.
      callbackURL: '/auth/magic-link',
    });
    setState(error ? 'error' : 'sent');
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.content}>
        <ThemedText type="title">התחברות</ThemedText>
        <ThemedText themeColor="textSecondary">הזינו אימייל ונשלח לכם קישור כניסה. אין צורך בסיסמה.</ThemedText>
        <TextInput
          accessibilityLabel="אימייל"
          autoCapitalize="none"
          autoComplete="email"
          inputMode="email"
          keyboardType="email-address"
          onChangeText={setEmail}
          onSubmitEditing={sendLink}
          placeholder="name@example.com"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { borderColor: theme.backgroundSelected, color: theme.text }]}
          textAlign={rtlTextAlign.start}
          value={email}
        />
        <Pressable
          accessibilityRole="button"
          disabled={state === 'sending' || !email.trim()}
          onPress={sendLink}
          style={[styles.button, { backgroundColor: theme.primary, opacity: state === 'sending' ? 0.6 : 1 }]}>
          <ThemedText type="smallBold" style={styles.buttonText}>
            {state === 'sending' ? 'שולחים…' : 'שלחו לי קישור כניסה'}
          </ThemedText>
        </Pressable>
        {state === 'sent' ? (
          <ThemedText accessibilityRole="alert">שלחנו קישור. פתחו את המייל בטלפון הזה ולחצו עליו.</ThemedText>
        ) : null}
        {state === 'error' ? (
          <ThemedText accessibilityRole="alert">לא הצלחנו לשלוח את הקישור. נסו שוב בעוד דקה.</ThemedText>
        ) : null}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    fontSize: 17,
  },
  button: {
    borderRadius: 999,
    padding: Spacing.three,
    alignItems: 'center',
  },
  buttonText: { color: '#FFFFFF' },
});

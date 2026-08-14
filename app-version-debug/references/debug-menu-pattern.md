# Debug Menu Pattern

Hidden debug menu, revealed by tapping the app version row 3 times within 500ms.

## Required components

### 1. Version string

```tsx
import Constants from 'expo-constants';

const UPDATE_VERSION = 14; // bumped by scripts/increment-update-version.js

const appVersion = (Constants.expoConfig?.version ?? '1.0.0') + '-' + UPDATE_VERSION;
```

Display format: `1.0.3-14` — marketing version from `app.json`, dash, OTA counter. See
[version-counter.md](version-counter.md) for who owns each half.

### 2. Triple-tap handler

Refs, not state — a re-render per tap would be visible on the row and is unnecessary.

```tsx
const tapCountRef = useRef(0);
const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

useEffect(() => {
  return () => {
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
  };
}, []);

const handleVersionPress = useCallback(() => {
  tapCountRef.current += 1;
  if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);
  if (tapCountRef.current >= 3) {
    tapCountRef.current = 0;
    showDebugOptions();
    return;
  }
  tapTimeoutRef.current = setTimeout(() => {
    tapCountRef.current = 0;
  }, 500);
}, [showDebugOptions]);
```

The cleanup in `useEffect` is not optional — navigating away mid-sequence otherwise leaves a timer
holding a stale closure.

### 3. Debug menu alert

```tsx
const showDebugOptions = useCallback(() => {
  track(EVENTS.DEBUG_MENU_OPENED); // `track` = whatever analytics wrapper the project already uses
  Alert.alert(
    'Debug Options',
    'Developer-only actions',
    [
      // Label reflects current state, so the menu doubles as a read-out.
      {
        text: devMode ? 'Dev mode: turn OFF' : 'Dev mode: turn ON',
        onPress: () => {
          track(EVENTS.DEV_MODE_TOGGLED, { active: !devMode });
          setDevMode(!devMode);
        },
      },
      // Counts in the label save a round-trip to a separate diagnostics view.
      {
        text: `Grant 20 credits (have ${credits ?? 0})`,
        onPress: () => grantCredits(20),
      },
      {
        text: 'Reset first-run hints',
        onPress: () => { resetAllHints().catch(() => {}); },
      },
      // Destructive entries get style: 'destructive' and usually leave the screen.
      {
        text: 'Force failure state (test recovery flow)',
        style: 'destructive',
        onPress: () => {
          devForceFailure();
          router.back();
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ],
    { cancelable: true },
  );
}, [devMode, setDevMode, credits, grantCredits, devForceFailure, router]);
```

Two patterns worth keeping when adding options:

- **Labels carry state.** `Dev mode: turn OFF`, `Grant 20 credits (have 3)` — the menu reports the
  current value as well as offering the action, which removes the need for a diagnostics screen.
- **Opening the menu is tracked.** One analytics event on open tells you if the menu is being
  discovered accidentally by real users. Individual destructive actions are worth tracking too.

An `Alert` holds a handful of options comfortably. Past roughly eight, or when an option needs
copyable output, render a dedicated debug screen instead — Alert bodies truncate and cannot be
selected.

### 4. Touchable version row

`Pressable`, with an `accessibilityRole` — the row is a real control even though its behaviour is
hidden.

```tsx
<Pressable onPress={handleVersionPress} accessibilityRole="button">
  <View style={styles.row}>
    <Text>Version</Text>
    <Text style={styles.secondary}>{appVersion}</Text>
  </View>
</Pressable>
```

Do not label the row "tap 3 times" or add a visual affordance. The point of the row is that it looks
inert to users and is muscle memory for the developer.

## Optional: expo-updates diagnostics

Only if the project actually needs them — a manual OTA fetch button, or a dump of update metadata
for a support conversation. Neither is required for the counter to be useful, and a project whose
`update` posture is "check on load, blocking" (see SKILL.md) usually needs neither.

```tsx
import * as Updates from 'expo-updates';

const downloadAndReloadUpdate = useCallback(async () => {
  if (!Updates.isEnabled) {
    Alert.alert('Update', 'Updates are disabled in this build.');
    return;
  }
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) {
      Alert.alert('Update', 'No update available.');
      return;
    }
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
  } catch (e) {
    Alert.alert('Update', String(e));
  }
}, []);
```

The `Updates.isEnabled` guard matters — without it this silently no-ops in Expo Go and development
builds, which is exactly where it gets tested.

If you dump update metadata, expect nulls as the normal case, not the edge case:

| Field | `null` / `false` when |
| --- | --- |
| `Updates.channel` | Expo Go and development builds — they are not pinned to a channel |
| `Updates.updateId`, `Updates.createdAt` | the embedded bundle is running, i.e. every fresh install |
| `Updates.isEnabled` | Expo Go, and any build with updates disabled |

## Dependencies

- `expo-constants` for the version half of the string
- `react-native` `Alert` and `Pressable`
- `expo-router` if any option navigates to a debug screen
- `expo-updates` only if the optional section above is used

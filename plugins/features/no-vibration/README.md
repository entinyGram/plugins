# no vibration (deprecated)

**deprecated: no longer maintained, no more releases.** it keeps working as is.

| | |
| :--- | :--- |
| id | `entinygram.no-vibration` |
| version | `1.2.0` |
| status | deprecated |
| grants | `unsafe.jvm`, `unsafe.xposed` |

## settings

page: `Settings → Plugins → No Vibration`. all three are on by default.

| switch | blocks |
| :--- | :--- |
| haptics | `View.performHapticFeedback` |
| vibration | every `Vibrator.vibrate` |
| notifications | `Notification.Builder.setVibrate/setDefaults`, `NotificationChannel.enableVibration/setVibrationPattern` |

android keeps the vibration of notification channels that already exist, reset them in the app's notification settings if they still vibrate.

## credits

based on **No Vibration** by [@akresik](https://t.me/akresik): the hook list is his, entinyGram added the switches and translations.

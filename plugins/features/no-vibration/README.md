# No Vibration

Turns off the vibration the app can ask for, with a switch for each kind: haptic feedback, vibrator calls (calls and everything that asks the vibrator directly) and vibration on notifications and notification channels.

`entinygram.no-vibration` · version `1.0.0` · requires `entinygram.sdk >=0.1.0-alpha`

The switches are in **Settings → Behavior → Device**. All three are on by default.

Hooks `View.performHapticFeedback`, every `Vibrator.vibrate`, `Notification.Builder.setVibrate/setDefaults` and `NotificationChannel.enableVibration/setVibrationPattern`. Android keeps the vibration of a notification channel that already exists, so channels created before the plugin was installed may still vibrate until they are reset in the app's notification settings.

## Credits

Based on **No Vibration** by [@akresik](https://t.me/akresik). The list of hooks comes from that plugin; entinyGram added the switches, the SDK placement and the translations.

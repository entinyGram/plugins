# No Vibration

Turns off every vibration the app can ask for: haptic feedback, `Vibrator` calls and vibration on notifications and notification channels.

`no-vibration` · version `1.0.0` · by [@akresik](https://t.me/akresik) · needs no other plugin

Hooks `View.performHapticFeedback`, every `Vibrator.vibrate`, `Notification.Builder.setVibrate/setDefaults` and `NotificationChannel.enableVibration/setVibrationPattern`. Android keeps the vibration of a notification channel that already exists, so channels created before the plugin was installed may still vibrate until they are reset in the app's notification settings.

## Credits

Written by **@akresik**. entinyGram ships it in its plugin repository and keeps the author's name on it; changes are listed in `CHANGELOG.md`.

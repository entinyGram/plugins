# Changelog

## 1.1.0
- The plugin page shows a sample rendered with the pattern the profile "registration date" row uses, so profile dates can be checked without opening a profile
- Registration, join and birthday dates in the profile follow the chosen calendar: they are formatted by the same app formatter the plugin rewrites
- Each hook now registers on its own, so one method missing from an app build no longer disables the rest; the page lists what could not be hooked

## 1.0.0
- Initial release: dates that carry a month or a year are reformatted with the selected ICU calendar
- Hijri (qamari, civil, Umm al-Qura), Persian, Indian, Hebrew, Buddhist, Japanese, ROC, Coptic and Ethiopic systems
- Calendar picker embedded into Settings → Behavior & Tools → Formatting

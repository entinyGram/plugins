# Call avatar

## 1.1

- Replace the catalog icon with the supplied phone handset and signal arcs SVG.
- Translate settings and compatibility messages into Ukrainian, English and Russian using the application language, with English fallback.
- Extend mocked lifecycle regressions to all three languages and test language selection/fallback.

## 1.0

- Full-screen caller avatar for voice calls with a dark scrim and raised name/status text.
- Persistent display modes: always, before answer, or after connection is established.
- Semi-transparent dark backgrounds for inactive call buttons; selected and hangup buttons keep their native appearance.
- Restore the native UI for video calls, unavailable photos, disabled display windows, and plugin unload.
- Use public Android handler APIs and Java-thread drawing hooks; add mocked lifecycle regression tests.
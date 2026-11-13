# call avatar

full-screen caller photo instead of the round avatar in voice calls.

| | |
| :--- | :--- |
| id | `entinygram.call-avatar` |
| version | `1.2.0` |
| status | active |
| grants | `unsafe.jvm`, `unsafe.xposed` |

## highlights

- [behavior](#behavior)
- [settings](#settings)
- [check](#check)

## behavior

- the photo is the big avatar from the app's `ImageLoader`, cropped to fill the screen, with a 40% dim
- name and status sit at the top, 72 dp below the system inset
- inactive buttons get a translucent black background, active white buttons and the red end button stay stock
- any camera turns the stock look back, so does a missing or privacy-hidden photo

## settings

page: `Settings → Plugins → Call avatar`. on by default.

| photo mode | shows the photo |
| :--- | :--- |
| always (default) | the whole call |
| until answered | before the connection is made |
| after answered | after the connection is made |

answered means connected, a reconnect does not reset it. ui and messages: uk, en, ru, other languages use en.

## check

```sh
bun install --ignore-scripts
bun run inu check --config plugins/features/call-avatar/inu.config.ts
bun run inu build --config plugins/features/call-avatar/inu.config.ts
bun test plugins/features/call-avatar/tests
```

the plugin depends on the fields and methods of `org.telegram.ui.VoIPFragment` in the current entinyGram. tests do not replace a check on android: incoming and outgoing call, no photo, switch to video and back, rotation, minimize and reopen, the key emoji panel, the switch off, unloading during a call.

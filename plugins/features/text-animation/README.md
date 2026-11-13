# text animation (deprecated)

**deprecated: no longer maintained, no more releases.** it keeps working as is.

animated typing and deleting in the message input.

| | |
| :--- | :--- |
| id | `entinygram.text-animation` |
| version | `1.2.0` |
| status | deprecated |
| grants | `unsafe.jvm`, `unsafe.xposed` |

## highlights

- [typing](#typing): letters animate as they appear
- [deleting](#deleting): ghost fade and six particle styles
- [how it works](#how-it-works)

## typing

page: `Settings → Plugins → Text animation`.

| option | range |
| :--- | :--- |
| enable | on or off |
| duration | 100 to 400 ms |
| wave delay | stagger for fast typing |
| slide distance | entry trajectory |
| blur, scale, rotation | per-letter filters |

## deleting

| style | look |
| :--- | :--- |
| `Dust` | fading particles with air resistance |
| `Sparks` | glowing sparks bursting out |
| `Snow` | falling flakes with sway |
| `Sakura` | petals drifting down |
| `Letters` | mini glyphs dissipating |
| `Fall` | particles tumbling down the input |

particle count and lifetime are adjustable.

## how it works

| part | mechanism |
| :--- | :--- |
| tracking | a `TextWatcher` finds typed ranges and deleted positions |
| drawing | a hook on `EditTextBoldCursor.onDraw(Canvas)` draws glyphs and particles before the cursor |

needs a device where the engine's hook layer is active.

## build

```sh
bun inu build
bun inu push
```

# custom marks

your own text for the "edited" and "deleted" marks on messages.

| | |
| :--- | :--- |
| id | `entinygram.custom-marks` |
| version | `1.0.0` |
| status | active |
| grants | `unsafe.jvm`, `unsafe.xposed` |

## settings

page: `Settings → Plugins → Custom marks`. an empty field keeps the default text.

| row | replaces |
| :--- | :--- |
| edited mark | the "edited" label before the time in a bubble |
| deleted mark | the deleted mark text, shown when the deleted mark style is "text" |

changes apply to messages drawn after the change, reopen the chat.

## how it works

every `LocaleController.getString` form ends in `getStringInternal(key, res)`. a routine hooks it and returns your text for the `EditedMessage` and `InuDeletedMarkText` strings, so no js runs while strings are read.

## build

```sh
bun inu build
bun inu push
```

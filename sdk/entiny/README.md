# entiny SDK

entinyGram layer over the Inugram plugin SDK. It adds no native API: everything is a manifest
directive the app reads, so a plugin built with it is still a plain Inugram plugin.

## Placing a settings page

Register a settings page as usual, and say where entinyGram should show it. There are three placement kinds, and they combine:

```ts
import { defineConfig } from '@inugram/cli'
import { withEntiny } from '@entiny/sdk'

export default defineConfig({
  plugins: {
    yandex: {
      entry: 'src/index.ts',
      manifest: withEntiny({ name: 'Yandex', author: 'you', version: '1.0.0' }, {
        // 1. Controls drawn into a section or beside an item:
        inline: [
          'behavior.formatting',
          { slot: 'translate-provider.end', rows: ['key'], when: 'translation-provider' },
        ],
        // 2. Check-rows become options in modal radio lists:
        choice: [
          { slot: 'behavior.map-preview-provider', rows: ['maps'] },
        ],
        // 3. A row that opens the whole page as a separate screen:
        screen: ['root.root-system'],
      }),
    },
  },
})
```

This writes `@entiny-inline`, `@entiny-choice` and `@entiny-menu` lines into the plugin header.

- **inline**: the page's `check`, `button`, `select` and `slider` rows are drawn into the section or directly after/before an item. Headers and dividers are omitted.
- **choice**: check-rows of the page appear as options inside the target picker/radio dialog (e.g. `behavior.map-preview-provider`). Selecting the plugin option activates the check; selecting any stock option unchecks it.
- **screen**: a row with the plugin's name opens the page.

### Slots

- `<screen>.<section>`: the end of that section, before its divider (e.g. `behavior.formatting`).
- `<screen>.<section>.start`: at the very top of that section, right after the header.
- `<screen>.<item>.after` / `<screen>.<item>`: directly after that setting row.
- `<screen>.<item>.before`: directly before that setting row.
- `<screen>.<item>.replace`: replaces that setting row.
- `<screen>.<button>` (in `choice`): adds an option into the radio/modal picker opened by that button.
- `<screen>.end`: a section of its own at the bottom of the screen.
- `root` is the settings root (`root.root-interface`, `root.root-privacy`, `root.root-system`).

Every screen, section, item, and choice slot is listed in [slots.json](slots.json) and typed as `EntinySlot` and `ChoiceSlot` ([src/slots.ts](src/slots.ts)). They are a snapshot: the SDK plugin finds screens and slots by itself while the app runs, so a slot that is not in the list still works if the section or row exists.

### Security and Limits

To prevent UI spoofing:
- **Limits**: maximum 4 inline rows per plugin per slot; maximum 2 choice options per plugin per picker list.
- **Attribution**: every inline control and choice option displays clear visual attribution of the source plugin.
- **Isolation**: callbacks route strictly to the plugin's registered events.

### On plain Inugram

Unknown header directives are ignored by Inugram, and `inu.registerSettings` still works there, so the
plugin installs and its page opens from the plugin list. Only the placement is entinyGram-only.

## Placing rows from code: `@entiny/sdk/embed`

The manifest directives above are read by the app. The SDK plugin also embeds rows **by itself**, with no code in the
app: it hooks the base class of every settings screen (`UniversalFragment`, so Inugram's, ours and any other screen built
on it) and adds the rows other plugins ask for. A plugin asks through `embed`:

```ts
import { embed } from '@entiny/sdk/embed'

let on = false

embed({
  id: 'entinygram.my-plugin',
  name: 'My plugin',
  placements: {
    screen: ['root.root-system'],                                     // a row that opens the plugin's page
    inline: [{ slot: 'behavior.formatting', rows: ['switch'] }],      // controls drawn into a section
  },
  rows: slot => [{ id: 'switch', type: 'check', text: 'Do the thing', checked: on }],
  onEvent: (row, value) => { if (row === 'switch') on = value === 'true' },
  open: () => inu.ui.openPage(page),
})
```

- A **slot** is `<screen>.<name>`: the screen is the class name in kebab case without `Settings`/`Activity`
  (`behavior`, `category-chats`, `root`), the name is a string resource without the `Inu` prefix (`formatting`).
  Add `.start`, `.end`, `.before`, `.after` or `.replace`. The engine reads the strings of the running app, so a new
  row or section of the app is a slot as soon as it exists; [`slots.json`](slots.json) is only the typed list.
- Rows are `check`, `button` or `select`; each can carry `subtitle`, `value` and `danger`. `rows(slot)` is called every
  time the screen is built, `onEvent(rowId, value)` on a tap (a check passes `'true'` or `'false'`, a select the chosen
  index, a button `''`).
- **Picker options.** To add an option to one of the app's pickers (a radio list or menu opened from a settings row,
  like *Map preview provider*), list the picker's slot in `placements.choice` and answer `choices(slot)`:

  ```ts
  embed({
    id: 'entinygram.my-maps',
    name: 'My maps',
    placements: { choice: ['behavior.map-preview-provider'] },
    rows: () => [],
    onEvent: () => {},
    choices: () => [{ id: 'maps', title: 'My maps', subtitle: 'Previews from my service', checked: on }],
    onChoice: (id, picked) => { on = picked; embedChanged() },
  })
  ```

  The option appears as `My maps (My plugin)`. Picking it calls `onChoice(id, true)` and tells every other plugin option
  of the same picker `false`; picking one of the app's own options tells all of them `false`. The row that opens the
  picker shows the chosen plugin option as its value. Up to 2 options per plugin per picker.
- Limits: 4 rows per plugin per slot, and every row shows which plugin it comes from.
- Everything runs in the SDK plugin (`entinygram.sdk`, which needs `unsafe.jvm` and `unsafe.xposed`). Without it, or
  on a device where the hook layer does not start, nothing is embedded and the plugin keeps working on its own page.

## Everything else

The SDK adds no features of its own. A plugin that wants to change how the app behaves does it with the engine's own
hooks (`unsafe.jvm` and `unsafe.xposed`, ideally as routines, which run in Java on whatever thread calls them) and puts
its settings where they belong with the placements above. Translation providers need no hooks at all:
`inu.registerTranslationProvider` makes one, and it shows in Translator > Provider next to the built-in ones.

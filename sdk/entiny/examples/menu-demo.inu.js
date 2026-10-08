// ==InuPlugin==
// @name        Menu demo
// @author      entinyGram
// @version     1.0.0
// @entiny-menu behavior.formatting
// @entiny-menu root.root-system
// ==/InuPlugin==

inu.registerSettings(inu.ui.settingsPage({
  title: 'Menu demo',
  items: () => [
    inu.ui.header('entiny SDK'),
    inu.ui.button({ id: 'hello', text: 'Hello from a plugin', onClick: () => inu.ui.toast('hi') }),
  ],
}))

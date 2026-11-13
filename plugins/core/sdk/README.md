# entinyGram sdk plugin (deprecated)

`entinygram.sdk` · last version `0.5.1`

**deprecated. do not install it, no plugin needs it.**

| | |
| :--- | :--- |
| reason | too much responsibility: it hooked the settings screens and injected rows for other plugins, and plugins broke or got overloaded |
| replacement | each plugin registers its own page with `inu.registerSettings`; entinyGram manages plugins from its own settings |
| what to do | uninstall it; plugins from this repo work without it |
| sources | kept for reference only, no more releases |

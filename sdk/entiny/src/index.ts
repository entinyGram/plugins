import type { Manifest } from '@inugram/cli'
import type { ChoiceSlot, EntinySlot } from './slots.js'

export type { ChoiceSlot, EntinySlot } from './slots.js'
export { CHOICE_SLOTS, SLOTS } from './slots.js'

type Extra = NonNullable<Manifest['extra']>

/** the plugin that carries the SDK: the app honours the directives below only from plugins that require it */
export const SDK_ID = 'entinygram.sdk'
export const SDK_VERSION = '0.1.0-alpha'

/**
 * Adds `extra` to a manifest together with `@requires entinygram.sdk`, so the plugin cannot be installed or run
 * without the SDK plugin.
 */
function withSdk(manifest: Manifest, extra: Extra): Manifest {
  const existing = manifest.extra?.requires
  const requires = Array.isArray(existing) ? existing : existing ? [existing] : []
  const need = `${SDK_ID} >=${SDK_VERSION}`
  return {
    ...manifest,
    extra: { ...manifest.extra, ...extra, requires: requires.includes(need) ? requires : [...requires, need] },
  }
}

/**
 * Where the plugin's settings page (the one passed to `inu.registerSettings`) shows up in entinyGram.
 * All kinds can be combined and repeated.
 *
 * - `screen`: a row that opens the page as a screen of its own
 * - `inline`: the page's switches, pickers, buttons and sliders drawn directly into a section or beside an item
 * - `choice`: check-rows from the page become choice options in radio/modal picker lists
 */
/** controls of the page drawn into a section: all of them, or only the rows with the given ids */
export interface InlinePlacement {
  slot: EntinySlot
  /** ids of the rows to show, so one page can serve several places */
  rows?: string[]
  /** show them only while one of the plugin's translation providers is the chosen one */
  when?: 'translation-provider'
}

/** choice options in a radio/modal picker list: check-rows with the given ids become choices */
export interface ChoicePlacement {
  slot: ChoiceSlot
  /** ids of the check-rows to turn into choices in this list */
  rows?: string[]
}

export interface Placement {
  screen?: EntinySlot[]
  inline?: Array<EntinySlot | InlinePlacement>
  choice?: Array<ChoicePlacement>
}

export function entinyPlacement(placement: Placement): Extra {
  const extra: Extra = {}
  if (placement.screen?.length) extra['entiny-menu'] = placement.screen
  if (placement.inline?.length) {
    extra['entiny-inline'] = placement.inline.map((place) => {
      if (typeof place === 'string') return place
      return [place.slot, place.rows?.length ? `rows=${place.rows.join(',')}` : '', place.when ? `when=${place.when}` : '']
        .filter(Boolean).join(' ')
    })
  }
  if (placement.choice?.length) {
    extra['entiny-choice'] = placement.choice.map((c) => {
      return [c.slot, c.rows?.length ? `rows=${c.rows.join(',')}` : ''].filter(Boolean).join(' ')
    })
  }
  return extra
}

/** adds the placement to a manifest; the plugin still has to call `inu.registerSettings` */
export function withEntiny(manifest: Manifest, placement: Placement): Manifest {
  return withSdk(manifest, entinyPlacement(placement))
}

/** shorthand for a row that opens the page as a screen */
export function withEntinyMenu(manifest: Manifest, ...slots: EntinySlot[]): Manifest {
  return withEntiny(manifest, { screen: slots })
}

/** shorthand for controls drawn into a section or item position */
export function withEntinyInline(manifest: Manifest, ...slots: Array<EntinySlot | InlinePlacement>): Manifest {
  return withEntiny(manifest, { inline: slots })
}

/** shorthand for choice options in radio/modal pickers */
export function withEntinyChoice(manifest: Manifest, ...choices: ChoicePlacement[]): Manifest {
  return withEntiny(manifest, { choice: choices })
}

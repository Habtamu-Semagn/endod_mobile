/**
 * Single source of truth for the ENDOD visual language.
 *
 * The palette lives in `theme.json` so that the Tailwind config, the inline
 * styles and the native (Android) theme all read from the exact same values.
 * The reference build is the ZTE Blade V30 — every colour in the app comes
 * from that palette, so a Galaxy M12 renders the same screens in the same
 * colours instead of drifting towards the phone's own theme.
 *
 * Never hardcode a hex value in a screen. Use `COLORS.*` for inline styles and
 * the `brand-*` Tailwind tokens (`brand-bg`, `brand-surface`, `brand-alt`,
 * `brand-heading`, `brand-body`, `brand-muted`, `brand-primary`, `brand-accent`,
 * `brand-accent-deep`, `brand-danger`, `brand-danger-soft`, `brand-success`,
 * `brand-success-soft`, `brand-border`, `brand-on-dark`, `brand-on-dark-accent`)
 * for class names.
 */

import palette from "./theme.json";

export type Palette = {
  readonly [K in keyof typeof palette]: string;
};

/** The one and only palette of the app. */
export const COLORS: Palette = palette;

/**
 * Layout metrics that have to stay in sync across screens.
 *
 * The tab bar is a sibling of the screens inside the tab navigator, so it
 * already reserves the room for the system navigation bar through its own
 * bottom margin. Screens must therefore not add the bottom safe-area inset a
 * second time, otherwise the gap above the tab bar grows with the size of the
 * device's navigation bar and every phone renders differently.
 */
export const TAB_BAR_HEIGHT = 72;
export const TAB_BAR_MARGIN = 16;
/** Space a scrollable tab screen leaves below its content. */
export const TAB_CONTENT_PADDING = 32;
/** Standard horizontal page gutter. */
export const PAGE_GUTTER = 16;

/**
 * Width of the reference device (ZTE Blade V30) in dp.
 *
 * Phones report their width in dp and that number changes with the OEM's
 * "display size" setting — the Galaxy M12 hands out 360dp while the ZTE Blade
 * V30 hands out 393dp. Chrome is measured against this reference so both
 * phones end up with the same proportions.
 */
export const REFERENCE_WIDTH = 393;

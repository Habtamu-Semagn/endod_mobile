import { PixelRatio, useWindowDimensions } from "react-native";
import { REFERENCE_WIDTH } from "./theme";

/**
 * Rounds a dp value onto the device pixel grid.
 *
 * `useWindowDimensions().width` is a float on Android, so laying out with the
 * raw value leaves sub-pixel gaps that are rasterised differently depending on
 * the screen density. Rounding keeps edges crisp and identical across devices.
 */
export function px(value: number): number {
  return PixelRatio.roundToNearestPixel(value);
}

/**
 * Width of a full-bleed content block that leaves `gutter` dp on each side.
 */
export function useContentWidth(gutter = 32): number {
  const { width } = useWindowDimensions();
  return px(width - gutter);
}

/**
 * Width of a card measured against the reference device.
 *
 * A phone reports its width in dp and that number depends on the OEM's
 * "display size" setting, so the same 260dp card covers a very different share
 * of the screen from one phone to the next — it looked small on a Galaxy M12
 * while it was right on the reference ZTE Blade V30.
 *
 * The card is therefore scaled by the ratio between the current screen and the
 * reference device, both up and down. A card occupies the same share of every
 * screen, so the shortcut cards on the home screen look identical on a Galaxy
 * M12, a ZTE Blade V30 or any other phone. The scale is capped at `max` so the
 * cards do not grow without bound on tablets.
 */
export function useScaledWidth(reference: number, max = reference * 1.2): number {
  const { width } = useWindowDimensions();
  const scale = Math.min(max / reference, px(width) / REFERENCE_WIDTH);
  return Math.round(reference * scale);
}

/**
 * A height that fits on short screens.
 *
 * The Galaxy M12 is 800dp tall while the reference device is taller, so fixed
 * pixel heights (maps, modals) have to shrink instead of pushing content off
 * screen.
 */
export function useFittedHeight(desired: number, fraction: number, min = 0): number {
  const { height } = useWindowDimensions();
  return px(Math.max(min, Math.min(desired, height * fraction)));
}


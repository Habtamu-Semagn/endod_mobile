import { Text as RNText } from "react-native";
import type { ComponentProps } from "react";

/**
 * Text with a pinned font scale.
 *
 * Every phone applies its own "font size" setting to text, and the setting
 * differs between devices — the reference build (ZTE Blade V30) renders at
 * 1.0 while a Galaxy M12 may be set to 1.15 or 1.3. A scaled font changes
 * the line breaks and pushes buttons out of view, which is why the same
 * screens looked broken on one phone and fine on the other.
 *
 * Pinning the scale keeps the typography identical on every device. Set
 * `allowFontScaling` to `true` on an individual element if it really has to
 * follow the system setting.
 */

type TextProps = ComponentProps<typeof RNText>;

export function Text({ allowFontScaling = false, ...props }: TextProps) {
  return <RNText allowFontScaling={allowFontScaling} {...props} />;
}

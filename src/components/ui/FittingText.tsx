import { Text, type TextProps } from "react-native";
import { useState } from "react";

type FittingTextProps = TextProps & {
  /** Width the text may occupy before it is shrunk. */
  maxWidth: number;
  /** Font size the text starts at. */
  baseFontSize: number;
  /** Never shrink below this size. */
  minFontSize?: number;
};

/**
 * Single line text that shrinks to fit the space it was given.
 *
 * The tab bar shows five labels in a row and the width of that row depends on
 * the phone (the Galaxy M12 is 360dp wide, the reference ZTE Blade V30 is
 * 393dp). Android has no `adjustsFontSizeToFit`, so the rendered line width
 * is measured and the font size is scaled down until the text fits.
 *
 * The result is that both phones show the very same label — never a clipped
 * "Appointme…" — and only the label that genuinely does not fit becomes
 * slightly smaller.
 */
export function FittingText({
  maxWidth,
  baseFontSize,
  minFontSize = 8,
  style,
  children,
  ...rest
}: FittingTextProps) {
  const [fontSize, setFontSize] = useState<number | null>(null);

  return (
    <Text
      numberOfLines={1}
      ellipsizeMode="clip"
      allowFontScaling={false}
      onTextLayout={(event) => {
        const line = event.nativeEvent.lines?.[0];
        const width = line?.width ?? 0;
        if (!width || width <= maxWidth) return;
        const current = fontSize ?? baseFontSize;
        const next = Math.max(minFontSize, current * (maxWidth / width));
        setFontSize((previous) => (previous === null ? next : Math.min(previous, next)));
      }}
      style={[style, { fontSize: fontSize ?? baseFontSize }]}
      {...rest}
    >
      {children}
    </Text>
  );
}

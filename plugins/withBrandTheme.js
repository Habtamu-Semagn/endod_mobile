const { AndroidConfig, withAndroidColors, withAndroidStyles, withStringsXml } = require("expo/config-plugins");

// The same palette the app uses, so the native theme can never drift away
// from the colours of the screens.
const palette = require("../src/lib/theme.json");

/**
 * Pins the native Android theme to the ENDOD brand.
 *
 * Without this the operating system decides the colours of everything React
 * Native does not draw itself: the text cursor, the selection handles, the
 * ripple of a pressed button, the date picker, `Alert` dialogs and the
 * background of the window behind the app. Those colours come from the
 * device's own theme, so a Galaxy M12 (Samsung ships with dark mode and its
 * own accent colours) renders dark dialogs and a differently coloured cursor
 * while the reference ZTE Blade V30 renders the light default.
 *
 * The plugin therefore:
 *   - points `colorPrimary` / `colorAccent` at the brand red,
 *   - pins the window background to the brand background,
 *   - turns off force-dark so the system can never invert the app,
 *   - asks for dark system bar icons on the brand background.
 */

const withBrandColors = (config) =>
  withAndroidColors(config, (config) => {
    const colors = config.modResults;
    AndroidConfig.Colors.assignColorValue(colors, { name: "brandPrimary", value: palette.primary });
    AndroidConfig.Colors.assignColorValue(colors, { name: "brandAccent", value: palette.primary });
    AndroidConfig.Colors.assignColorValue(colors, { name: "brandBackground", value: palette.bg });
    AndroidConfig.Colors.assignColorValue(colors, { name: "brandOnBackground", value: palette.heading });
    AndroidConfig.Colors.assignColorValue(colors, { name: "brandBorder", value: palette.border });
    config.modResults = colors;
    return config;
  });

const withBrandStyles = (config) =>
  withAndroidStyles(config, (config) => {
    const styles = config.modResults;
    const appTheme = AndroidConfig.Styles.getAppThemeGroup();

    const assign = (name, value) =>
      AndroidConfig.Styles.assignStylesValue(styles, { add: true, parent: appTheme, name, value });

    // Brand accent for every native widget (cursor, ripple, picker, dialogs).
    assign("colorPrimary", "@color/brandPrimary");
    assign("colorAccent", "@color/brandAccent");
    assign("colorControlActivated", "@color/brandAccent");

    // The window behind the app is the brand background, so screen
    // transitions and the space around the app never flash a different colour.
    assign("android:windowBackground", "@color/brandBackground");

    // Never let the system force-dark the app.
    assign("android:forceDarkAllowed", "false");

    // Dark icons on the light brand background, on every OEM.
    assign("android:windowLightStatusBar", "true");
    assign("android:windowLightNavigationBar", "true");
    assign("android:statusBarColor", "@android:color/transparent");
    assign("android:navigationBarColor", "@android:color/transparent");
    assign("android:enforceNavigationBarContrast", "false");
    assign("android:enforceStatusBarContrast", "false");

    config.modResults = styles;
    return config;
  });

/**
 * Locks the app to the light theme. React Native reads this string on start
 * up and calls `AppCompatDelegate.setDefaultNightMode(MODE_NIGHT_NO)`, which
 * keeps dialogs, pickers and text fields light even when the phone itself is
 * in dark mode.
 */
const withBrandUserInterfaceStyle = (config) =>
  withStringsXml(config, (config) => {
    const strings = config.modResults;
    AndroidConfig.Strings.setStringItem(
      [
        AndroidConfig.Resources.buildResourceItem({
          name: "expo_system_ui_user_interface_style",
          value: "light",
          translatable: false,
        }),
      ],
      strings
    );
    config.modResults = strings;
    return config;
  });

module.exports = function withBrandTheme(config) {
  config = withBrandColors(config);
  config = withBrandStyles(config);
  config = withBrandUserInterfaceStyle(config);
  return config;
};

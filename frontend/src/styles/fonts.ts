import { Platform } from "react-native";

export const WORD_DISPLAY_FONT_FAMILY = Platform.select({
    ios: "Helvetica",
    android: "sans-serif",
    default: "System",
});

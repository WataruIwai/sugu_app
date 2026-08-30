const appJson = require("./app.json");

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const explicitGoogleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
const inferredGoogleIosUrlScheme = googleIosClientId?.endsWith(
    ".apps.googleusercontent.com",
)
    ? `com.googleusercontent.apps.${googleIosClientId.replace(
          ".apps.googleusercontent.com",
          "",
      )}`
    : undefined;
const googleIosUrlScheme =
    explicitGoogleIosUrlScheme ?? inferredGoogleIosUrlScheme;

const googleSignInPlugin = googleIosUrlScheme
    ? [
          "@react-native-google-signin/google-signin",
          {
              iosUrlScheme: googleIosUrlScheme,
          },
      ]
    : null;

module.exports = {
    expo: {
        ...appJson.expo,
        plugins: [
            ...(appJson.expo.plugins ?? []),
            ...(googleSignInPlugin ? [googleSignInPlugin] : []),
        ],
    },
};

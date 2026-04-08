import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_token";

export const saveAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = async () => {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
};

export const deleteAuthToken = async () => {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
};

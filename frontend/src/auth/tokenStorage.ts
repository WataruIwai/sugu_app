import * as SecureStore from "expo-secure-store";

const AUTH_TOKEN_KEY = "auth_token";
const GUEST_ID_KEY = "guest_id";
const ATT_PERMISSION_REQUESTED_KEY = "att_permission_requested";

export const saveAuthToken = async (token: string) => {
  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
};

export const getAuthToken = async () => {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
};

export const deleteAuthToken = async () => {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
};

export const saveGuestId = async (guestId: string) => {
  await SecureStore.setItemAsync(GUEST_ID_KEY, guestId);
};

export const getGuestId = async () => {
  return SecureStore.getItemAsync(GUEST_ID_KEY);
};

export const deleteGuestId = async () => {
  await SecureStore.deleteItemAsync(GUEST_ID_KEY);
};

export const saveAttPermissionRequested = async () => {
  await SecureStore.setItemAsync(ATT_PERMISSION_REQUESTED_KEY, "true");
};

export const getAttPermissionRequested = async () => {
  return SecureStore.getItemAsync(ATT_PERMISSION_REQUESTED_KEY);
};

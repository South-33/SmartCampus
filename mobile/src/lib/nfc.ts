import { Platform } from 'react-native';

export type NfcModule = typeof import('react-native-nfc-manager');

let cachedModule: NfcModule | null | undefined;

export const loadNfcManager = async (): Promise<NfcModule | null> => {
  if (cachedModule !== undefined) return cachedModule;

  if (Platform.OS !== 'android') {
    cachedModule = null;
    return cachedModule;
  }

  try {
    cachedModule = await import('react-native-nfc-manager');
    return cachedModule;
  } catch (error) {
    console.warn('NFC module unavailable:', error);
    cachedModule = null;
    return cachedModule;
  }
};

import AsyncStorage from '@react-native-async-storage/async-storage';

const DEVICE_ID_KEY = '@smartcampus_device_id';

const generateDeviceId = () => {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `dev_${time}_${rand}`;
};

export const getOrCreateDeviceId = async (): Promise<string> => {
  const cached = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (cached) return cached;

  const deviceId = generateDeviceId();
  await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  return deviceId;
};

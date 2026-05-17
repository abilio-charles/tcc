import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions() {
  if (Platform.OS === 'web') {
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();

  return status === 'granted';
}

async function scheduleSingleNotification({
  processNumber,
  deadlineDateISO,
  daysBefore,
}) {
  const notificationDate = new Date(`${deadlineDateISO}T09:00:00`);
  notificationDate.setDate(notificationDate.getDate() - daysBefore);

  if (notificationDate <= new Date()) {
    return null;
  }

  let body = '';

  if (daysBefore === 0) {
    body = `O prazo do processo ${processNumber} vence hoje.`;
  } else if (daysBefore === 1) {
    body = `O prazo do processo ${processNumber} vence amanhã.`;
  } else {
    body = `O prazo do processo ${processNumber} vence em ${daysBefore} dias.`;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Prazo processual',
      body,
      sound: true,
    },
    trigger: notificationDate,
  });

  return notificationId;
}

export async function scheduleDeadlineNotifications({
  processNumber,
  deadlineDateISO,
}) {
  if (Platform.OS === 'web') {
    return [];
  }

  const hasPermission = await requestNotificationPermissions();

  if (!hasPermission) {
    return [];
  }

  const reminders = [2, 1, 0];
  const notificationIds = [];

  for (const daysBefore of reminders) {
    const id = await scheduleSingleNotification({
      processNumber,
      deadlineDateISO,
      daysBefore,
    });

    if (id) {
      notificationIds.push(id);
    }
  }

  return notificationIds;
}

export async function cancelDeadlineNotifications(notificationIds = []) {
  if (Platform.OS === 'web' || !Array.isArray(notificationIds)) {
    return;
  }

  for (const notificationId of notificationIds) {
    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    }
  }
}
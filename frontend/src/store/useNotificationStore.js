import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notification: null,
  notify: ({ type = 'success', title, message, duration = 4500 }) => set({
    notification: { id: Date.now(), type, title, message, duration },
  }),
  success: (title, message, duration) => set({
    notification: { id: Date.now(), type: 'success', title, message, duration: duration || 4500 },
  }),
  error: (title, message, duration) => set({
    notification: { id: Date.now(), type: 'error', title, message, duration: duration || 6000 },
  }),
  info: (title, message, duration) => set({
    notification: { id: Date.now(), type: 'info', title, message, duration: duration || 5000 },
  }),
  dismiss: () => set({ notification: null }),
}));

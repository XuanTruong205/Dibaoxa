import { create } from 'zustand';
import api from '../services/api';

function loadActiveHold() {
  try {
    const hold = JSON.parse(localStorage.getItem('dibaoxa_active_hold') || 'null');
    if (!hold || Date.parse(hold.expires_at) <= Date.now()) {
      localStorage.removeItem('dibaoxa_active_hold');
      return null;
    }
    return hold;
  } catch {
    localStorage.removeItem('dibaoxa_active_hold');
    return null;
  }
}

let holdExpiryTimer = null;

function scheduleHoldExpiry(expiresAt, onExpire) {
  if (holdExpiryTimer) window.clearTimeout(holdExpiryTimer);
  const expiryTime = typeof expiresAt === 'number' ? expiresAt : Date.parse(expiresAt);
  const remaining = expiryTime - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) {
    onExpire();
    return;
  }
  holdExpiryTimer = window.setTimeout(onExpire, remaining);
}

const initialActiveHold = loadActiveHold();

export const useBookingStore = create((set, get) => ({
  activeHold: initialActiveHold,
  selectedServices: [],

  holdRoom: async ({ room_id, check_in_date, check_out_date, quantity = 1, hotel, room }) => {
    try {
      const res = await api.post('/bookings/hold', { room_id, check_in_date, check_out_date, quantity });
      const holdData = res.data.data;

      const fullHoldState = {
        ...holdData,
        hotel,
        room,
        check_in_date,
        check_out_date,
      };

      localStorage.setItem('dibaoxa_active_hold', JSON.stringify(fullHoldState));
      set({ activeHold: fullHoldState, selectedServices: [] });
      scheduleHoldExpiry(fullHoldState.expires_at, () => get().clearActiveHold());
      return { success: true, data: fullHoldState };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  setSelectedServices: (services) => {
    set({ selectedServices: services });
  },

  clearActiveHold: () => {
    if (holdExpiryTimer) window.clearTimeout(holdExpiryTimer);
    holdExpiryTimer = null;
    localStorage.removeItem('dibaoxa_active_hold');
    set({ activeHold: null, selectedServices: [] });
  },
}));

if (initialActiveHold) {
  scheduleHoldExpiry(initialActiveHold.expires_at, () => useBookingStore.getState().clearActiveHold());
}

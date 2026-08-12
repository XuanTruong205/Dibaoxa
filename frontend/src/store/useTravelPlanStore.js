import { create } from 'zustand';

const STORAGE_KEY = 'dibaoxa_travel_plans';

function readPlans() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
}

function persist(plans) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
}

export const useTravelPlanStore = create((set, get) => ({
  plans: readPlans(),

  savePlan: (payload) => {
    const typePrefix = payload.type === 'flight' ? 'FLY' : 'SEA';
    const plan = {
      ...payload,
      id: `${typePrefix}-${Date.now().toString(36).toUpperCase()}`,
      status: 'saved',
      createdAt: new Date().toISOString(),
    };
    const plans = [plan, ...get().plans].slice(0, 20);
    persist(plans);
    set({ plans });
    return plan;
  },

  removePlan: (planId) => {
    const plans = get().plans.filter((plan) => plan.id !== planId);
    persist(plans);
    set({ plans });
  },
}));


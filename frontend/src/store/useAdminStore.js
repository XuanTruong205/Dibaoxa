import { create } from 'zustand';
import api from '../services/api';

const responseData = (response, fallback) => response?.data?.data ?? fallback;

export const useAdminStore = create((set, get) => ({
  bookings: [],
  travelOrders: [],
  hotels: [],
  cruises: [],
  payments: [],
  customers: [],
  staff: [],
  packages: [],
  reports: null,
  cruiseDepartures: [],
  loading: false,
  error: '',

  fetchAdminData: async ({ includeAdminOnly = true } = {}) => {
    set({ loading: true, error: '' });
    const requests = [
      ['hotels', api.get('/admin/hotels'), []],
      ['cruises', api.get('/admin/cruises'), []],
      ['bookings', api.get('/admin/bookings'), []],
      ['payments', api.get('/admin/payments'), []],
      ['customers', api.get('/admin/users', { params: { group: 'customers' } }), []],
      ['staff', api.get('/admin/staff'), []],
      ['packages', api.get('/admin/packages'), []],
      ['reports', api.get('/admin/reports/occupancy'), null],
    ];
    if (includeAdminOnly) requests.push(
      ['travelOrders', api.get('/admin/travel-orders'), []],
      ['cruiseDepartures', api.get('/admin/cruise-departures'), []],
    );

    const results = await Promise.allSettled(requests.map(([, request]) => request));
    const nextState = includeAdminOnly ? {} : { travelOrders: [], cruiseDepartures: [] };
    const errors = [];

    results.forEach((result, index) => {
      const [key, , fallback] = requests[index];
      if (result.status === 'fulfilled') {
        nextState[key] = responseData(result.value, fallback);
      } else {
        errors.push(result.reason?.message || `Không thể tải ${key}`);
      }
    });

    set({
      ...nextState,
      loading: false,
      error: errors.length ? errors[0] : '',
    });
    return { success: errors.length === 0, errors };
  },

  fetchHotels: async () => {
    const response = await api.get('/admin/hotels');
    const hotels = responseData(response, []);
    set({ hotels });
    return hotels;
  },

  addHotel: async (hotelData) => {
    const response = await api.post('/admin/hotels', hotelData);
    const hotel = responseData(response, null);
    set((state) => ({ hotels: hotel ? [hotel, ...state.hotels] : state.hotels }));
    return hotel;
  },

  updateHotel: async (hotelId, hotelData) => {
    const response = await api.put(`/admin/hotels/${hotelId}`, hotelData);
    const hotel = responseData(response, null);
    if (hotel) {
      set((state) => ({ hotels: state.hotels.map((item) => String(item.id) === String(hotelId) ? hotel : item) }));
    }
    return hotel;
  },

  deleteHotel: async (hotelId) => {
    await api.delete(`/admin/hotels/${hotelId}`);
    set((state) => ({ hotels: state.hotels.filter((hotel) => String(hotel.id) !== String(hotelId)) }));
  },

  addRoom: async (hotelId, roomData) => {
    const response = await api.post(`/admin/hotels/${hotelId}/rooms`, roomData);
    const room = responseData(response, null);
    if (room) {
      set((state) => ({
        hotels: state.hotels.map((hotel) => String(hotel.id) === String(hotelId)
          ? { ...hotel, rooms: [...(hotel.rooms || []), room] }
          : hotel),
      }));
    }
    return room;
  },

  addCruise: async (cruiseData) => {
    const response = await api.post('/admin/cruises', cruiseData);
    const cruise = responseData(response, null);
    set((state) => ({ cruises: cruise ? [cruise, ...state.cruises] : state.cruises }));
    if (cruiseData.launch_schedule) {
      const departuresResponse = await api.get('/admin/cruise-departures');
      set({ cruiseDepartures: responseData(departuresResponse, []) });
    }
    return cruise;
  },

  updateCruise: async (cruiseId, cruiseData) => {
    const response = await api.put(`/admin/cruises/${cruiseId}`, cruiseData);
    const cruise = responseData(response, null);
    if (cruise) set((state) => ({ cruises: state.cruises.map((item) => item.id === cruiseId ? cruise : item) }));
    return cruise;
  },

  deleteCruise: async (cruiseId) => {
    await api.delete(`/admin/cruises/${cruiseId}`);
    set((state) => ({ cruises: state.cruises.filter((cruise) => cruise.id !== cruiseId) }));
  },

  deleteReview: async (reviewId) => {
    await api.delete(`/admin/reviews/${reviewId}`);
    set((state) => ({
      hotels: state.hotels.map((hotel) => ({
        ...hotel,
        reviews: (hotel.reviews || []).filter((review) => review.id !== reviewId),
      })),
    }));
  },

  fetchBookings: async () => {
    const response = await api.get('/admin/bookings');
    const bookings = responseData(response, []);
    set({ bookings });
    return bookings;
  },

  addBooking: async (bookingData) => {
    const response = await api.post('/admin/bookings', bookingData);
    const booking = responseData(response, null);
    set((state) => ({ bookings: booking ? [booking, ...state.bookings] : state.bookings }));
    return booking;
  },

  cancelBooking: async (bookingId) => {
    const response = await api.post(`/admin/bookings/${bookingId}/cancel`);
    const booking = responseData(response, null);
    set((state) => ({
      bookings: state.bookings.map((item) => String(item.id) === String(bookingId)
        ? (booking || { ...item, status: 'Cancelled' })
        : item),
    }));
    return booking;
  },

  fetchTravelOrders: async () => {
    const response = await api.get('/admin/travel-orders');
    const travelOrders = responseData(response, []);
    set({ travelOrders });
    return travelOrders;
  },

  confirmTravelOrder: async (orderId) => {
    const response = await api.post(`/admin/travel-orders/${orderId}/confirm`);
    const order = responseData(response, null);
    if (order) set((state) => ({ travelOrders: state.travelOrders.map((item) => item.id === orderId ? order : item) }));
    await Promise.all([get().fetchPayments(), get().fetchReports()]);
    return order;
  },

  cancelTravelOrder: async (orderId) => {
    const response = await api.post(`/admin/travel-orders/${orderId}/cancel`);
    const order = responseData(response, null);
    if (order) set((state) => ({ travelOrders: state.travelOrders.map((item) => item.id === orderId ? order : item) }));
    await Promise.all([get().fetchPayments(), get().fetchReports()]);
    return order;
  },

  checkinQR: async (qrCode) => {
    try {
      const response = await api.post('/admin/checkin', { qr_code: qrCode });
      const result = responseData(response, null);
      await get().fetchBookings();
      return { success: true, booking: result };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  fetchPayments: async () => {
    const response = await api.get('/admin/payments');
    const payments = responseData(response, []);
    set({ payments });
    return payments;
  },

  fetchReports: async () => {
    const response = await api.get('/admin/reports/occupancy');
    const reports = responseData(response, null);
    set({ reports });
    return reports;
  },

  addCruiseDeparture: async (payload) => {
    const response = await api.post('/admin/cruise-departures', payload);
    const departure = responseData(response, null);
    if (departure) set((state) => ({ cruiseDepartures: [...state.cruiseDepartures, departure].sort((a, b) => a.departure_date.localeCompare(b.departure_date)) }));
    return departure;
  },

  updateCruiseDeparture: async (departureId, payload) => {
    const response = await api.put(`/admin/cruise-departures/${departureId}`, payload);
    const departure = responseData(response, null);
    if (departure) set((state) => ({ cruiseDepartures: state.cruiseDepartures.map((item) => item.id === departureId ? departure : item) }));
    return departure;
  },

  deleteCruiseDeparture: async (departureId) => {
    await api.delete(`/admin/cruise-departures/${departureId}`);
    set((state) => ({ cruiseDepartures: state.cruiseDepartures.filter((item) => item.id !== departureId) }));
  },

  fetchCustomers: async () => {
    const response = await api.get('/admin/users', { params: { group: 'customers' } });
    const customers = responseData(response, []);
    set({ customers });
    return customers;
  },

  addCustomer: async (customerData) => {
    const response = await api.post('/admin/users', customerData);
    const customer = responseData(response, null);
    set((state) => ({ customers: customer ? [customer, ...state.customers] : state.customers }));
    return customer;
  },

  updateCustomer: async (customerId, customerData) => {
    const response = await api.patch(`/admin/users/${customerId}`, customerData);
    const customer = responseData(response, null);
    if (customer) set((state) => ({ customers: state.customers.map((item) => item.id === customerId ? customer : item) }));
    return customer;
  },

  deleteCustomer: async (customerId) => {
    await api.delete(`/admin/users/${customerId}`);
    set((state) => ({ customers: state.customers.filter((item) => item.id !== customerId) }));
  },

  fetchStaff: async () => {
    const response = await api.get('/admin/staff');
    const staff = responseData(response, []);
    set({ staff });
    return staff;
  },

  addStaff: async (staffData) => {
    const response = await api.post('/admin/staff', staffData);
    const member = responseData(response, null);
    set((state) => ({ staff: member ? [member, ...state.staff] : state.staff }));
    return member;
  },

  updateStaff: async (staffId, staffData) => {
    const response = await api.put(`/admin/staff/${staffId}`, staffData);
    const member = responseData(response, null);
    if (member) set((state) => ({ staff: state.staff.map((item) => item.id === staffId ? member : item) }));
    return member;
  },

  deleteStaff: async (staffId) => {
    await api.delete(`/admin/staff/${staffId}`);
    set((state) => ({ staff: state.staff.filter((member) => String(member.id) !== String(staffId)) }));
  },

  fetchPackages: async () => {
    const response = await api.get('/admin/packages');
    const packages = responseData(response, []);
    set({ packages });
    return packages;
  },

  addPackage: async (packageData) => {
    const response = await api.post('/admin/packages', packageData);
    const travelPackage = responseData(response, null);
    set((state) => ({ packages: travelPackage ? [travelPackage, ...state.packages] : state.packages }));
    return travelPackage;
  },

  updatePackage: async (packageId, packageData) => {
    const response = await api.put(`/admin/packages/${packageId}`, packageData);
    const travelPackage = responseData(response, null);
    if (travelPackage) set((state) => ({ packages: state.packages.map((item) => item.id === packageId ? travelPackage : item) }));
    return travelPackage;
  },

  deletePackage: async (packageId) => {
    await api.delete(`/admin/packages/${packageId}`);
    set((state) => ({ packages: state.packages.filter((item) => String(item.id) !== String(packageId)) }));
  },
}));

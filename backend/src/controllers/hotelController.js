import * as hotelService from '../services/hotelService.js';

export async function getHotels(req, res, next) {
  try {
    const result = await hotelService.searchHotels(req.query);
    res.status(200).json({
      success: true,
      count: result.hotels.length,
      data: result.hotels,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getHotelById(req, res, next) {
  try {
    const hotel = await hotelService.getHotelDetail(req.params.id);
    res.status(200).json({
      success: true,
      data: hotel,
    });
  } catch (error) {
    next(error);
  }
}

export async function getHotelRooms(req, res, next) {
  try {
    const { check_in, check_out } = req.query;
    const rooms = await hotelService.getHotelRoomsWithRealtimeAvailability(
      req.params.id,
      check_in,
      check_out
    );
    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
}

export async function getFeaturedReviews(req, res, next) {
  try {
    const reviews = await hotelService.listFeaturedReviews(req.query.limit);
    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
}

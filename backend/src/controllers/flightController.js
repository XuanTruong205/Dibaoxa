import * as flightService from '../services/flightService.js';

export function status(req, res) {
  res.status(200).json({ success: true, data: flightService.getStatus() });
}

export function airports(req, res) {
  const data = flightService.getAirports();
  res.status(200).json({ success: true, count: data.length, data });
}

export async function search(req, res, next) {
  try {
    const result = await flightService.searchFlights(req.query);
    res.status(200).json({
      success: true,
      count: result.offers.length,
      data: result.offers,
      provider: { name: result.provider, source: result.source, environment: result.environment, live: result.live, cached: result.cached },
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}

import * as cruiseService from '../services/cruiseService.js';
import { listDepartures as listCruiseDepartures } from '../services/cruiseInventoryService.js';

export async function listCruises(req, res, next) {
  try { res.json({ success: true, data: await cruiseService.listCruises() }); } catch (error) { next(error); }
}

export async function getCruise(req, res, next) {
  try { res.json({ success: true, data: await cruiseService.getCruise(req.params.id) }); } catch (error) { next(error); }
}

export async function getCruiseDepartures(req, res, next) {
  try { res.json({ success: true, data: await listCruiseDepartures(req.params.id) }); } catch (error) { next(error); }
}

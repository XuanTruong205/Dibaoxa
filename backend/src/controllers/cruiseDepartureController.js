import * as cruiseInventoryService from '../services/cruiseInventoryService.js';

export async function listDepartures(req, res, next) {
  try { res.json({ success: true, data: await cruiseInventoryService.listAllDepartures() }); } catch (error) { next(error); }
}

export async function createDeparture(req, res, next) {
  try { res.status(201).json({ success: true, data: await cruiseInventoryService.createDeparture(req.body) }); } catch (error) { next(error); }
}

export async function updateDeparture(req, res, next) {
  try { res.json({ success: true, data: await cruiseInventoryService.updateDeparture(req.params.id, req.body) }); } catch (error) { next(error); }
}

export async function deleteDeparture(req, res, next) {
  try { res.json({ success: true, data: await cruiseInventoryService.deleteDeparture(req.params.id) }); } catch (error) { next(error); }
}

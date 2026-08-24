import * as teamService from '../services/teamService.js';

export async function listPublicTeam(req, res, next) {
  try {
    const data = await teamService.listPublicTeam();
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
}

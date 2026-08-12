import * as packageService from '../services/packageService.js';

export async function getPackages(req, res, next) {
  try {
    const packages = await packageService.listActivePackages(req.query);
    res.status(200).json({
      success: true,
      count: packages.length,
      data: packages,
    });
  } catch (error) {
    next(error);
  }
}

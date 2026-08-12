import { Router } from 'express';
import { z } from 'zod';
import * as cruiseController from '../controllers/cruiseController.js';
import { validateParams } from '../middlewares/validateMiddleware.js';

const router = Router();
const cruiseParams = z.object({ id: z.string().trim().min(1).max(120) }).strict();

router.get('/', cruiseController.listCruises);
router.get('/:id/departures', validateParams(cruiseParams), cruiseController.getCruiseDepartures);
router.get('/:id', validateParams(cruiseParams), cruiseController.getCruise);

export default router;

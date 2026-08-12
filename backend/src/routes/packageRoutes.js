import { Router } from 'express';
import { z } from 'zod';
import * as packageController from '../controllers/packageController.js';
import { validateQuery } from '../middlewares/validateMiddleware.js';

const router = Router();
const packageQuery = z.object({
  destination: z.string().trim().min(2).max(100).optional(),
  search: z.string().trim().min(1).max(120).optional(),
}).strict();

router.get('/', validateQuery(packageQuery), packageController.getPackages);

export default router;

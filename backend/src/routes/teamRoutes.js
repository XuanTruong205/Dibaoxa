import { Router } from 'express';
import * as teamController from '../controllers/teamController.js';

const router = Router();

router.get('/', teamController.listPublicTeam);

export default router;

import { Router } from 'express';
import dashboardController from '../controllers/dashboardController.js';

const router = Router();

router.get('/stats', dashboardController.getStats);
router.get('/users', dashboardController.getUserLists);

export default router;

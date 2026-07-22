import { Router } from 'express';
import activityController from '../controllers/activityController.js';

const router = Router();

router.get('/', activityController.list);
router.post('/', activityController.create);
router.get('/:id', activityController.getById);
router.post('/:id/review', activityController.review);
router.post('/:id/mint', activityController.mint);

export default router;

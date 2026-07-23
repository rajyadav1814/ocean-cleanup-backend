import { Router } from 'express';
import multer from 'multer';
import activityController from '../controllers/activityController.js';

const router = Router();
// Store uploaded file in memory as a Buffer (no disk writes)
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', activityController.list);
router.post('/', upload.single('image'), activityController.create);
router.get('/:id', activityController.getById);
router.post('/:id/review', activityController.review);
router.post('/:id/mint', activityController.mint);

export default router;

import express from 'express';
import { FareController } from '../controllers/fareController.js';

const router = express.Router();

router.post('/estimate', FareController.estimate);
router.post('/promo/validate', FareController.validatePromo);

export default router;


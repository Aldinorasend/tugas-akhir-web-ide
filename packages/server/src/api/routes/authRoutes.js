import express from 'express';
import { register, login, simpleLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/login-nim', simpleLogin);

export default router;

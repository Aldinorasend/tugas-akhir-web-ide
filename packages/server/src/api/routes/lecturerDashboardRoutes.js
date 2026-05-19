import express from "express";
import { getLecturerDashboardData } from "../controllers/lecturerDashboardController.js";
import { authenticateToken, authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only authenticated users with 'lecturer' role can fetch dashboard data
router.get("/data", authenticateToken, authorizeRole(["lecturer"]), getLecturerDashboardData);

export default router;

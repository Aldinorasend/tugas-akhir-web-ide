import express from "express";
import {
    getAllStudyCases,
    getStudyCaseById,
    createStudyCase,
    updateStudyCase,
    deleteStudyCase
} from "../controllers/studyCaseController.js";

const router = express.Router();

router.get("/", getAllStudyCases);
router.get("/:id", getStudyCaseById);
router.post("/", createStudyCase);
router.put("/:id", updateStudyCase);
router.delete("/:id", deleteStudyCase);

export default router;
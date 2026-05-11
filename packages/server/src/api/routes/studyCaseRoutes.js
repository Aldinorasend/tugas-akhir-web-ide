import express from "express";
import {
    getAllStudyCases,
    getStudyCaseById,
    createStudyCase,
    updateStudyCase,
    deleteStudyCase,
    randomStudyCase
} from "../controllers/studyCaseController.js";

const router = express.Router();

router.get("/", getAllStudyCases);
router.get("/random", randomStudyCase);
router.get("/:id", getStudyCaseById);
router.post("/", createStudyCase);
router.put("/:id", updateStudyCase);
router.delete("/:id", deleteStudyCase);

export default router;
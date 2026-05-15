import { gradeStudentDiagram } from "../../core/grader/graderService.js";
import { compareCodeWithLogic } from "../../core/ast-parser/java-analyzer.js"
import express from "express";

const router = express.Router();

router.post('/grade-diagram', async (req, res) => {
    const { exerciseId, nodes, edges } = req.body;

    const result = await gradeStudentDiagram(exerciseId, nodes, edges);

    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
});

router.post('/compare-code', async (req, res) => {
    const {current_code, logic_rules} = req.body;

    const result = await compareCodeWithLogic(current_code, logic_rules);
    
    if (result.success) {
        res.json(result);
    } else {
        res.status(500).json(result);
    }
})

export default router;
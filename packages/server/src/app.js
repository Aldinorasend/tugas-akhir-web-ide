import express from "express";
import cors from "cors";
import runRoute from "./controllers/runController.js";
import resultRoute from "./controllers/resultController.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/run", runRoute);

app.use("/result", resultRoute);

app.listen(3001, () => {
  console.log("Backend running on 3001");
});
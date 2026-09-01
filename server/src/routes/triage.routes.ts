import { Router } from "express";
import { TriageController } from "../controllers/triage.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", TriageController.list);
router.post("/", TriageController.create);
router.delete("/:id", TriageController.delete);

export default router;

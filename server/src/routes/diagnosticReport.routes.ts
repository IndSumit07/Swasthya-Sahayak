import { Router } from "express";
import { DiagnosticReportController } from "../controllers/diagnosticReport.controller";
import { authenticate, resolveIdentity } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate, resolveIdentity);

router.get("/", DiagnosticReportController.list);
router.post("/", DiagnosticReportController.create);
router.delete("/:id", DiagnosticReportController.delete);

export default router;

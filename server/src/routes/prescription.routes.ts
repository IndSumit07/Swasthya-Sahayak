import { Router } from "express";
import { PrescriptionController } from "../controllers/prescription.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", PrescriptionController.list);
router.get("/:id", PrescriptionController.getById);
router.post("/", PrescriptionController.create);
router.delete("/:id", PrescriptionController.delete);

export default router;

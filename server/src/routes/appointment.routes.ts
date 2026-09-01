import { Router } from "express";
import { AppointmentController } from "../controllers/appointment.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", AppointmentController.list);
router.get("/:id", AppointmentController.getById);
router.post("/", AppointmentController.create);
router.patch("/:id/status", AppointmentController.updateStatus);
router.delete("/:id", AppointmentController.delete);

export default router;

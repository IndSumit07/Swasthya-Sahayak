import { Router } from "express";
import { AppointmentController } from "../controllers/appointment.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

// List and detail
router.get("/", AppointmentController.list);

// Digital Queue Management (FR-16)
router.get("/queue/status", AppointmentController.getFacilityQueue);
router.post("/queue/call-next", AppointmentController.callNextPatient);
router.get("/:id/queue", AppointmentController.getPatientQueue);

// Reschedule, Cancel, Rebook (FR-17)
router.patch("/:id/reschedule", AppointmentController.reschedule);
router.patch("/:id/cancel", AppointmentController.cancel);
router.post("/:id/rebook", AppointmentController.rebook);

// Basic CRUD
router.get("/:id", AppointmentController.getById);
router.post("/", AppointmentController.create);
router.patch("/:id/status", AppointmentController.updateStatus);
router.delete("/:id", AppointmentController.delete);

export default router;

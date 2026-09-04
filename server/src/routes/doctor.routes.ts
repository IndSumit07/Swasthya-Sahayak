import { Router } from "express";
import { doctorController } from "../controllers/doctor.controller";

const router = Router();

// FR-13: Search and discovery for doctors
router.get("/", doctorController.search);
router.get("/specialties", doctorController.getSpecialties);

export default router;

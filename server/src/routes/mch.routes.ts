import { Router } from "express";
import { MchController } from "../controllers/mch.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", MchController.list);
router.post("/", MchController.create);
router.patch("/:id", MchController.update);
router.delete("/:id", MchController.delete);

export default router;

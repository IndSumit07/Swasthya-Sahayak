import { Router } from "express";
import { ReferralController } from "../controllers/referral.controller";
import { authenticate, resolveIdentity } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate, resolveIdentity);

router.get("/", ReferralController.list);
router.get("/:id", ReferralController.getById);
router.post("/", ReferralController.create);
router.patch("/:id/status", ReferralController.updateStatus);
router.delete("/:id", ReferralController.delete);

export default router;

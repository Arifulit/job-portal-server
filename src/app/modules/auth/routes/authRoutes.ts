// এই ফাইলটি auth module এর endpoint route mapping করে।


import { Router } from "express";
import {
	register,
	login,
	refresh,
	logout,
	me,
	googleAuth,
	googleCallback,
	googleDebug,
} from "../controllers/authController";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/google/debug", googleDebug);
router.get("/google", googleAuth);
router.get("/google/callback", googleCallback);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", me);
export default router;
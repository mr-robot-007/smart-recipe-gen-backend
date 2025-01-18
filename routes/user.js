import {Router} from "express";
import {z} from "zod";
import {prisma} from "../prisma/primaclient.js";
import { hashPassword, verifyPassword,generateToken } from "../utils/helpers.js";
import usercontroller from "../controllers/usercontroller.js";


const router = Router();


const userSchema = z.object({
    email : z.string().email(),
    password : z.string().min(8).max(16),
});

const signupUserSchema = z.object({
    email : z.string().email(),
    password : z.string().min(8).max(16),
    username: z.string().min(4).max(16),
})

router.post('/login', usercontroller.login);
router.post('/signup', usercontroller.signup);

router.get('/logout',usercontroller.logout);


export default router;
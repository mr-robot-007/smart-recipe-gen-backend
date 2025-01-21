import {z} from "zod";
import {prisma} from "../prisma/primaclient.js";
import { hashPassword, verifyPassword,generateToken } from "../utils/helpers.js";


class usercontroller {
    constructor() {
        this.userSchema = z.object({
            email : z.string().email(),
            password : z.string().min(8).max(16),
        });
        
        this.signupUserSchema = z.object({
            email : z.string().email(),
            password : z.string().min(8).max(16),
            username: z.string().min(4).max(16),
        });
        this.tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    }
    login = async  (req,res) => {
        console.log("body",req.body);
        const parseResult = this.userSchema.safeParse(req.body);
        if(parseResult.success)
        {
            try {
    
                const data = await prisma.users.findUnique({
                    where: {
                        email : req.body.email,
                    }
                })
                const passwordMatch = await verifyPassword(req.body.password,data.password);
                
                if(passwordMatch)
                {
                    const token = await generateToken(data.username);
                    if(token == null)
                    {
                        console.error("Token creation failed:", error);
                        return res.status(500).send({"message": "Token creation failed."});
                    }
                    return res.send({"message" : "Verified","token":`${token}`,"id":data.id,"username":data.username});
                }
                else {
                    throw Error;
                }
    
            } catch(error) 
            {
                return res.status(500).send({"message" : "Invalid email or password"});
            }
        }
        else {
            this.handleZodError(res,parseResult.error);
        }
    }
    signup = async (req,res)=> {
        const parseResult = this.signupUserSchema.safeParse(req.body);
        if(parseResult.success)
        {
            try {
                const data = await prisma.users.create({
                    data: {
                        email: req.body.email,
                        username : req.body.email,
                        password : await hashPassword(req.body.password)
                    }
                })
                const token = await generateToken(data.username);
                if(token == null)
                {
                    console.error("Token creation failed:", error);
                    return res.status(500).send({"message": "Token creation failed."});
                }
                return res.send({"message" : "Verified","token":`${token}`,"id":data.id,"username":data.username});
            }
            catch (error)
            {
                if (error.code === 'P2002') { // Unique constraint violation
                    return res.status(400).send({"message": "Email or username already exists."});
                } else {
                    return res.status(500).send({"message": "User creation failed."});
                }
            }
    
        }
        else {
            this.handleZodError(res,parseResult.error);
        }
    }
    logout = async (req,res) => {
        const token = req.header(this.tokenHeaderKey);

        if (token) {
            const result = await prisma.tokens.deleteMany({
                where: {
                    token:token // Use the ID of the token to delete
                }
            });
            if(result) {
                return res.send({"message":"token invalidated successfully"});
            }
        } else {
            return res.status(400).send({"message":"Token not found."});
        }
    }

    handleZodError = (res,err) => {
        res.status(400);
        if(err instanceof z.ZodError)
        {
            console.error("ZodError details:", err.issues);
            return res.send({"message" : `${err.issues[0].path[0]} : ${err.issues[0].message}`});
        }
        else {
            // res.status(400);
            return res.status(400).send({"message" : "Something went wrong..."});
        }
    }
}

export default new usercontroller();
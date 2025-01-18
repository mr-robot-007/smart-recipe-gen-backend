import express from 'express';
import {prisma} from "../prisma/primaclient.js";
import jwt from "jsonwebtoken";
const app = express();


export const verifyToken = async function(req,res,next)
{
    const nonSecurePaths = ['/user/login','/user/signup'];
    if (nonSecurePaths.includes(req.path)) return next();
    let tokenHeaderKey = process.env.TOKEN_HEADER_KEY;
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    try {
        const token = req.header(tokenHeaderKey);
        if(token == null || token == undefined) throw new Error('Invalid token');
        // console.log(token);
        const result = await prisma.tokens.findFirst({
            where: {
                token : token,
            }
        });
        // console.log('result : ',result);

        const verified = jwt.verify(token, jwtSecretKey);
        if (verified && result) {
            next();
        } else {
            throw new Error("Invalid token.")
        }
    } catch (error) {
        console.log(error.message);
        return res.status(200).send({"message":error.message});
    }
}
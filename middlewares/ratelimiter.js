
import rateLimit from "express-rate-limit";

export const limiter = rateLimit({

    windowMs: 1 * 60 * 1000, // 15 minutes
    max: 25, // Limit each IP to 100 requests per window
    standardHeaders: true, // add the `RateLimit-*` headers to the response
    legacyHeaders: false, 
});
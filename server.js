import express from "express";
import recipeRouter from "./routes/recipes.js";
import userRouter from "./routes/user.js";
import { verifyToken } from "./middlewares/user.js";
import { limiter } from "./middlewares/ratelimiter.js";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();

let corsOptions = {
  origin : '*',
  methods: ['GET', 'POST'], // Specify allowed methods
  allowedHeaders: ['Authorization', 'Content-Type','access_token','Access-Control-Allow-Origin'], // Specify allowed headers
}


app.use(cors(corsOptions));


// import swaggerUi from "swagger-ui-express";
// import swaggerJsDoc from "swagger-jsdoc";
// const swaggerOptions = {
//   definition: {
//       openapi: "3.0.0",
//       info: {
//           title: "Smart Recipe Generator API",
//           version: "1.0.0",
//           description: "API documentation for the Smart Recipe Generator",
//       },
//   },
//   apis: ["./routes/user.js", "./routes/recipes.js"], // Path to the API docs

// };

// const swaggerDocs = swaggerJsDoc(swaggerOptions);
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// app.use(bodyParser.json());
app.use(limiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(verifyToken);




/* Routers */
app.use('/user',userRouter);

app.use('/recipes',recipeRouter);

app.get('/',(req,res)=> {
    console.log('GET Request at : / ')
    res.send('Smart Recipe Generator API is running..');
})


const PORT = process.env.PORT | 5000;
app.listen(PORT,() => console.log(`Server running on port ${PORT}`));
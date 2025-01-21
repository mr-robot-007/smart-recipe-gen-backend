import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import recipeController from "../controllers/recipecontroller.js";
import recipecontroller from "../controllers/recipecontroller.js";
import path from "path";
const router = Router();
import { data } from "../data.js";
import { prisma } from "../prisma/primaclient.js";


const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 3 * 1024 * 1024, // limit file size to 3MB
  },
  filename: function (req, file, cb) {
    const extension = file.originalname.split(".").pop();
    cb(null, file.originalname + "-" + Date.now() + "." + extension);
  },
  fileFilter: function (req,file,cb)
  {
    checkFileType(file,cb);
  }
});

function checkFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|avif/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(null,false); // Updated to return JSON error
  }
}

// router.get('/adddata',async(req,res)=> {
//   const x = await prisma.ingredients.createMany({data: data.Ingredients});
//   await prisma.recipes.createMany({data: data.Recipes});
//   await prisma.recipe_Ingredients.createMany({data: data.Recipe_Ingredients});
//   console.log(x);
//   res.send("ok");;
// })

router.get("/all", recipeController.getAllRecipes);
router.get("/recent/:id",recipeController.recentViews);
router.post("/recipe/:id",recipeController.getRecipe);
router.get("/ingredients",recipeController.getIngredients);
router.post("/findrecipe", upload.array("image"), recipecontroller.findRecipe);
/*
SQL query to get recipes
    SELECT r.*
    FROM Recipes r
    JOIN Recipe_Ingredients ri ON r.id = ri.recipe_id
    JOIN Ingredients i ON ri.ingredient_id = i.id
    WHERE i.name IN ('tomato', 'onion', 'garlic')
    AND  ri.optional = false
    GROUP BY r.id
    HAVING COUNT(DISTINCT i.id) = 3;
*/

export default router;


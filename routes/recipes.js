import { Router } from "express";
import { z } from "zod";
import multer from "multer";
import recipeController from "../controllers/recipecontroller.js";
import recipecontroller from "../controllers/recipecontroller.js";
import path from "path";
const router = Router();


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


router.get("/all", recipeController.getAllRecipes);
router.post("/findrecipe", upload.array("image"), recipecontroller.findRecipe);
/*
SQL query to get recipes
    SELECT r.*
    FROM Recipes r
    JOIN Recipe_Ingredients ri ON r.id = ri.recipe_id
    JOIN Ingredients i ON ri.ingredient_id = i.id
    WHERE i.name IN ('tomato', 'onion', 'garlic')
    GROUP BY r.id
    HAVING COUNT(DISTINCT i.id) = 3;
*/

export default router;


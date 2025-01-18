import { prisma } from "../prisma/primaclient.js";
import { imageToIngredients } from "../utils/helpers.js";
import { s3 } from "../utils/s3.js";

class RecipeController {

   getAllRecipes = async(req, res) =>  {
    const recipes = await prisma.recipes.findMany();
    console.log(recipes);
    return res.send(recipes);
  }

  findRecipe =async (req, res) => {
    // req.files will be null if no file is upload or wrong file type is uploaded 
    if (!req.files || req.files.length == 0 || req.body.ingredients == []) {
        return res.status(400).json({ error: 'No files or ingredients selected.' });
      }
    if (req.files && req.files.length > 0) {
      const ingredientPromises = req.files.map(async (file) => {
        var params = {
          Bucket: "smart-recipe-gen",
          Key: `public/uploads/${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        try {
          const url = await new Promise((resolve, reject) => {
            s3.upload(params, function (perr, pres) {
              if (perr) {
                console.log("Error uploading data: ", perr);
                reject(perr);
              } else {
                console.log("Successfully uploaded data to myBucket/myKey");
                console.log(pres, pres.Location);
                resolve(pres.Location);
              }
            });
          });
          const ingredients = await imageToIngredients(url);
          return ingredients; // Return the ingredients for this file
        } catch (error) {
          //   console.error(error);
          throw new Error(error.message); // Handle errors properly
        }
      });

      try {
        const allIngredients = await Promise.all(ingredientPromises);
        const flattenedIngredients = [].concat(...allIngredients); // Flatten the array of ingredients
        console.log(allIngredients, flattenedIngredients);
        const recipes = await this.fetchRecipes(flattenedIngredients);
        return res.send(recipes);
      } catch (error) {
        return res.status(500).send(error.message); // Handle errors properly
      }
    } else {
      const ingredientList = req.body.ingredients;
      const recipes = await this.fetchRecipes(ingredientList);
      return res.send(recipes);
    }
  }
  fetchRecipes = async (ingredientList) => {
    try {
      const recipes = await prisma.recipes.findMany({
        where: {
          ingredients: {
            every: {
              ingredient: {
                name: {
                  in: ingredientList, // List of ingredient names
                },
              },
            },
          },
        },
        include: {
          ingredients: {
            select: {
              ingredient: {
                select: {
                  name: true,
                },
              },

              optional: true,
            },
          },
        },
      });
      const formattedRecipes = recipes.map((recipe) => ({
        ...recipe,
        ingredients: recipe.ingredients.map((i) => ({
          name: i.ingredient.name,
          optional: i.optional,
        })),
      }));
      return formattedRecipes;
    } catch (error) {
      return error.message;
    }
  }
}

export default new RecipeController(); // Instantiate the class

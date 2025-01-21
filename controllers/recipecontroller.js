import { prisma } from "../prisma/primaclient.js";
import { imageToIngredients } from "../utils/helpers.js";
import { s3 } from "../utils/s3.js";

class RecipeController {

   getAllRecipes = async(req, res) =>  {
    const recipes = await prisma.recipes.findMany();
    // console.log(recipes);
    return res.send(recipes);
  }

  getRecipe = async (req,res) => {
    const id = req.params.id;
    const user_id = req.body.user_id;
    console.log(id);
    if(id==null)
    {
      return res.send(null);
    }
    const recipe = await prisma.recipes.findUnique({
      where: {
        id: Number(id)
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
    if(recipe)
    {
      await prisma.user_Searches.create({
        data: {
          user_id: user_id,
          recipe_id: recipe.id,
          created_at: new Date().toISOString()
        }
      })
      return res.send(recipe);

    }
    return res.send(null);
  }
  recentViews = async (req,res) => {
    const user_id = req.params.id;
    if(user_id==null)
    {
      return res.send(null);
    }
    const recents = await prisma.user_Searches.findMany({
      where: {
        user_id: Number(user_id)
      },
      select: {
        recipe_id:true
      },
      distinct: ['recipe_id'],
      orderBy:{
        created_at: "desc"
      },
      take:5,
    });
    const filterdRecents = recents.map((item)=>item.recipe_id)
    const recipes = await prisma.recipes.findMany({
      where: {
        id: {
          in: filterdRecents
        }
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
    if(recipes)
    {
      return res.send(recipes);
    }
    return res.send(null);
  }


  findRecipe =async (req, res) => {
    // req.files will be null if no file is upload or wrong file type is uploaded 
    if (!req.files && req.files?.length == 0 && req.body.ingredients == []) {
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
        return res.send({recipes,"ingredientList":flattenedIngredients});
      } catch (error) {
        return res.status(500).send(error.message); // Handle errors properly
      }
    } else {
      const ingredientList = req.body.ingredients;
      console.log(ingredientList);
      const recipes = await this.fetchRecipes(ingredientList);
      return res.send({recipes,ingredientList});
    }
  }
  fetchRecipes = async (ingredientList) => {
    try {
      const recipes = await prisma.recipes.findMany({
        where: {
          ingredients: {
            every: {
              OR: [
                {
                  optional: true, // Allow optional ingredients to be ignored
                },
                {
                  optional: false, // Non-optional ingredients must be in the list
                  ingredient: {
                    name: {
                      in: ingredientList,
                    },
                  },
                },
              ],
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

  getIngredients = async(req,res)=> {
    const results = await prisma.ingredients.findMany({
      select : {name:true}
    });
    const ingredients = results.map((ing)=>ing.name);

    res.send(ingredients);;
  }
}

export default new RecipeController(); // Instantiate the class

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ClarifaiStub, grpc } from "clarifai-nodejs-grpc";

import { prisma } from "../prisma/primaclient.js";
import { data as dummyData } from "../data.js";

const saltRounds = 10;
const stub = ClarifaiStub.grpc();


//https://clarifai.com/clarifai/main/models/food-item-recognition
// Your PAT (Personal Access Token)
const PAT = process.env.PAT || "";
// Specify the correct user_id/app_id pairings
const USER_ID = "clarifai";
const APP_ID = "main";
// Change these to whatever model and image URL you want to use
const MODEL_ID = "food-item-recognition";
const MODEL_VERSION_ID = "1d5fd481e0cf4826aa72ec3ff049e044";

// This will be used by every Clarifai endpoint call
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + PAT);

export async function generateToken(username) {
  let JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
  let data = {
    time: Date.now(),
    username: username,
  };
  const token = jwt.sign(data, JWT_SECRET_KEY);
  try {
    const tokenInfo = await prisma.tokens.create({
      data: {
        token: token,
        expiry_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Set expire time to now + 1 week
      },
    });
    return token;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password: ", error);
    throw error;
  }
}

export async function verifyPassword(password, hashedPassword) {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    // console.log(isMatch);
    return isMatch;
  } catch (error) {
    console.error("Error verifying password: ", error);
    throw error;
  }
}

export async function addDummyData() {
  try {
    console.log(dummyData.Ingredients);
    await prisma.ingredients.createMany({
      data: dummyData.Ingredients,
    });
    await prisma.recipes.createMany({
      data: dummyData.Recipes,
    });
    await prisma.recipe_Ingredients.createMany({
      data: dummyData.Recipe_Ingredients,
    });
  } catch (error) {
    console.log(error);
  }
}



export async function imageToIngredients(url) {
  const result = [];
  // Wrapping the Clarifai call inside a Promise
  return new Promise((resolve, reject) => {
    stub.PostModelOutputs(
      {
        user_app_id: {
          user_id: USER_ID,
          app_id: APP_ID,
        },
        model_id: MODEL_ID,
        version_id: MODEL_VERSION_ID, // This is optional. Defaults to the latest model version
        inputs: [
          {
            data: {
              image: {
                url: url,
                allow_duplicate_url: true,
              },
            },
          },
        ],
      },
      metadata,
      (err, response) => {
        if (err) {
          reject(new Error(err)); // Reject if there's an error
        }

        if (response.status.code !== 10000) {
          // reject(new Error("Post model outputs failed, status: " + response.status.description)); // Reject if status code isn't successful
          resolve([]);
        }

        //   console.log("Predicted concepts:");
        //   output.data.concepts.forEach((concept, index) => {
        //     console.log(Index: ${index}, Name: ${concept.name}, Value: ${concept.value});
        //   });

        // Since we have one input, one output will exist here
        const output = response.outputs[0];
        output.data.concepts.forEach((concept, index) => {
          if (concept.value > 0.1) result.push(concept.name); // Add the top 3 concepts
        });

        resolve(result); // Resolve the promise with the result array
      }
    );
  });
}

import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyDL1KIOqcNsJBH_XowoBjHdNIdFdj647OI";

async function listModels() {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  try {
    const models = await genAI.listModels();
    console.log("Available Models:", JSON.stringify(models, null, 2));
  } catch (e) {
    console.error("List Models Failed:", e);
  }
}

listModels();

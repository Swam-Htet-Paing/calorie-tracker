import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({apiKey: "AIzaSyCWMdViZdxVzkfYJieYI6Dg2__horQCuhk"});

const interaction = await ai.interactions.create({
  model: "gemini-3.7-flash",
  input: "Explain how AI works in a few words",
});

console.log(interaction.output_text);
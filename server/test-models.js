require('dotenv').config();

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    
    // Filter for models that support generating content and map their names
    const generateModels = data.models
      .filter(m => m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace('models/', ''));
      
    console.log("✅ YOUR AVAILABLE MODELS:");
    console.log(generateModels);
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

listModels();
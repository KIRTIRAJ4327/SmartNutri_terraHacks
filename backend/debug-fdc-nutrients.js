const axios = require('axios');
require('dotenv').config();

async function debugNutrientStructure() {
    const apiKey = process.env.FOODDATA_CENTRAL_API_KEY;
    
    try {
        // Get a known food with good nutrition data
        console.log('🔍 Getting detailed nutrition data for egg (known good food)...');
        
        const detailUrl = `https://api.nal.usda.gov/fdc/v1/food/171287?api_key=${apiKey}`; // Known egg ID
        const response = await axios.get(detailUrl, { timeout: 12000 });
        
        const nutrients = response.data.foodNutrients || [];
        console.log(`\n📊 Food: "${response.data.description}"`);
        console.log(`📊 Total nutrients: ${nutrients.length}`);
        console.log(`📊 Data type: ${response.data.dataType}`);
        
        // Log all nutrients to understand the structure
        console.log('\n🧪 All nutrients:');
        nutrients.slice(0, 15).forEach(nutrient => {
            console.log(`  ID ${nutrient.nutrient?.id}: ${nutrient.nutrient?.name} = ${nutrient.amount} ${nutrient.nutrient?.unitName}`);
        });
        
        // Look specifically for key nutrients
        console.log('\n🎯 Key nutrients:');
        const sodium = nutrients.find(n => n.nutrient?.id === 307);
        const sugars = nutrients.find(n => n.nutrient?.id === 269);
        const protein = nutrients.find(n => n.nutrient?.id === 203);
        const fiber = nutrients.find(n => n.nutrient?.id === 291);
        const calories = nutrients.find(n => n.nutrient?.id === 208);
        
        console.log(`🧂 Sodium (307): ${sodium ? `${sodium.amount} ${sodium.nutrient.unitName}` : 'NOT FOUND'}`);
        console.log(`🍯 Sugars (269): ${sugars ? `${sugars.amount} ${sugars.nutrient.unitName}` : 'NOT FOUND'}`);
        console.log(`🥩 Protein (203): ${protein ? `${protein.amount} ${protein.nutrient.unitName}` : 'NOT FOUND'}`);
        console.log(`🌾 Fiber (291): ${fiber ? `${fiber.amount} ${fiber.nutrient.unitName}` : 'NOT FOUND'}`);
        console.log(`🔥 Calories (208): ${calories ? `${calories.amount} ${calories.nutrient.unitName}` : 'NOT FOUND'}`);
        
    } catch (error) {
        console.error(`❌ Error: ${error.response?.status} ${error.response?.data?.message || error.message}`);
    }
}

debugNutrientStructure().catch(console.error);
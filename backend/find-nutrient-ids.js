const axios = require('axios');
require('dotenv').config();

async function findNutrientIds() {
    const apiKey = process.env.FOODDATA_CENTRAL_API_KEY;
    
    try {
        // Get a known food with good nutrition data
        const detailUrl = `https://api.nal.usda.gov/fdc/v1/food/171287?api_key=${apiKey}`; // Known egg ID
        const response = await axios.get(detailUrl, { timeout: 12000 });
        
        const nutrients = response.data.foodNutrients || [];
        console.log(`📊 Food: "${response.data.description}"`);
        
        // Search for sodium, sugars, fiber in all nutrients
        console.log('\n🔍 Searching for key nutrients:');
        
        nutrients.forEach(nutrient => {
            const name = (nutrient.nutrient?.name || '').toLowerCase();
            const id = nutrient.nutrient?.id;
            const amount = nutrient.amount;
            const unit = nutrient.nutrient?.unitName;
            
            if (name.includes('sodium') || name.includes('salt')) {
                console.log(`🧂 SODIUM - ID ${id}: ${name} = ${amount} ${unit}`);
            }
            if (name.includes('sugar') || name.includes('glucose') || name.includes('fructose')) {
                console.log(`🍯 SUGAR - ID ${id}: ${name} = ${amount} ${unit}`);
            }
            if (name.includes('fiber') || name.includes('fibre')) {
                console.log(`🌾 FIBER - ID ${id}: ${name} = ${amount} ${unit}`);
            }
            if (name.includes('protein')) {
                console.log(`🥩 PROTEIN - ID ${id}: ${name} = ${amount} ${unit}`);
            }
            if (name.includes('fat') && name.includes('saturated')) {
                console.log(`🧈 SAT FAT - ID ${id}: ${name} = ${amount} ${unit}`);
            }
            if (name.includes('carbohydrate') && !name.includes('fiber')) {
                console.log(`🌾 CARBS - ID ${id}: ${name} = ${amount} ${unit}`);
            }
        });
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

findNutrientIds().catch(console.error);
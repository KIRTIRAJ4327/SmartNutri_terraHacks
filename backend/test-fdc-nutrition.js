const axios = require('axios');
require('dotenv').config();

async function testNutritionData() {
    const apiKey = process.env.FOODDATA_CENTRAL_API_KEY;
    
    // Test with more generic terms that should have complete nutrition data
    const testProducts = [
        'chicken breast raw',
        'turkey ground raw', 
        'tomatoes canned',
        'egg whole raw',
        'cheese monterey'
    ];

    for (const product of testProducts) {
        try {
            console.log(`\n🧪 Testing: "${product}"`);
            
            const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`;
            const searchBody = {
                query: product,
                dataType: ["Foundation", "Survey (FNDDS)", "Branded"],
                pageSize: 5,
                sortBy: "dataType.keyword",
                sortOrder: "asc"
            };

            const response = await axios.post(searchUrl, searchBody, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 12000
            });

            console.log(`✅ Found foods: ${response.data.foods?.length || 0}`);
            
            if (response.data.foods && response.data.foods.length > 0) {
                // Find the best match with most nutrition data
                let bestFood = null;
                let maxNutrients = 0;
                
                for (const food of response.data.foods.slice(0, 3)) {
                    const detailUrl = `https://api.nal.usda.gov/fdc/v1/food/${food.fdcId}?api_key=${apiKey}`;
                    const detailResponse = await axios.get(detailUrl, { timeout: 12000 });
                    
                    const nutrients = detailResponse.data.foodNutrients || [];
                    console.log(`📝 "${food.description}" (${food.dataType}): ${nutrients.length} nutrients`);
                    
                    if (nutrients.length > maxNutrients) {
                        maxNutrients = nutrients.length;
                        bestFood = detailResponse.data;
                    }
                }
                
                if (bestFood) {
                    const nutrients = bestFood.foodNutrients;
                    const sodium = nutrients.find(n => n.nutrient?.id === 307);
                    const sugars = nutrients.find(n => n.nutrient?.id === 269);
                    const protein = nutrients.find(n => n.nutrient?.id === 203);
                    const fiber = nutrients.find(n => n.nutrient?.id === 291);
                    
                    console.log(`🥇 BEST: "${bestFood.description}" (${maxNutrients} nutrients)`);
                    console.log(`🧂 Sodium: ${sodium ? `${sodium.amount} ${sodium.nutrient.unitName}` : 'Not found'}`);
                    console.log(`🍯 Sugars: ${sugars ? `${sugars.amount} ${sugars.nutrient.unitName}` : 'Not found'}`);
                    console.log(`🥩 Protein: ${protein ? `${protein.amount} ${protein.nutrient.unitName}` : 'Not found'}`);
                    console.log(`🌾 Fiber: ${fiber ? `${fiber.amount} ${fiber.nutrient.unitName}` : 'Not found'}`);
                }
            }
            
        } catch (error) {
            console.error(`❌ Failed: ${error.response?.status} ${error.response?.data?.message || error.message}`);
        }
    }
}

testNutritionData().catch(console.error);
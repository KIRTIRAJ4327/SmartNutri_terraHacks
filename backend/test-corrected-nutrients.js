const axios = require('axios');
require('dotenv').config();

function extractFDCNutrient(nutrients, nutrientIds) {
    for (const nutrientId of nutrientIds) {
        const nutrient = nutrients.find(n => n.nutrient?.id === nutrientId);
        if (nutrient && nutrient.amount) {
            return nutrient.amount;
        }
    }
    return 0;
}

async function testCorrectedNutrients() {
    const apiKey = process.env.FOODDATA_CENTRAL_API_KEY;
    
    try {
        // Test with egg (known good food)
        const detailUrl = `https://api.nal.usda.gov/fdc/v1/food/171287?api_key=${apiKey}`;
        const response = await axios.get(detailUrl, { timeout: 12000 });
        
        const nutrients = response.data.foodNutrients || [];
        console.log(`📊 Food: "${response.data.description}"`);
        
        // Test corrected nutrient extraction
        const sodium = extractFDCNutrient(nutrients, [1093]);
        const sugars = extractFDCNutrient(nutrients, [1012, 1013, 1011]);
        const protein = extractFDCNutrient(nutrients, [1003]);
        const fiber = extractFDCNutrient(nutrients, [1079]);
        const saturatedFat = extractFDCNutrient(nutrients, [1258]);
        const carbs = extractFDCNutrient(nutrients, [1005]);
        
        console.log('\n✅ CORRECTED EXTRACTION:');
        console.log(`🧂 Sodium: ${sodium} mg`);
        console.log(`🍯 Sugars: ${sugars} g`);
        console.log(`🥩 Protein: ${protein} g`);
        console.log(`🌾 Fiber: ${fiber} g`);
        console.log(`🧈 Saturated Fat: ${saturatedFat} g`);
        console.log(`🌾 Carbs: ${carbs} g`);
        
        // Test another food - ground turkey
        console.log('\n🧪 Testing ground turkey...');
        const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`;
        const searchBody = {
            query: "ground turkey raw",
            dataType: ["Foundation", "Survey (FNDDS)", "Branded"],
            pageSize: 3
        };

        const searchResponse = await axios.post(searchUrl, searchBody, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 12000
        });

        if (searchResponse.data.foods && searchResponse.data.foods.length > 0) {
            const firstFood = searchResponse.data.foods[0];
            const turkeyDetailUrl = `https://api.nal.usda.gov/fdc/v1/food/${firstFood.fdcId}?api_key=${apiKey}`;
            const turkeyResponse = await axios.get(turkeyDetailUrl, { timeout: 12000 });
            
            const turkeyNutrients = turkeyResponse.data.foodNutrients || [];
            console.log(`📊 Food: "${turkeyResponse.data.description}"`);
            
            const turkeySodium = extractFDCNutrient(turkeyNutrients, [1093]);
            const turkeySugars = extractFDCNutrient(turkeyNutrients, [1012, 1013, 1011]);
            const turkeyProtein = extractFDCNutrient(turkeyNutrients, [1003]);
            
            console.log(`🧂 Turkey Sodium: ${turkeySodium} mg`);
            console.log(`🍯 Turkey Sugars: ${turkeySugars} g`);
            console.log(`🥩 Turkey Protein: ${turkeyProtein} g`);
        }
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
    }
}

testCorrectedNutrients().catch(console.error);
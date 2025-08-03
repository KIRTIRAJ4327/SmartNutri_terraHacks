const axios = require('axios');
require('dotenv').config();

async function testImprovedFDC() {
    const apiKey = process.env.FOODDATA_CENTRAL_API_KEY;
    console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
    
    if (!apiKey) {
        console.error('❌ No API key found in .env file');
        return;
    }

    // Test improved POST search for Costco products
    const testProducts = [
        'chicken breast',
        'ground turkey', 
        'diced tomatoes',
        'eggs',
        'monterey jack cheese'
    ];

    for (const product of testProducts) {
        try {
            console.log(`\n🧪 Testing: "${product}"`);
            
            const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${apiKey}`;
            const searchBody = {
                query: product,
                dataType: ["Branded", "Foundation", "Survey (FNDDS)"],
                pageSize: 3,
                sortBy: "dataType.keyword",
                sortOrder: "asc"
            };

            const response = await axios.post(searchUrl, searchBody, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 12000
            });

            console.log(`✅ Status: ${response.status}`);
            console.log(`✅ Found foods: ${response.data.foods?.length || 0}`);
            
            if (response.data.foods && response.data.foods.length > 0) {
                const firstResult = response.data.foods[0];
                console.log(`📝 Best match: "${firstResult.description}" (${firstResult.dataType})`);
                
                // Get detailed nutrition data
                const detailUrl = `https://api.nal.usda.gov/fdc/v1/food/${firstResult.fdcId}?api_key=${apiKey}`;
                const detailResponse = await axios.get(detailUrl, { timeout: 12000 });
                
                const nutrients = detailResponse.data.foodNutrients || [];
                const sodium = nutrients.find(n => n.nutrient?.id === 307);
                const sugars = nutrients.find(n => n.nutrient?.id === 269);
                const protein = nutrients.find(n => n.nutrient?.id === 203);
                
                console.log(`🧂 Sodium: ${sodium ? `${sodium.amount} ${sodium.nutrient.unitName}` : 'Not found'}`);
                console.log(`🍯 Sugars: ${sugars ? `${sugars.amount} ${sugars.nutrient.unitName}` : 'Not found'}`);
                console.log(`🥩 Protein: ${protein ? `${protein.amount} ${protein.nutrient.unitName}` : 'Not found'}`);
            }
            
        } catch (error) {
            console.error(`❌ Failed: ${error.response?.status} ${error.response?.data?.message || error.message}`);
        }
    }
}

testImprovedFDC().catch(console.error);
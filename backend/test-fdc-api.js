const axios = require('axios');
require('dotenv').config();

async function testFDCAPI() {
    const apiKey = process.env.FOODDATA_CENTRAL_API_KEY;
    console.log('🔑 API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND');
    
    if (!apiKey) {
        console.error('❌ No API key found in .env file');
        return;
    }

    // Test 1: Simple search
    try {
        console.log('\n🧪 Test 1: Simple search for "chicken breast"');
        const searchUrl = 'https://api.nal.usda.gov/fdc/v1/foods/search';
        const params = {
            api_key: apiKey,
            query: 'chicken breast',
            pageSize: 3
        };

        console.log('📡 Request URL:', searchUrl);
        console.log('📡 Request params:', params);

        const response = await axios.get(searchUrl, { 
            params,
            timeout: 10000
        });

        console.log('✅ Status:', response.status);
        console.log('✅ Found foods:', response.data.foods?.length || 0);
        if (response.data.foods && response.data.foods.length > 0) {
            console.log('🍗 First result:', {
                description: response.data.foods[0].description,
                fdcId: response.data.foods[0].fdcId,
                dataType: response.data.foods[0].dataType
            });
        }
    } catch (error) {
        console.error('❌ Test 1 failed:', error.response?.status, error.response?.data || error.message);
    }

    // Test 2: Detail lookup (if we got an ID from test 1)
    try {
        console.log('\n🧪 Test 2: Detail lookup for a known food ID');
        const detailUrl = 'https://api.nal.usda.gov/fdc/v1/food/2346645'; // Known chicken breast ID
        const params = { api_key: apiKey };

        const response = await axios.get(detailUrl, { 
            params,
            timeout: 10000
        });

        console.log('✅ Status:', response.status);
        console.log('✅ Food name:', response.data.description);
        console.log('✅ Nutrients found:', response.data.foodNutrients?.length || 0);
        
        // Find sodium (307) and sugars (269)
        const nutrients = response.data.foodNutrients || [];
        const sodium = nutrients.find(n => n.nutrient?.id === 307);
        const sugars = nutrients.find(n => n.nutrient?.id === 269);
        
        console.log('🧂 Sodium:', sodium ? `${sodium.amount} ${sodium.nutrient.unitName}` : 'Not found');
        console.log('🍯 Sugars:', sugars ? `${sugars.amount} ${sugars.nutrient.unitName}` : 'Not found');
        
    } catch (error) {
        console.error('❌ Test 2 failed:', error.response?.status, error.response?.data || error.message);
    }
}

testFDCAPI().catch(console.error);
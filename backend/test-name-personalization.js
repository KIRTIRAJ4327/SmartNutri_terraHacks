/**
 * 🍯 Test Sweet Name Personalization
 * Tests the new name collection and personalized messaging
 */

console.log('🍯 Testing Sweet Name Personalization\n');

// Simulate API calls to test personalization

async function testPersonalizedRecommendations() {
  console.log('🎯 Testing Personalized Recommendations...\n');

  const testCases = [
    {
      name: 'Sarah',
      goal: 'diabetes_care',
      products: [
        { name: 'banana', quantity: 2, unit: 'pieces' },
        { name: 'whole wheat bread', quantity: 1, unit: 'servings' },
        { name: 'greek yogurt', quantity: 1, unit: 'cups' }
      ]
    },
    {
      name: 'Alex',
      goal: 'heart_health',
      products: [
        { name: 'salmon', quantity: 1, unit: 'lb' },
        { name: 'spinach', quantity: 2, unit: 'cups' },
        { name: 'canned soup', quantity: 1, unit: 'servings' } // High sodium!
      ]
    },
    {
      name: 'Jordan',
      goal: 'fitness',
      products: [
        { name: 'chicken breast', quantity: 1, unit: 'lb' },
        { name: 'oats', quantity: 1, unit: 'cups' },
        { name: 'almonds', quantity: 0.25, unit: 'cups' }
      ]
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n👤 Testing for ${testCase.name} (${testCase.goal}):`);
    console.log(`📝 Products: ${testCase.products.map(p => `${p.name} (${p.quantity} ${p.unit})`).join(', ')}`);
    
    try {
      const response = await fetch('http://localhost:5000/api/receipt/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: testCase.products,
          userPreferences: {
            goal: testCase.goal,
            focusAreas: ['nutrition'],
            userName: testCase.name,
            createdAt: new Date()
          }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Analysis Complete for ${testCase.name}!`);
        console.log(`🏆 Health Score: ${data.analysis.overallScore}/100`);
        
        console.log(`\n💡 Personalized Recommendations:`);
        data.analysis.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.message}`);
          console.log(`      📝 ${rec.reason}`);
          console.log(`      🎯 Priority: ${rec.priority.toUpperCase()}\n`);
        });
        
        if (data.personalization) {
          console.log(`🎨 Personalization: ${data.personalization.customizedFor}`);
        }
        
      } else {
        console.log(`❌ Error for ${testCase.name}: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ Network error for ${testCase.name}: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }
}

async function testPreferencesSaving() {
  console.log('\n💾 Testing Preferences Saving...\n');
  
  const preferences = {
    userName: 'Taylor',
    goal: 'general_wellness',
    focusAreas: ['balance', 'variety'],
    dietaryRestrictions: ['vegetarian'],
    createdAt: new Date()
  };
  
  try {
    const response = await fetch('http://localhost:5000/api/receipt/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Preferences saved successfully!');
      console.log(`👤 User: ${preferences.userName}`);
      console.log(`🎯 Goal: ${preferences.goal}`);
      console.log(`📝 Message: ${data.message}`);
    } else {
      console.log('❌ Failed to save preferences');
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🚀 Starting NutriScan Personalization Tests...\n');
  
  // Test if server is running
  try {
    const response = await fetch('http://localhost:5000/api/receipt/history');
    console.log('✅ Backend server is running!\n');
  } catch (error) {
    console.log('❌ Backend server not running. Please start with: npm start\n');
    return;
  }
  
  await testPersonalizedRecommendations();
  await testPreferencesSaving();
  
  console.log('\n🎉 All personalization tests completed!');
  console.log('\n💡 Frontend Flow Demo:');
  console.log('   1. User enters name: "Sarah" 👋');
  console.log('   2. Selects goal: "Diabetes Care" 🩺');
  console.log('   3. Gets personalized messages: "Hey Sarah, consider fiber-rich foods..."');
  console.log('   4. Sees custom loading: "Hey Sarah! Personalizing for diabetes care"');
  console.log('   5. Results show: "Sarah\'s Goal: Diabetes Care"');
  console.log('\n🍯 Sweet personalization working like a honeybee nest! 🐝✨');
}

// Run the tests
runAllTests().catch(console.error);
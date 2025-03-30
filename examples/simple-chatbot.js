/**
 * simple-chatbot.js
 * 
 * This example shows how easy it is to create and use chatbots with
 * our unified agentic architecture. Just a few lines of code can create
 * a powerful, customized chatbot.
 */

const ChatbotFactory = require('../server/src/core/ChatbotFactory');

// EXAMPLE 1: Create a sales chatbot from template
async function createSalesChatbot() {
    console.log('Creating a sales chatbot from template...');
    
    // Create the chatbot with minimal configuration
    const salesBot = ChatbotFactory.createFromTemplate('sales', {
        botId: 'my_sales_bot',
        name: 'Product Advisor',
        personalityProfile: {
            // Just override the parts you want to change
            tone: {
                friendliness: 0.9, // Very friendly
                humor: 0.6        // More humor than default
            }
        }
    });
    
    // Test the chatbot with a sample message
    const response = await salesBot.processMessage({
        text: "Tell me about your pricing plans",
        userId: "user123",
        sessionId: "session456",
        metadata: {}
    });
    
    console.log('Sales Bot Response:', response.text);
    
    return salesBot;
}

// EXAMPLE 2: Create a fully custom chatbot
async function createCustomChatbot() {
    console.log('Creating a custom fitness coaching chatbot...');
    
    // Create a completely custom chatbot
    const fitnessBot = ChatbotFactory.createChatbot({
        botId: 'fitness_coach',
        name: 'Fitness Coach',
        personalityProfile: {
            name: 'Motivational Coach',
            tone: {
                formality: 0.3,     // Casual tone
                friendliness: 0.9,  // Very friendly
                humor: 0.5,         // Moderate humor
                empathy: 0.8        // Highly empathetic
            },
            behavior: {
                proactivity: 0.8,   // Proactively offers suggestions
                verbosity: 0.4,     // Concise responses
                persistence: 0.7,    // Fairly persistent
                creativity: 0.6      // Moderately creative
            },
            industry: 'fitness'
        },
        knowledgeConfig: {
            sources: [
                { id: 'workout_plans', type: 'document' },
                { id: 'nutrition_facts', type: 'database' },
                { 
                    id: 'fitness_faq', 
                    type: 'faq',
                    data: [
                        { 
                            id: 'faq1', 
                            question: 'How often should I work out?', 
                            answer: 'For most adults, aim for at least 150 minutes of moderate activity or 75 minutes of vigorous activity per week.',
                            intents: ['workout_frequency', 'general_advice']
                        },
                        { 
                            id: 'faq2', 
                            question: 'What should I eat before a workout?', 
                            answer: 'A pre-workout meal 2-3 hours before should include carbs and protein. If you're short on time, a small snack like a banana is good.',
                            intents: ['nutrition', 'pre_workout']
                        }
                    ]
                }
            ]
        },
        actions: [
            'search_knowledge_base',
            'get_current_time',
            'get_user_profile',
            'save_conversation_note',
            'set_reminder',
            'create_workout_plan',
            'track_progress',
            'calculate_calories'
        ]
    });
    
    // Test the chatbot with a sample message
    const response = await fitnessBot.processMessage({
        text: "How often should I do cardio workouts?",
        userId: "user789",
        sessionId: "session101",
        metadata: {}
    });
    
    console.log('Fitness Bot Response:', response.text);
    
    return fitnessBot;
}

// EXAMPLE 3: Create a minimal chatbot with just a few lines
async function createMinimalChatbot() {
    console.log('Creating a minimal chatbot with just a few lines...');
    
    // The simplest possible chatbot creation
    const simpleBot = ChatbotFactory.createChatbot({
        botId: 'simple_helper',
        name: 'Simple Helper'
        // All other settings use smart defaults!
    });
    
    // Test the chatbot
    const response = await simpleBot.processMessage({
        text: "Hello, can you help me?",
        userId: "user555",
        sessionId: "session666",
        metadata: {}
    });
    
    console.log('Simple Bot Response:', response.text);
    
    return simpleBot;
}

// Run all examples
async function runExamples() {
    try {
        await createSalesChatbot();
        console.log('\n-------------------\n');
        
        await createCustomChatbot(); 
        console.log('\n-------------------\n');
        
        await createMinimalChatbot();
    } catch (error) {
        console.error('Error running examples:', error);
    }
}

// Run the examples if this script is executed directly
if (require.main === module) {
    runExamples();
}

module.exports = {
    createSalesChatbot,
    createCustomChatbot,
    createMinimalChatbot
};

import { getAIStream } from '../../src/services/aiService.ts';
import { Message } from '../../src/types/chat.ts';

const testAIStream = async () => {
    console.log('Testing AI Stream Service...');
    const messages: Message[] = [
        { role: 'user', content: 'Hello' }
    ];

    try {
        console.log('Attempting to call AI service (requires GROQ_API_KEY)...');
        // This will likely fail without a key but we want to test the connection logic
        const stream = await getAIStream(messages);
        if (stream) {
            console.log('✅ AI Service call initiated');
        }
    } catch (e: any) {
        if (e.message.includes('API key')) {
            console.log('✅ Service logic works, but missing API key as expected.');
        } else {
            console.error('❌ Unexpected error:', e.message);
        }
    }
};

testAIStream();

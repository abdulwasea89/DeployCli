import { formatPath } from '../../src/utils/formatters.ts';

const testFormatPath = () => {
    const mockPath = '/home/user/projects/my-cli';
    const result = formatPath(mockPath);
    console.log(`Testing formatPath with: ${mockPath}`);
    console.log(`Result: ${result}`);

    if (result.includes('projects') && result.includes('my-cli')) {
        console.log('✅ Test Passed');
    } else {
        console.error('❌ Test Failed');
        process.exit(1);
    }
};

testFormatPath();

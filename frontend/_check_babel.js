const m = require('nativewind/babel');
console.log('type:', typeof m);
console.log('keys:', Object.keys(m));
const result = m({});
console.log('result type:', typeof result);
console.log('result keys:', Object.keys(result));
console.log('result:', JSON.stringify(result, null, 2));

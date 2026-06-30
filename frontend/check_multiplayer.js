const fs = require('fs');
const content = fs.readFileSync('src/pages/Multiplayer.jsx', 'utf8');
console.log('File size:', content.length, 'bytes');
console.log('Has framer-motion:', content.includes('framer-motion'));
console.log('Has motion.:', content.includes('motion.'));
console.log('Has import io:', content.includes("import { io }"));
console.log('Has export default:', content.includes('export default'));
console.log('Starts with:', content.substring(0, 100));
console.log('Ends with:', content.substring(content.length - 100));

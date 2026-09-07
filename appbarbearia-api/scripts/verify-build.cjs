const { existsSync } = require('node:fs');
const path = require('node:path');

const entry = path.resolve(__dirname, '../dist/main.js');
if (!existsSync(entry)) {
  console.error('Build incompleto: dist/main.js não foi gerado. Verifique tsconfig.build.json.');
  process.exit(1);
}
console.log('Build verificado: dist/main.js está disponível para npm run start.');

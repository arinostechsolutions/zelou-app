const fs = require('fs');
const path = require('path');

const dirsToRemove = [
  'node_modules',
  'android/build',
  'android/.gradle',
  'android/app/build',
  '.expo',
  '.expo-shared'
];

console.log('🧹 Limpando diretórios...\n');

dirsToRemove.forEach(dir => {
  const fullPath = path.join(__dirname, '..', dir);
  try {
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`✅ Removido: ${dir}`);
    } else {
      console.log(`⏭️  Não encontrado: ${dir}`);
    }
  } catch (error) {
    console.log(`❌ Erro ao remover ${dir}:`, error.message);
  }
});

console.log('\n✨ Limpeza concluída!');


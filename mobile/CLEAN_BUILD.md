# Instruções para Limpar e Reconstruir o Build Android

## Problema
Erro de resolução de dependências do Gradle: "No matching variant of project :react-native-XXX was found"

## Solução: Limpeza Completa

### 1. Limpar Caches e Builds

Execute os seguintes comandos na pasta `mobile`:

```bash
# Limpar node_modules
rm -rf node_modules

# Limpar builds do Android
rm -rf android/build
rm -rf android/.gradle
rm -rf android/app/build

# Limpar cache do Expo
rm -rf .expo
rm -rf .expo-shared
```

### 2. Reinstalar Dependências

```bash
# Reinstalar todas as dependências
npm install
```

### 3. Limpar Cache do Gradle (se necessário)

```bash
cd android
./gradlew clean
cd ..
```

### 4. Re-gerar Projeto Android (se necessário)

```bash
# Re-gerar o diretório android com configurações limpas
npx expo prebuild --clean
```

### 5. Rebuild

```bash
# Para build local
npx expo run:android

# Para build de produção (EAS)
eas build --platform android
```

## Scripts NPM Disponíveis

Você também pode usar os scripts adicionados ao `package.json`:

```bash
# Limpar tudo
npm run clean

# Limpar apenas Android
npm run clean:android

# Re-gerar projeto Android
npm run prebuild:clean
```

## Notas Importantes

- Sempre execute `npm install` após limpar `node_modules`
- O comando `expo prebuild --clean` irá re-gerar o diretório `android/` completamente
- Se o problema persistir, verifique se todas as dependências estão nas versões corretas para Expo SDK 54


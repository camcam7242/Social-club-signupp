const fs = require('fs');
const path = require('path');

const gradleFile = path.join(
  __dirname,
  '../node_modules/expo-modules-core/android/ExpoModulesCorePlugin.gradle'
);

if (!fs.existsSync(gradleFile)) {
  console.log('ExpoModulesCorePlugin.gradle not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(gradleFile, 'utf8');

if (content.includes('from components.release')) {
  content = content.replace(
    'from components.release',
    'from components.findByName("release")'
  );
  fs.writeFileSync(gradleFile, content);
  console.log('Patched ExpoModulesCorePlugin.gradle: fixed components.release');
} else {
  console.log('ExpoModulesCorePlugin.gradle already patched or different format');
}

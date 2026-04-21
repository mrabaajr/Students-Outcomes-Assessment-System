const fs = require("fs");
const path = require("path");

const gradlePluginDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "expo-modules-core",
  "expo-module-gradle-plugin"
);

const gradlePluginBuildFile = path.join(gradlePluginDir, "build.gradle.kts");

if (!fs.existsSync(gradlePluginBuildFile)) {
  console.warn(
    "[patch-expo-gradle-plugin] expo-modules-core Gradle plugin not found; skipping patch."
  );
  process.exit(0);
}

let contents = fs.readFileSync(gradlePluginBuildFile, "utf8");

if (contents.includes("gradleKotlinDsl()")) {
  console.log("[patch-expo-gradle-plugin] Gradle Kotlin DSL dependency already present.");
} else if (contents.includes("  implementation(gradleApi())")) {
  const target = "  implementation(gradleApi())";
  const replacement = `${target}\n  implementation(gradleKotlinDsl())`;
  contents = contents.replace(target, replacement);
  fs.writeFileSync(gradlePluginBuildFile, contents);
  console.log("[patch-expo-gradle-plugin] Added Gradle Kotlin DSL dependency.");
} else {
  console.warn(
    "[patch-expo-gradle-plugin] Expected gradleApi dependency not found; skipping build file patch."
  );
}

const sourcePatches = [
  path.join(
    gradlePluginDir,
    "src",
    "main",
    "kotlin",
    "expo",
    "modules",
    "plugin",
    "ExpoModulesGradlePlugin.kt"
  ),
  path.join(
    gradlePluginDir,
    "src",
    "main",
    "kotlin",
    "expo",
    "modules",
    "plugin",
    "ProjectConfiguration.kt"
  ),
  path.join(
    gradlePluginDir,
    "src",
    "main",
    "kotlin",
    "expo",
    "modules",
    "plugin",
    "gradle",
    "ExpoModuleExtension.kt"
  ),
];

let patchedSourceCount = 0;

for (const sourceFile of sourcePatches) {
  if (!fs.existsSync(sourceFile)) {
    console.warn(`[patch-expo-gradle-plugin] Missing source file: ${sourceFile}`);
    continue;
  }

  let source = fs.readFileSync(sourceFile, "utf8");
  const original = source;

  source = source.replace(/\nimport org\.gradle\.internal\.extensions\.core\.extra/g, "");
  source = source.replace(/\brootProject\.extra\.safeGet/g, "rootProject.extensions.extraProperties.safeGet");
  source = source.replace(/\bproject\.rootProject\.extra\.safeGet/g, "project.rootProject.extensions.extraProperties.safeGet");
  source = source.replace(/\bextra\.set\(/g, "extensions.extraProperties.set(");

  if (source !== original) {
    fs.writeFileSync(sourceFile, source);
    patchedSourceCount += 1;
  }
}

console.log(`[patch-expo-gradle-plugin] Patched ${patchedSourceCount} Gradle plugin source file(s).`);

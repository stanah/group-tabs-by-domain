const packageJson = require("../package.json");
const newVersion = packageJson.version;
const fs = require("fs").promises;

async function updateManifest() {
  try {
    const data = await fs.readFile("src/manifest.json", "utf8");
    const manifest = JSON.parse(data);
    manifest.version = newVersion;
    await fs.writeFile("src/manifest.json", JSON.stringify(manifest, null, 2));
    console.log("manifest.jsonのバージョンが更新されました");
  } catch (err) {
    console.error(err);
  }
}

updateManifest();

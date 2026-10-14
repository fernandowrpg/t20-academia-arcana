import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import AdmZip from "adm-zip";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(RAIZ, "dist");
const PASTAS = ["module", "templates", "styles", "lang", "packs", "assets"];
const ARQUIVOS = ["README.md", "CHANGELOG.md", "LICENSE"];
// A imagem do mapa é arte do Manual do Arcano: só entra no zip com --com-mapa (para uso próprio, nunca na release pública).
const COM_MAPA = process.argv.includes("--com-mapa");

const pkg = JSON.parse(readFileSync(join(RAIZ, "package.json"), "utf8"));
const repo = pkg.foundry?.github;
if (!repo || repo.startsWith("SEU-USUARIO")) {
	console.warn("Aviso: defina \"foundry.github\" no package.json (ex.: \"fulano/academia-arcana\") para gerar URLs corretas.");
}
if (!existsSync(join(RAIZ, "packs", "compendio"))) {
	console.error("Packs não encontrados. Rode \"npm run build:packs\" antes.");
	process.exit(1);
}

const versao = pkg.version;
const base = `https://github.com/${repo}`;
const manifesto = JSON.parse(readFileSync(join(RAIZ, "module.json"), "utf8"));
Object.assign(manifesto, {
	version: versao,
	url: base,
	manifest: `${base}/releases/latest/download/module.json`,
	download: `${base}/releases/download/v${versao}/module.zip`,
	bugs: `${base}/issues`,
	readme: `${base}/blob/main/README.md`,
	changelog: `${base}/blob/main/CHANGELOG.md`
});
const json = `${JSON.stringify(manifesto, null, "\t")}\n`;
writeFileSync(join(RAIZ, "module.json"), json);

rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
writeFileSync(join(DIST, "module.json"), json);

const zip = new AdmZip();
zip.addFile("module.json", Buffer.from(json, "utf8"));
for (const pasta of PASTAS) {
	const origem = join(RAIZ, pasta);
	const incluir = (nome) => !/(^|[\\/])(LOCK|LOG(\.old)?)$/.test(nome) && (COM_MAPA || !/^assets[\\/]mapas[\\/]/.test(nome));
	if (existsSync(origem)) zip.addLocalFolder(origem, pasta, incluir);
}
for (const arquivo of ARQUIVOS) {
	const origem = join(RAIZ, arquivo);
	if (existsSync(origem)) zip.addLocalFile(origem);
}
zip.writeZip(join(DIST, "module.zip"));

console.log(`Release v${versao} pronta em dist/: module.json e module.zip`);
console.log(`Manifesto: ${manifesto.manifest}`);

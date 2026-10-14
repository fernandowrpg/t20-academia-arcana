import { mkdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractPack } from "@foundryvtt/foundryvtt-cli";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DESTINO = join(RAIZ, "extraido");

rmSync(DESTINO, { recursive: true, force: true });
for (const nome of ["compendio", "macros", "ambientes", "mapa"]) {
	const pasta = join(DESTINO, nome);
	mkdirSync(pasta, { recursive: true });
	await extractPack(join(RAIZ, "packs", nome), pasta, { log: true });
}
console.log("Packs extraídos em extraido/ (somente para conferência; a fonte oficial é src/).");

import { MODULO } from "./config.mjs";

const FONTES = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=IM+Fell+English:ital@0;1&display=swap";

export function registrarTema() {
	game.settings.register(MODULO, "tema", {
		name: "ACADEMIA.Config.tema.Nome",
		hint: "ACADEMIA.Config.tema.Dica",
		scope: "client",
		config: true,
		type: String,
		choices: {
			tudo: "ACADEMIA.Config.tema.Tudo",
			modulo: "ACADEMIA.Config.tema.Modulo",
			desligado: "ACADEMIA.Config.tema.Desligado"
		},
		default: "tudo",
		requiresReload: true
	});
}

/* O tema é claro: as janelas que ele cobre passam a usar o esquema claro do Foundry, para o texto ficar escuro. */
function clarear(elemento) {
	if (!elemento?.classList) return;
	elemento.classList.remove("theme-dark");
	elemento.classList.add("themed", "theme-light");
}

export function aplicarTema() {
	const modo = game.settings.get(MODULO, "tema");
	if (modo !== "tudo" && modo !== "modulo") return;
	document.body.classList.add(`aa-tema-${modo}`);

	const fontes = document.createElement("link");
	fontes.rel = "stylesheet";
	fontes.href = FONTES;
	document.head.append(fontes);

	const cobre = (elemento) => modo === "tudo" || elemento?.classList?.contains("academia-arcana");
	Hooks.on("renderApplicationV2", (app, elemento) => {
		const raiz = app.element ?? elemento;
		if (cobre(raiz)) clarear(raiz);
	});
	Hooks.on("renderApplication", (app, html) => {
		const raiz = html instanceof HTMLElement ? html : html?.[0];
		if (cobre(raiz)) clarear(raiz);
	});
	if (modo === "tudo") {
		for (const gancho of ["setup", "ready"]) Hooks.once(gancho, () => clarear(document.body));
	}
}

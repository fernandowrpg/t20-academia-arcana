import { MODULO, aoMudarConfiguracao, contextoCatalogo, ehAluno, lerAluno, registrarConfiguracoes } from "./config.mjs";
import { VidaAcademicaApp } from "./apps/vida-academica.mjs";
import { SecretariaApp } from "./apps/secretaria.mjs";
import { CatalogoApp } from "./apps/catalogo.mjs";
import { CalendarioApp } from "./apps/calendario.mjs";
import { GeradorAlunosApp } from "./apps/gerador.mjs";
import { PainelAlunosApp } from "./apps/painel-alunos.mjs";
import { PainelAmeacasApp } from "./apps/painel-ameacas.mjs";
import * as dados from "./data/disciplinas.mjs";
import * as logica from "./logica.mjs";
import * as geracao from "./gerador.mjs";

const atualizarPainelAlunos = foundry.utils.debounce(() => PainelAlunosApp.sincronizar(), 100);
const atualizarPainelAmeacas = foundry.utils.debounce(() => PainelAmeacasApp.sincronizar(), 100);

function abrir(actor) {
	actor ??= canvas?.tokens?.controlled[0]?.actor ?? game.user.character;
	return VidaAcademicaApp.abrir(actor);
}

Hooks.once("init", () => {
	registrarConfiguracoes(CatalogoApp);
	aoMudarConfiguracao(() => {
		VidaAcademicaApp.atualizarTodas();
		SecretariaApp.atualizar();
		CalendarioApp.atualizar();
		atualizarPainelAlunos();
		atualizarPainelAmeacas();
	});
	game.modules.get(MODULO).api = {
		abrir,
		secretaria: () => SecretariaApp.abrir(),
		catalogo: () => new CatalogoApp().render({ force: true }),
		calendario: () => CalendarioApp.abrir(),
		gerador: () => GeradorAlunosApp.abrir(),
		painelAlunos: () => PainelAlunosApp.sincronizar(),
		painelAmeacas: () => PainelAmeacasApp.sincronizar(),
		lerAluno,
		contextoCatalogo,
		dados,
		logica,
		geracao
	};
});

Hooks.once("ready", () => {
	if (game.system.id !== "tormenta20") {
		console.warn(`${MODULO} | Este módulo foi feito para o sistema Tormenta20; sistema atual: ${game.system.id}`);
	}
	PainelAlunosApp.sincronizar();
	PainelAmeacasApp.sincronizar();
});

Hooks.on("updateActor", (actor, mudancas) => {
	atualizarPainelAlunos();
	atualizarPainelAmeacas();
	if ("name" in mudancas) CalendarioApp.atualizar();
	if (!foundry.utils.hasProperty(mudancas, `flags.${MODULO}`)) return;
	VidaAcademicaApp.atualizar(actor);
	SecretariaApp.atualizar();
	CalendarioApp.atualizar();
});

Hooks.on("createActor", (actor) => {
	if (!ehAluno(actor)) return;
	SecretariaApp.atualizar();
	CalendarioApp.atualizar();
});

Hooks.on("deleteActor", () => {
	SecretariaApp.atualizar();
	CalendarioApp.atualizar();
	atualizarPainelAlunos();
});

for (const gancho of [
	"createCombat",
	"updateCombat",
	"deleteCombat",
	"combatStart",
	"createCombatant",
	"updateCombatant",
	"deleteCombatant",
	"updateActorDelta",
	"createActiveEffect",
	"updateActiveEffect",
	"deleteActiveEffect",
	"canvasReady"
]) {
	Hooks.on(gancho, atualizarPainelAmeacas);
}

Hooks.on("updateToken", (token, mudancas) => {
	if ("disposition" in mudancas || "name" in mudancas) atualizarPainelAmeacas();
});

Hooks.on("getActorSheetHeaderButtons", (sheet, botoes) => {
	const actor = sheet.actor ?? sheet.document;
	if (!actor || (actor.type !== "character" && !ehAluno(actor))) return;
	if (!game.user.isGM && !ehAluno(actor)) return;
	botoes.unshift({
		label: game.i18n.localize("ACADEMIA.BotaoFicha"),
		class: "academia-arcana-ficha",
		icon: "fa-solid fa-hat-wizard",
		onclick: () => VidaAcademicaApp.abrir(actor)
	});
});

Hooks.on("getHeaderControlsActorSheetV2", (sheet, controles) => {
	const actor = sheet.document;
	if (!actor || (actor.type !== "character" && !ehAluno(actor))) return;
	if (!game.user.isGM && !ehAluno(actor)) return;
	controles.unshift({
		label: "ACADEMIA.BotaoFicha",
		icon: "fa-solid fa-hat-wizard",
		action: "academiaArcana",
		onClick: () => VidaAcademicaApp.abrir(actor)
	});
});

Hooks.on("renderActorDirectory", (app, html) => {
	const raiz = html instanceof HTMLElement ? html : html?.[0];
	if (!raiz || raiz.querySelector(".academia-arcana-diretorio")) return;
	const destino = raiz.querySelector(".header-actions") ?? raiz.querySelector(".directory-header");
	if (!destino) return;
	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "academia-arcana-diretorio";
	if (game.user.isGM) {
		botao.innerHTML = `<i class="fa-solid fa-building-columns"></i> ${game.i18n.localize("ACADEMIA.Secretaria")}`;
		botao.addEventListener("click", () => SecretariaApp.abrir());
	} else {
		if (!game.user.character || !ehAluno(game.user.character)) return;
		botao.innerHTML = `<i class="fa-solid fa-hat-wizard"></i> ${game.i18n.localize("ACADEMIA.VidaAcademica")}`;
		botao.addEventListener("click", () => VidaAcademicaApp.abrir(game.user.character));
	}
	destino.append(botao);
});

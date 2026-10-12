import { recurso } from "../logica.mjs";
import { MODULO, opcao } from "../config.mjs";
import { PainelFlutuante, barra } from "./painel.mjs";

const LARGURA = 270;
const MAX_CONDICOES = 6;

function modoDoUsuario() {
	return game.user.isGM ? "valores" : opcao("ameacasJogadores");
}

function combateAtual() {
	const combate = game.combats?.viewed ?? game.combat;
	return combate?.started ? combate : null;
}

function ehAmeaca(combatente) {
	if (!combatente.actor || combatente.hasPlayerOwner) return false;
	if (combatente.hidden && !game.user.isGM) return false;
	return combatente.token?.disposition !== CONST.TOKEN_DISPOSITIONS.FRIENDLY;
}

function ameacasDoCombate(combate) {
	return combate ? combate.turns.filter(ehAmeaca) : [];
}

export class PainelAmeacasApp extends PainelFlutuante {
	static CHAVE = "ameacas";

	static instancia = null;

	static deveExibir() {
		return opcao("painelAmeacas") && modoDoUsuario() !== "nenhum" && ameacasDoCombate(combateAtual()).length > 0;
	}

	static DEFAULT_OPTIONS = {
		classes: ["aa-painel-ameacas"],
		actions: {
			focar: PainelAmeacasApp.#focar,
			abrirFicha: PainelAmeacasApp.#abrirFicha
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/painel-ameacas.hbs`, scrollable: [".aa-painel-lista"] }
	};

	posicaoPadrao() {
		const lateral = document.getElementById("sidebar")?.getBoundingClientRect();
		return { left: Math.round((lateral?.left || window.innerWidth) - LARGURA - 16), top: 90 };
	}

	async _prepareContext() {
		const combate = combateAtual();
		const completo = modoDoUsuario() === "valores";
		const daVez = combate?.combatant?.id;
		let pvAtual = 0;
		let pvMaximo = 0;
		const ameacas = ameacasDoCombate(combate).map((c) => {
			const atributos = c.actor.system?.attributes ?? {};
			const pv = recurso(atributos.pv);
			const pm = recurso(atributos.pm);
			const derrotada = c.isDefeated;
			if (pv) {
				pvAtual += Math.max(0, pv.valor);
				pvMaximo += pv.max;
			}
			const condicoes = (c.actor.temporaryEffects ?? []).filter((e) => e.img).map((e) => ({ nome: e.name, img: e.img }));
			return {
				id: c.id,
				nome: c.name,
				img: c.img || c.actor.img,
				daVez: c.id === daVez,
				derrotada,
				caida: derrotada || pv?.faixa === "caido",
				oculta: c.hidden,
				iniciativa: c.initiative ?? "—",
				nd: completo ? (atributos.nd ?? null) : null,
				defesa: completo ? (atributos.defesa?.value ?? null) : null,
				barras: [
					barra("pv", "PV", pv, { numeros: completo }),
					completo && pm?.max > 0 ? barra("pm", "PM", pm) : null
				].filter(Boolean),
				condicoes: condicoes.slice(0, MAX_CONDICOES),
				maisCondicoes: Math.max(0, condicoes.length - MAX_CONDICOES)
			};
		});
		return {
			completo,
			recolhido: this.recolhido,
			rodada: combate?.round ?? 0,
			ameacas,
			total: ameacas.length,
			dePe: ameacas.filter((a) => !a.caida).length,
			pvAtual,
			pvMaximo,
			pvPct: pvMaximo > 0 ? Math.round((pvAtual / pvMaximo) * 100) : 0
		};
	}

	#combatente(alvo) {
		return combateAtual()?.combatants.get(alvo.closest("[data-combatente]")?.dataset.combatente);
	}

	static #focar(event, alvo) {
		const token = this.#combatente(alvo)?.token?.object;
		if (!token) return;
		if (token.isOwner) token.control({ releaseOthers: true });
		canvas.animatePan({ x: token.center.x, y: token.center.y });
	}

	static #abrirFicha(event, alvo) {
		const actor = this.#combatente(alvo)?.actor;
		if (actor?.testUserPermission(game.user, "LIMITED")) actor.sheet.render(true);
	}
}

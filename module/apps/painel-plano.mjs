import { MODULO, opcao } from "../config.mjs";
import { PLANOS } from "../data/planos.mjs";
import { avancarPlano, lerExpedicao, planoAtual, textoEmItens, textoEmParagrafos } from "../planos.mjs";
import { PainelFlutuante } from "./painel.mjs";
import { PlanosApp } from "./planos.mjs";

const LARGURA = 310;

export class PainelPlanoApp extends PainelFlutuante {
	static CHAVE = "plano";

	static instancia = null;

	/* O mestre sempre vê (para escolher o plano); o jogador, só com um plano ativo e se o mestre liberar. */
	static deveExibir() {
		if (!opcao("painelPlano")) return false;
		if (game.user.isGM) return true;
		return opcao("planoJogadores") && !!lerExpedicao().atual;
	}

	static DEFAULT_OPTIONS = {
		classes: ["aa-painel-plano"],
		actions: {
			anterior: PainelPlanoApp.#anterior,
			proximo: PainelPlanoApp.#proximo,
			editar: PainelPlanoApp.#editar,
			wiki: PainelPlanoApp.#wiki
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/painel-plano.hbs`, scrollable: [".aa-plano-corpo"] }
	};

	posicaoPadrao() {
		const lateral = document.getElementById("sidebar")?.getBoundingClientRect();
		return { left: Math.round((lateral?.left || window.innerWidth) - LARGURA - 300), top: 90 };
	}

	async _prepareContext() {
		const gm = game.user.isGM;
		const plano = planoAtual();
		const contexto = { gm, recolhido: this.recolhido, minimizado: this.minimizado, total: PLANOS.length, plano: null };
		if (!plano) return contexto;
		contexto.plano = {
			...plano,
			regras: textoEmItens(plano.regras),
			anotacoes: textoEmParagrafos(plano.anotacoes),
			segredo: gm ? textoEmParagrafos(plano.segredo) : [],
			primeiro: plano.ordem === 1,
			ultimo: plano.ordem === PLANOS.length
		};
		return contexto;
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		const id = context.plano?.id;
		if (id) this.element.dataset.aaPlano = id;
		else delete this.element.dataset.aaPlano;
	}

	static #anterior() {
		if (game.user.isGM) avancarPlano(-1);
	}

	static #proximo() {
		if (game.user.isGM) avancarPlano(1);
	}

	static #editar() {
		PlanosApp.abrir(lerExpedicao().atual || undefined);
	}

	static #wiki() {
		const url = planoAtual()?.wiki;
		if (url) window.open(url, "_blank", "noopener");
	}
}

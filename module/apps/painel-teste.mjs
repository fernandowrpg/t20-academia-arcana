import { MODULO, opcao } from "../config.mjs";
import { contextoDoTeste, lerTeste, marcar, marcarAte, zerarTeste } from "../teste-estendido.mjs";
import { PainelFlutuante } from "./painel.mjs";
import { TesteEstendidoApp } from "./teste-estendido.mjs";

const LARGURA = 300;

/* Painel do teste estendido: aparece para todos quando o mestre o mostra pelo painel do plano. */
export class PainelTesteApp extends PainelFlutuante {
	static CHAVE = "teste";

	static instancia = null;

	static deveExibir() {
		return opcao("painelTeste") && lerTeste().visivel;
	}

	static DEFAULT_OPTIONS = {
		classes: ["aa-painel-teste"],
		actions: {
			marcar: PainelTesteApp.#marcar,
			caixa: PainelTesteApp.#caixa,
			zerar: PainelTesteApp.#zerar,
			editar: PainelTesteApp.#editar
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/painel-teste.hbs`, scrollable: [".aa-teste-corpo"] }
	};

	/* Centralizado no alto da tela, longe dos outros painéis. */
	posicaoPadrao() {
		return { left: Math.round(window.innerWidth / 2 - LARGURA / 2), top: 90 };
	}

	async _prepareContext() {
		return { ...contextoDoTeste(), recolhido: this.recolhido, minimizado: this.minimizado };
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		this.element.dataset.situacao = context.situacao;
	}

	static #marcar(event, alvo) {
		if (!game.user.isGM) return;
		marcar(alvo.dataset.tipo, Number(alvo.dataset.delta) || 0);
	}

	static #caixa(event, alvo) {
		if (!game.user.isGM) return;
		marcarAte(alvo.dataset.tipo, Number(alvo.dataset.indice));
	}

	static #zerar() {
		if (game.user.isGM) zerarTeste();
	}

	static #editar() {
		TesteEstendidoApp.abrir();
	}
}

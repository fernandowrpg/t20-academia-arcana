import { MODULO, opcao } from "../config.mjs";
import { ajustarContador, alternarCdOculta, avancarRodada, contextoDoTeste, lerTeste, marcar, marcarAte, progressoAtual, rolarPericia, zerarTeste } from "../teste-estendido.mjs";
import { macroDoTeste } from "../vault.mjs";
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
			cdOculta: PainelTesteApp.#cdOculta,
			editar: PainelTesteApp.#editar,
			rodada: PainelTesteApp.#rodada,
			contador: PainelTesteApp.#contador,
			rolar: PainelTesteApp.#rolar,
			copiarMacro: PainelTesteApp.#copiarMacro
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

	static #cdOculta() {
		if (game.user.isGM) alternarCdOculta();
	}

	static #zerar() {
		if (game.user.isGM) zerarTeste();
	}

	static #editar() {
		TesteEstendidoApp.abrir();
	}

	static #rodada(event, alvo) {
		if (game.user.isGM) avancarRodada(Number(alvo.dataset.delta) || 0);
	}

	static #contador(event, alvo) {
		if (game.user.isGM) ajustarContador(alvo.dataset.nome, Number(alvo.dataset.delta) || 0);
	}

	/* Qualquer usuário rola a perícia da abordagem com o token selecionado ou o próprio personagem. */
	static #rolar(event, alvo) {
		rolarPericia(alvo.dataset.pericia, Number(alvo.dataset.cd) || null, event);
	}

	static async #copiarMacro() {
		if (!game.user.isGM) return;
		const dados = lerTeste();
		await game.clipboard.copyPlainText(macroDoTeste(dados.atual, progressoAtual(dados)));
		ui.notifications.info("Macro do teste copiada.");
	}
}

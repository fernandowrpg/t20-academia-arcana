import { MODULO, opcao } from "../config.mjs";
import { PLANOS } from "../data/planos.mjs";
import { academiaTemAnotacoes, avancarPlano, dadosDaAcademia, lerExpedicao, planoAtual, textoEmItens, textoEmParagrafos } from "../planos.mjs";
import { PainelFlutuante } from "./painel.mjs";
import { PlanosApp } from "./planos.mjs";
import { TesteEstendidoApp } from "./teste-estendido.mjs";
import { mostrarTransicaoATodos } from "../transicao.mjs";
import { alternarVisibilidade, lerTeste, testeDefinido } from "../teste-estendido.mjs";

const LARGURA = 310;

export class PainelPlanoApp extends PainelFlutuante {
	static CHAVE = "plano";

	static instancia = null;

	/* O mestre sempre vê (para escolher o plano); o jogador, se o mestre liberar e houver um plano ativo
	   ou anotações da Academia. */
	static deveExibir() {
		if (!opcao("painelPlano")) return false;
		if (game.user.isGM) return true;
		return opcao("planoJogadores") && (!!lerExpedicao().atual || academiaTemAnotacoes());
	}

	static DEFAULT_OPTIONS = {
		classes: ["aa-painel-plano"],
		actions: {
			anterior: PainelPlanoApp.#anterior,
			proximo: PainelPlanoApp.#proximo,
			editar: PainelPlanoApp.#editar,
			transicao: PainelPlanoApp.#transicao,
			testeVisivel: PainelPlanoApp.#testeVisivel,
			testeEditar: PainelPlanoApp.#testeEditar
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
		const contexto = { gm, recolhido: this.recolhido, minimizado: this.minimizado, total: PLANOS.length, plano: null, academia: null };
		if (gm) {
			const teste = lerTeste();
			contexto.teste = { visivel: teste.visivel, definido: testeDefinido(teste), titulo: teste.atual.titulo.trim() || "Teste estendido", sucessos: teste.sucessos, falhas: teste.falhas, sucessosNecessarios: teste.atual.sucessosNecessarios, falhasLimite: teste.atual.falhasLimite };
		}
		if (!plano) {
			const academia = dadosDaAcademia();
			const anotacoes = textoEmParagrafos(academia.anotacoes);
			const segredo = gm ? textoEmParagrafos(academia.segredo) : [];
			contexto.academia = { ...academia, anotacoes, segredo, vazia: !anotacoes.length && !segredo.length };
			return contexto;
		}
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
		const id = context.plano?.id ?? (context.academia ? "academia" : null);
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
		PlanosApp.abrir(lerExpedicao().atual || "academia");
	}

	/* Mostra a todos o cartão de transição do lugar atual (plano ou Academia). */
	static #transicao() {
		mostrarTransicaoATodos(lerExpedicao().atual);
	}

	/* Sem teste montado, mostrar abre o editor em vez de pôr um painel vazio na tela. */
	static #testeVisivel() {
		if (!game.user.isGM) return;
		const teste = lerTeste();
		if (!teste.visivel && !testeDefinido(teste)) return TesteEstendidoApp.abrir();
		alternarVisibilidade();
	}

	static #testeEditar() {
		TesteEstendidoApp.abrir();
	}
}

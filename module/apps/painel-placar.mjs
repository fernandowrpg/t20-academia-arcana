import { MODULO, ehAluno, opcao } from "../config.mjs";
import { lerPlacar, nomesDosCampeoes, pontuacao } from "../placar.mjs";
import { PainelFlutuante } from "./painel.mjs";
import { SecretariaApp } from "./secretaria.mjs";

export class PainelPlacarApp extends PainelFlutuante {
	static CHAVE = "placar";

	static instancia = null;

	static deveExibir() {
		return opcao("painelPlacar") && game.actors.some((a) => ehAluno(a));
	}

	static DEFAULT_OPTIONS = {
		classes: ["aa-painel-placar"],
		actions: {
			secretaria: PainelPlacarApp.#secretaria
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/painel-placar.hbs` }
	};

	posicaoPadrao() {
		const jogadores = document.getElementById("players")?.getBoundingClientRect();
		if (!jogadores?.width) return { left: 15, top: Math.max(90, window.innerHeight - 420) };
		return { left: Math.round(jogadores.left), top: Math.round(Math.max(90, jogadores.top - 190)) };
	}

	async _prepareContext() {
		const placar = lerPlacar();
		const { gremios, max, lideres } = pontuacao(placar);
		/* A bandeira enche em relação à meta; se alguém passar da meta, em relação ao líder. */
		const teto = Math.max(opcao("metaPlacar"), max, 1);
		const ultimo = placar.historico.at(-1) ?? null;
		return {
			gm: game.user.isGM,
			recolhido: this.recolhido,
			minimizado: this.minimizado,
			gremios: gremios.map((g) => ({
				id: g.id,
				apelido: g.apelido,
				icone: g.icone,
				cor: g.cor,
				pontos: g.pontos,
				nivel: Math.round((g.pontos / teto) * 100),
				lider: lideres.includes(g.id),
				dica: `${g.nome}: ${g.pontos} ponto(s). Aprovações: ${g.aprovacoes}. Atividades: ${g.atividades}.${g.avulsos ? ` Avulsos: ${g.avulsos}.` : ""}`
			})),
			ultimo: ultimo && { rotulo: ultimo.rotulo, campeoes: nomesDosCampeoes(ultimo).join(" e ") || "sem campeão" }
		};
	}

	static #secretaria() {
		SecretariaApp.abrir();
	}
}

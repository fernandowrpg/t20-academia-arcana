import { GREMIOS, SITUACOES, STATUS_SEMESTRE } from "../data/disciplinas.mjs";
import { formatarNota, recurso, resumoNotas } from "../logica.mjs";
import { MODULO, ehAluno, ehNpcGerado, lerAluno, opcao } from "../config.mjs";
import { PainelFlutuante, barra } from "./painel.mjs";
import { totalNaoLidas } from "../correio.mjs";
import { CalendarioApp } from "./calendario.mjs";
import { CorreioApp } from "./correio.mjs";
import { SecretariaApp } from "./secretaria.mjs";
import { VidaAcademicaApp } from "./vida-academica.mjs";

const FORA_DO_PAINEL = new Set(["formado", "desligado"]);

function alunosVisiveis() {
	return game.actors
		.filter((a) => ehAluno(a) && !ehNpcGerado(a) && a.testUserPermission(game.user, "OBSERVER") && !FORA_DO_PAINEL.has(lerAluno(a).situacaoCurso))
		.sort((a, b) => a.name.localeCompare(b.name));
}

export class PainelAlunosApp extends PainelFlutuante {
	static CHAVE = "alunos";

	static instancia = null;

	static deveExibir() {
		return opcao("painelAlunos") && alunosVisiveis().length > 0;
	}

	static DEFAULT_OPTIONS = {
		classes: ["aa-painel-alunos"],
		actions: {
			abrirFicha: PainelAlunosApp.#abrirFicha,
			abrirVida: PainelAlunosApp.#abrirVida,
			abrirMatricula: PainelAlunosApp.#abrirMatricula,
			alternarNotas: PainelAlunosApp.#alternarNotas,
			secretaria: PainelAlunosApp.#secretaria,
			calendario: PainelAlunosApp.#calendario,
			correio: PainelAlunosApp.#correio
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/painel-alunos.hbs`, scrollable: [".aa-painel-lista"] }
	};

	notasAlternadas = new Set();

	posicaoPadrao() {
		const nav = document.getElementById("scene-navigation")?.getBoundingClientRect();
		if (!nav?.width) return super.posicaoPadrao();
		return { left: Math.round(nav.left), top: Math.round(Math.min(nav.bottom + 12, 160)) };
	}

	async _prepareContext() {
		const gm = game.user.isGM;
		const usarNotas = opcao("usarNotas");
		const alunos = alunosVisiveis().map((actor) => {
			const aluno = lerAluno(actor);
			const atual = aluno.semestres.at(-1) ?? null;
			const aberta = atual?.status === "matricula";
			const resumo = resumoNotas(aluno);
			return {
				id: actor.id,
				nome: actor.name,
				img: actor.img,
				gremio: GREMIOS[aluno.gremio] ?? null,
				barras: [
					barra("pv", "PV", recurso(actor.system?.attributes?.pv)),
					barra("pm", "PM", recurso(actor.system?.attributes?.pm))
				].filter(Boolean),
				matricula: {
					aberta,
					dica: aberta
						? `Matrícula aberta: ${atual.numero}º semestre, ${atual.disciplinas.length} disciplina(s)`
						: "Abrir a aba Matrícula"
				},
				notas: resumo && {
					...resumo,
					status: STATUS_SEMESTRE[resumo.status],
					media: formatarNota(resumo.media),
					abertas: this.notasAlternadas.has(actor.id) === gm,
					disciplinas: resumo.disciplinas.map((d) => ({
						...d,
						situacaoTexto: SITUACOES[d.situacao] ?? d.situacao,
						valor: usarNotas ? formatarNota(d.nota) : (SITUACOES[d.situacao] ?? d.situacao)
					}))
				}
			};
		});
		return { gm, usarNotas, calendario: gm || opcao("calendarioJogadores"), correio: gm || opcao("correioJogadores"), cartas: totalNaoLidas(), recolhido: this.recolhido, alunos };
	}

	#ator(alvo) {
		return game.actors.get(alvo.closest("[data-actor]")?.dataset.actor);
	}

	static #abrirFicha(event, alvo) {
		this.#ator(alvo)?.sheet.render(true);
	}

	static #abrirVida(event, alvo) {
		VidaAcademicaApp.abrir(this.#ator(alvo));
	}

	static #abrirMatricula(event, alvo) {
		VidaAcademicaApp.abrir(this.#ator(alvo), { aba: "matricula" });
	}

	static #alternarNotas(event, alvo) {
		const id = alvo.closest("[data-actor]")?.dataset.actor;
		if (this.notasAlternadas.has(id)) this.notasAlternadas.delete(id);
		else this.notasAlternadas.add(id);
		this.render();
	}

	static #secretaria() {
		SecretariaApp.abrir();
	}

	static #calendario() {
		CalendarioApp.abrir();
	}

	static #correio() {
		CorreioApp.abrir();
	}
}

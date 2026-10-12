import { MODULO, corpoDocente, ehAluno, ehNpcGerado } from "../config.mjs";
import { SITUACOES_ATIVIDADE, VANTAGENS, criarAtividade, definirSituacao, disciplinasDoProfessor, excluirAtividade, lerAtividades } from "../atividades.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

export class AtividadesApp extends HandlebarsApplicationMixin(ApplicationV2) {
	static instancia = null;

	static abrir() {
		if (!game.user.isGM) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.SomenteMestreAtividades"));
			return null;
		}
		this.instancia ??= new this();
		this.instancia.render({ force: true });
		return this.instancia;
	}

	static atualizar() {
		if (this.instancia?.rendered) this.instancia.render();
	}

	static DEFAULT_OPTIONS = {
		id: "academia-arcana-atividades",
		classes: ["academia-arcana", "aa-atividades-app"],
		window: { title: "ACADEMIA.Atividades", icon: "fa-solid fa-person-hiking", resizable: true },
		position: { width: 640, height: 680 },
		actions: {
			criar: AtividadesApp.#criar,
			excluir: AtividadesApp.#excluir
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/atividades.hbs`, scrollable: [".aa-conteudo"] }
	};

	async _onClose(options) {
		await super._onClose(options);
		AtividadesApp.instancia = null;
	}

	async _prepareContext() {
		const professores = [...new Map(corpoDocente().filter((p) => p.actor).map((p) => [p.actor.id, p.actor])).values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
		const alunos = game.actors.filter((a) => ehAluno(a)).sort((a, b) => Number(ehNpcGerado(a)) - Number(ehNpcGerado(b)) || a.name.localeCompare(b.name, "pt-BR"));
		const atividades = lerAtividades()
			.sort((a, b) => b.criada - a.criada)
			.map((a) => {
				const leciona = disciplinasDoProfessor(a.professor);
				return {
					id: a.id,
					titulo: a.titulo,
					descricao: a.descricao,
					professor: game.actors.get(a.professor)?.name ?? "",
					vantagem: VANTAGENS[a.vantagem],
					alcance: leciona.length ? leciona.join(", ") : "qualquer disciplina",
					alunos: Object.entries(a.alunos)
						.map(([id, situacao]) => ({
							id,
							nome: game.actors.get(id)?.name ?? "(ficha removida)",
							situacao,
							situacoes: Object.entries(SITUACOES_ATIVIDADE).map(([valor, rotulo]) => ({ valor, rotulo, selecionado: valor === situacao }))
						}))
						.sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR"))
				};
			});
		return {
			professores: professores.map((a) => ({ id: a.id, nome: a.name })),
			vantagens: Object.entries(VANTAGENS).map(([id, v]) => ({ id, ...v })),
			alunos: alunos.map((a) => ({ id: a.id, nome: a.name, npc: ehNpcGerado(a) })),
			atividades
		};
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		this.element.querySelectorAll("select[data-situacao]").forEach((el) =>
			el.addEventListener("change", (ev) => definirSituacao(ev.target.closest("[data-atividade]").dataset.atividade, ev.target.dataset.situacao, ev.target.value))
		);
	}

	static async #criar() {
		const campo = (nome) => this.element.querySelector(`[name='aa-atv-${nome}']`)?.value ?? "";
		const alunos = [...this.element.querySelectorAll("input[name='aa-atv-aluno']:checked")].map((el) => el.value);
		if (!campo("titulo").trim() || !alunos.length) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.AtividadeIncompleta"));
			return;
		}
		await criarAtividade({ titulo: campo("titulo"), descricao: campo("descricao"), professor: campo("professor"), vantagem: campo("vantagem"), alunos });
	}

	static async #excluir(event, alvo) {
		const id = alvo.closest("[data-atividade]")?.dataset.atividade;
		const ok = await DialogV2.confirm({
			window: { title: "Excluir atividade" },
			content: "<p>Excluir esta atividade? As vantagens que os alunos já ganharam com ela continuam com eles.</p>"
		});
		if (ok) await excluirAtividade(id);
	}
}

import { GREMIOS, STATUS_SEMESTRE } from "../data/disciplinas.mjs";
import { estatisticas, novoAluno, novoSemestre, pendenciasParaEncerrar } from "../logica.mjs";
import { MODULO, ehAluno, lerAluno, opcao, salvarAluno } from "../config.mjs";
import { VidaAcademicaApp } from "./vida-academica.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

export class SecretariaApp extends HandlebarsApplicationMixin(ApplicationV2) {
	static instancia = null;

	static abrir() {
		if (!game.user.isGM) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.SomenteMestre"));
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
		id: "academia-arcana-secretaria",
		classes: ["academia-arcana", "aa-secretaria-app"],
		window: { title: "ACADEMIA.Secretaria", icon: "fa-solid fa-building-columns", resizable: true },
		position: { width: 760, height: 600 },
		actions: {
			abrirAluno: SecretariaApp.#abrirAluno,
			admitir: SecretariaApp.#admitir,
			abrirMatriculas: SecretariaApp.#abrirMatriculas,
			iniciarTodos: SecretariaApp.#iniciarTodos,
			encerrarTodos: SecretariaApp.#encerrarTodos,
			catalogo: SecretariaApp.#catalogo
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/secretaria.hbs`, scrollable: [".aa-conteudo"] }
	};

	async _onClose(options) {
		await super._onClose(options);
		SecretariaApp.instancia = null;
	}

	#alunos() {
		return game.actors.filter((a) => ehAluno(a)).sort((a, b) => a.name.localeCompare(b.name));
	}

	async _prepareContext() {
		const alunos = this.#alunos().map((actor) => {
			const aluno = lerAluno(actor);
			const atual = aluno.semestres.at(-1);
			const est = estatisticas(aluno);
			return {
				id: actor.id,
				nome: actor.name,
				img: actor.img,
				gremio: GREMIOS[aluno.gremio] ?? null,
				semestre: atual ? `${atual.numero}º · ${STATUS_SEMESTRE[atual.status]}` : "—",
				chave: atual?.status ?? "",
				disciplinas: atual?.disciplinas.length ?? 0,
				aprovadas: est.aprovadas,
				reprovadas: est.reprovadas
			};
		});
		const candidatos = game.actors
			.filter((a) => a.type === "character" && !ehAluno(a))
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((a) => ({ id: a.id, nome: a.name }));
		return { alunos, candidatos, temCandidatos: candidatos.length > 0 };
	}

	static #abrirAluno(event, alvo) {
		VidaAcademicaApp.abrir(game.actors.get(alvo.closest("[data-actor]").dataset.actor));
	}

	static async #admitir() {
		const id = this.element.querySelector("select[name='aa-candidato']")?.value;
		const actor = game.actors.get(id);
		if (!actor) return;
		await salvarAluno(actor, novoAluno());
		ui.notifications.info(game.i18n.format("ACADEMIA.Aviso.Admitido", { nome: actor.name }));
		this.render();
	}

	async #emLote(titulo, texto, fn) {
		const ok = await DialogV2.confirm({ window: { title: titulo }, content: `<p>${texto}</p>` });
		if (!ok) return;
		let alterados = 0;
		for (const actor of this.#alunos()) {
			const aluno = lerAluno(actor);
			if (aluno.situacaoCurso !== "ativo") continue;
			if (fn(aluno, actor) === false) continue;
			await salvarAluno(actor, aluno);
			alterados++;
		}
		ui.notifications.info(game.i18n.format("ACADEMIA.Aviso.Lote", { qtd: alterados }));
		this.render();
	}

	static async #abrirMatriculas() {
		const max = opcao("maxSemestres");
		await this.#emLote("Abrir matrículas", "Abrir a matrícula do próximo semestre para todos os alunos ativos com o semestre anterior encerrado?", (aluno) => {
			const atual = aluno.semestres.at(-1);
			if (atual && atual.status !== "encerrado") return false;
			if (aluno.semestres.length >= max) return false;
			aluno.semestres.push(novoSemestre(aluno.semestres.length + 1));
		});
	}

	static async #iniciarTodos() {
		await this.#emLote("Iniciar semestre", "Iniciar o semestre de todos os alunos com matrícula aberta?", (aluno) => {
			const atual = aluno.semestres.at(-1);
			if (atual?.status !== "matricula") return false;
			atual.status = "cursando";
		});
	}

	static async #encerrarTodos() {
		const ignorados = [];
		await this.#emLote("Encerrar semestre", "Encerrar o semestre de todos os alunos cujas disciplinas já têm situação final?", (aluno, actor) => {
			const atual = aluno.semestres.at(-1);
			if (atual?.status !== "cursando") return false;
			if (pendenciasParaEncerrar(atual).length) {
				ignorados.push(actor.name);
				return false;
			}
			atual.status = "encerrado";
		});
		if (ignorados.length) ui.notifications.warn(game.i18n.format("ACADEMIA.Aviso.Ignorados", { lista: ignorados.join(", ") }));
	}

	static #catalogo() {
		const Menu = game.settings.menus.get(`${MODULO}.catalogoMenu`)?.type;
		if (Menu) new Menu().render({ force: true });
	}
}

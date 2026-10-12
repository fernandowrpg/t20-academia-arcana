import { GREMIOS, STATUS_SEMESTRE } from "../data/disciplinas.mjs";
import { concluirAleatorio, descricaoNpc, descricaoParceiro, matricularAleatorio, subirNivel } from "../gerador.mjs";
import { estatisticas, novoAluno, novoSemestre, pendenciasParaEncerrar } from "../logica.mjs";
import { MODULO, contextoCatalogo, corpoDocente, disciplinasDosPersonagens, ehAluno, vinculosDeProfessores, lerAluno, opcao, salvarAluno, sincronizarFicha } from "../config.mjs";
import { CalendarioApp } from "./calendario.mjs";
import { CorreioApp } from "./correio.mjs";
import { GeradorAlunosApp } from "./gerador.mjs";
import { VidaAcademicaApp } from "./vida-academica.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const PASTA_PROFESSORES = "Professores da Academia";

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
			catalogo: SecretariaApp.#catalogo,
			gerador: SecretariaApp.#gerador,
			calendario: SecretariaApp.#calendario,
			correio: SecretariaApp.#correio,
			criarFichaProfessor: SecretariaApp.#criarFichaProfessor,
			abrirFichaProfessor: SecretariaApp.#abrirFichaProfessor
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
				npc: [descricaoNpc(aluno.npc), descricaoParceiro(aluno.npc)?.rotulo].filter(Boolean).join(" · "),
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
		const fichas = game.actors.filter((a) => !ehAluno(a)).sort((a, b) => a.name.localeCompare(b.name));
		const docentes = corpoDocente().map((p) => ({
			nome: p.nome,
			disciplinas: p.disciplinas.join(", "),
			quantidade: p.disciplinas.length,
			vinculado: !!p.actor,
			img: p.actor?.img ?? null,
			fichas: [{ id: "", nome: "— sem ficha —", selecionado: !p.actor }].concat(fichas.map((a) => ({ id: a.id, nome: a.name, selecionado: a.id === p.actor?.id })))
		}));
		return { alunos, candidatos, temCandidatos: candidatos.length > 0, docentes };
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
			if (aluno.npc) await sincronizarFicha(actor, aluno);
			alterados++;
		}
		ui.notifications.info(game.i18n.format("ACADEMIA.Aviso.Lote", { qtd: alterados }));
		this.render();
	}

	static async #abrirMatriculas() {
		const max = opcao("maxSemestres");
		const { catalogo, ofertas } = contextoCatalogo();
		const preferidas = disciplinasDosPersonagens();
		await this.#emLote("Abrir matrículas", "Abrir a matrícula do próximo semestre para todos os alunos ativos com o semestre anterior encerrado? Os NPCs gerados sobem um nível e escolhem as disciplinas sozinhos.", (aluno) => {
			const atual = aluno.semestres.at(-1);
			if (atual && atual.status !== "encerrado") return false;
			if (aluno.semestres.length >= max) return false;
			aluno.semestres.push(novoSemestre(aluno.semestres.length + 1));
			if (aluno.npc && aluno.semestres.length > 1) subirNivel(aluno);
			if (aluno.npc) matricularAleatorio(aluno, { catalogo, ofertas, preferidas, min: opcao("minDisciplinas"), max: opcao("maxDisciplinas") });
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
		await this.#emLote("Encerrar semestre", "Encerrar o semestre de todos os alunos cujas disciplinas já têm situação final? Os NPCs gerados recebem notas sorteadas nas disciplinas pendentes.", (aluno, actor) => {
			const atual = aluno.semestres.at(-1);
			if (atual?.status !== "cursando") return false;
			if (aluno.npc) concluirAleatorio(aluno, atual);
			if (pendenciasParaEncerrar(atual).length) {
				ignorados.push(actor.name);
				return false;
			}
			atual.status = "encerrado";
		});
		if (ignorados.length) ui.notifications.warn(game.i18n.format("ACADEMIA.Aviso.Ignorados", { lista: ignorados.join(", ") }));
	}

	static #gerador() {
		GeradorAlunosApp.abrir();
	}

	static #calendario() {
		CalendarioApp.abrir();
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		this.element.querySelectorAll("select[data-professor]").forEach((el) =>
			el.addEventListener("change", (ev) => this.#vincular(ev.target.dataset.professor, ev.target.value))
		);
	}

	async #vincular(nome, idDaFicha) {
		const vinculos = foundry.utils.deepClone(vinculosDeProfessores());
		if (idDaFicha) vinculos[nome] = idDaFicha;
		else delete vinculos[nome];
		await game.settings.set(MODULO, "professores", vinculos);
	}

	static async #criarFichaProfessor(event, alvo) {
		const nome = alvo.closest("[data-docente]")?.dataset.docente;
		if (!nome) return;
		const pasta = game.folders.find((f) => f.type === "Actor" && f.name === PASTA_PROFESSORES) ?? (await Folder.create({ name: PASTA_PROFESSORES, type: "Actor" }));
		const tipo = game.documentTypes?.Actor?.includes("npc") ? "npc" : "character";
		const actor = await Actor.implementation.create({ name: nome, type: tipo, folder: pasta?.id ?? null, prototypeToken: { name: nome, disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL, actorLink: true } });
		if (actor) await this.#vincular(nome, actor.id);
	}

	static #abrirFichaProfessor(event, alvo) {
		const nome = alvo.closest("[data-docente]")?.dataset.docente;
		game.actors.get(vinculosDeProfessores()[nome])?.sheet.render(true);
	}

	static #correio() {
		CorreioApp.abrir();
	}

	static #catalogo() {
		const Menu = game.settings.menus.get(`${MODULO}.catalogoMenu`)?.type;
		if (Menu) new Menu().render({ force: true });
	}
}

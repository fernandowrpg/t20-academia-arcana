import { GREMIOS, STATUS_SEMESTRE } from "../data/disciplinas.mjs";
import { concluirAleatorio, descricaoNpc, descricaoParceiro, matricularAleatorio, subirNivel } from "../gerador.mjs";
import { estatisticas, nomePericia, novoAluno, novoSemestre, ordenarPericias, pendenciasParaEncerrar } from "../logica.mjs";
import {
	MODULO,
	cadastrarProfessor,
	contextoCatalogo,
	corpoDocente,
	definirDisciplinasDoProfessor,
	disciplinasDosPersonagens,
	ehAluno,
	lerAluno,
	nomesDeProfessor,
	opcao,
	removerProfessor,
	salvarAluno,
	sincronizarFicha,
	vincularProfessor,
	vinculosDeProfessores
} from "../config.mjs";
import { AtividadesApp } from "./atividades.mjs";
import { CalendarioApp } from "./calendario.mjs";
import { CorreioApp } from "./correio.mjs";
import { GeradorAlunosApp } from "./gerador.mjs";
import { definirAvulsos, encerrarPlacar, lerPlacar, nomesDosCampeoes, pontuacao } from "../placar.mjs";
import { VidaAcademicaApp } from "./vida-academica.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const PASTA_PROFESSORES = "Professores da Academia";

function escapar(texto) {
	return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function criarFichaDeProfessor(nome) {
	const pasta = game.folders.find((f) => f.type === "Actor" && f.name === PASTA_PROFESSORES) ?? (await Folder.create({ name: PASTA_PROFESSORES, type: "Actor" }));
	const tipo = game.documentTypes?.Actor?.includes("npc") ? "npc" : "character";
	return Actor.implementation.create({ name: nome, type: tipo, folder: pasta?.id ?? null, prototypeToken: { name: nome, disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL, actorLink: true } });
}

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
			cadastrarProfessor: SecretariaApp.#cadastrarProfessor,
			disciplinasProfessor: SecretariaApp.#disciplinasProfessor,
			removerProfessor: SecretariaApp.#removerProfessor,
			atividades: SecretariaApp.#atividades,
			encerrarPlacar: SecretariaApp.#encerrarPlacar,
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
			cadastrado: p.cadastrado,
			img: p.actor?.img ?? null,
			fichas: [{ id: "", nome: "— sem ficha —", selecionado: !p.actor }].concat(fichas.map((a) => ({ id: a.id, nome: a.name, selecionado: a.id === p.actor?.id })))
		}));
		const registro = lerPlacar();
		const { gremios, lideres } = pontuacao(registro);
		const placar = {
			gremios: gremios.map((g) => ({ ...g, lider: lideres.includes(g.id) })),
			valores: { aprovacao: opcao("pontosAprovacao"), atividade: opcao("pontosAtividade") },
			npcs: opcao("placarNpcs"),
			historico: registro.historico
				.map((h) => ({
					rotulo: h.rotulo,
					data: new Date(h.quando).toLocaleDateString("pt-BR"),
					campeoes: nomesDosCampeoes(h).join(" e ") || "sem campeão",
					pontos: gremios.map((g) => `${g.apelido} ${h.pontos?.[g.id] ?? 0}`).join(" · ")
				}))
				.reverse()
		};
		const fichasNovoProfessor = fichas.map((a) => ({ id: a.id, nome: a.name }));
		return { alunos, candidatos, temCandidatos: candidatos.length > 0, docentes, docentesAbertos: this.docentesAbertos, fichasNovoProfessor, placar };
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
		this.element.querySelectorAll("input[data-avulsos]").forEach((el) => el.addEventListener("change", (ev) => definirAvulsos(ev.target.dataset.avulsos, ev.target.value)));
		this.element.querySelector("details.aa-docentes")?.addEventListener("toggle", (ev) => (this.docentesAbertos = ev.target.open));
		this.element.querySelectorAll("select[data-professor]").forEach((el) =>
			el.addEventListener("change", (ev) => vincularProfessor(ev.target.dataset.professor, ev.target.value))
		);
	}

	static async #criarFichaProfessor(event, alvo) {
		const nome = alvo.closest("[data-docente]")?.dataset.docente;
		if (!nome) return;
		const actor = await criarFichaDeProfessor(nome);
		if (actor) await vincularProfessor(nome, actor.id);
	}

	static async #cadastrarProfessor() {
		const nome = this.element.querySelector("input[name='aa-novo-professor']")?.value.trim().replace(/\s+/g, " ") ?? "";
		const ficha = this.element.querySelector("select[name='aa-novo-professor-ficha']")?.value ?? "";
		if (!nome) return ui.notifications.warn("Dê um nome ao professor.");
		if (nome.includes("/")) return ui.notifications.warn("O nome do professor não pode ter barra (/): ela separa os professores que dividem uma disciplina.");
		if (corpoDocente().some((p) => p.nome.localeCompare(nome, "pt-BR", { sensitivity: "base" }) === 0)) return ui.notifications.warn(`${nome} já está no corpo docente.`);
		this.docentesAbertos = true;
		await cadastrarProfessor(nome);
		if (ficha === "nova") {
			const actor = await criarFichaDeProfessor(nome);
			if (actor) await vincularProfessor(nome, actor.id);
		} else if (ficha) await vincularProfessor(nome, ficha);
		ui.notifications.info(`${nome} entrou para o corpo docente.`);
		await SecretariaApp.#abrirDisciplinas(nome);
	}

	static #disciplinasProfessor(event, alvo) {
		const nome = alvo.closest("[data-docente]")?.dataset.docente;
		if (nome) SecretariaApp.#abrirDisciplinas(nome);
	}

	/* Janela com as disciplinas do catálogo, por perícia, marcadas as que o professor leciona. */
	static async #abrirDisciplinas(nome) {
		const { catalogo } = contextoCatalogo();
		const lista = [...catalogo.values()];
		const grupos = ordenarPericias(lista.map((d) => d.pericia)).map((chave) => {
			const itens = lista
				.filter((d) => d.pericia === chave)
				.map((d) => {
					const nomes = nomesDeProfessor(d.professor);
					return { id: d.id, nome: d.nome, marcada: nomes.includes(nome), colegas: nomes.filter((n) => n !== nome).join(", ") };
				});
			return { nome: nomePericia(chave), itens, marcadas: itens.filter((i) => i.marcada).length };
		});
		const html = grupos
			.map(
				(g) => `<details class="aa-grupo" ${g.marcadas ? "open" : ""}>
					<summary><span class="aa-grupo-nome">${escapar(g.nome)}</span><span class="aa-pilula">${g.marcadas}/${g.itens.length}</span></summary>
					${g.itens
						.map(
							(i) =>
								`<label class="aa-check aa-escolha-disciplina"><input type="checkbox" name="disciplina" value="${escapar(i.id)}" ${i.marcada ? "checked" : ""}> ${escapar(i.nome)}${i.colegas ? ` <small>(${escapar(i.colegas)})</small>` : ""}</label>`
						)
						.join("")}
				</details>`
			)
			.join("");
		const ids = await DialogV2.prompt({
			window: { title: `Disciplinas de ${nome}`, icon: "fa-solid fa-chalkboard-user" },
			classes: ["academia-arcana", "aa-dialogo-disciplinas"],
			position: { width: 520 },
			content: `<p class="aa-dica">Marque as disciplinas que ${escapar(nome)} leciona. Quem já divide a disciplina continua nela (entre parênteses).</p><div class="aa-escolha-disciplinas">${html}</div>`,
			ok: {
				label: "Salvar disciplinas",
				icon: "fa-solid fa-floppy-disk",
				callback: (ev, botao) => [...botao.form.querySelectorAll("input[name='disciplina']:checked")].map((el) => el.value)
			},
			rejectClose: false
		});
		if (!Array.isArray(ids)) return;
		await definirDisciplinasDoProfessor(nome, ids, new Set(catalogo.keys()));
		ui.notifications.info(`${nome}: ${ids.length} disciplina(s).`);
	}

	static async #removerProfessor(event, alvo) {
		const nome = alvo.closest("[data-docente]")?.dataset.docente;
		if (!nome) return;
		const ok = await DialogV2.confirm({
			window: { title: "Remover professor" },
			content: `<p>Tirar <strong>${escapar(nome)}</strong> do corpo docente? O professor sai de todas as disciplinas e perde o vínculo com a ficha; a ficha continua no mundo. Para devolver um professor do livro às disciplinas originais, use <em>Restaurar padrão</em> no catálogo.</p>`
		});
		if (ok) await removerProfessor(nome);
	}

	static #abrirFichaProfessor(event, alvo) {
		const nome = alvo.closest("[data-docente]")?.dataset.docente;
		game.actors.get(vinculosDeProfessores()[nome])?.sheet.render(true);
	}

	static async #encerrarPlacar() {
		const rotulo = await DialogV2.prompt({
			window: { title: "Encerrar o placar do semestre" },
			content: `<p>Registra os pontos e os campeões, anuncia no chat e recomeça a contagem do zero. Não dá para desfazer.</p><label>Nome do período<input type="text" name="rotulo" maxlength="60" placeholder="1º semestre de 1410" style="width:100%"></label>`,
			ok: { label: "Encerrar e registrar", callback: (ev, botao) => botao.form.elements.rotulo.value },
			rejectClose: false
		});
		if (typeof rotulo !== "string") return;
		await encerrarPlacar(rotulo);
	}

	static #atividades() {
		AtividadesApp.abrir();
	}

	static #correio() {
		CorreioApp.abrir();
	}

	static #catalogo() {
		const Menu = game.settings.menus.get(`${MODULO}.catalogoMenu`)?.type;
		if (Menu) new Menu().render({ force: true });
	}
}

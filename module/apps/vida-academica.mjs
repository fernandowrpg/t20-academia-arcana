import { GREMIOS, OFICIO_LIVRE, QUATRO_ELEMENTOS, SITUACOES, STATUS_SEMESTRE } from "../data/disciplinas.mjs";
import {
	aprovadasPorPericia,
	avaliarDisciplina,
	estatisticas,
	formatarNota,
	media,
	nomePericia,
	novoAluno,
	novoSemestre,
	oficiosDisponiveis,
	pendenciasParaEncerrar,
	periciaEfetiva,
	periciasPredominantes,
	preRequisitos
} from "../logica.mjs";
import { MODULO, contextoCatalogo, lerAluno, opcao, podeMatricular, removerAluno, salvarAluno } from "../config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const SITUACOES_CURSO = {
	ativo: "Ativo",
	trancado: "Curso trancado",
	formado: "Formado",
	desligado: "Desligado"
};

const CAMPOS_DO_DONO = new Set(["anotacoes"]);

function opcoes(mapa, selecionado) {
	return Object.entries(mapa).map(([valor, rotulo]) => ({ valor, rotulo, selecionado: valor === selecionado }));
}

export class VidaAcademicaApp extends HandlebarsApplicationMixin(ApplicationV2) {
	static instancias = new Map();

	static abrir(actor, { aba } = {}) {
		if (!actor) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.SemAtor"));
			return null;
		}
		let app = this.instancias.get(actor.uuid);
		if (!app) {
			app = new this({ actor, id: `academia-arcana-${actor.id}` });
			this.instancias.set(actor.uuid, app);
		}
		if (aba) app.aba = aba;
		app.render({ force: true });
		return app;
	}

	static atualizar(actor) {
		this.instancias.get(actor.uuid)?.render();
	}

	static atualizarTodas() {
		for (const app of this.instancias.values()) app.render();
	}

	static DEFAULT_OPTIONS = {
		classes: ["academia-arcana", "aa-vida"],
		window: { icon: "fa-solid fa-hat-wizard", resizable: true },
		position: { width: 860, height: 760 },
		actions: {
			trocarAba: VidaAcademicaApp.#trocarAba,
			admitir: VidaAcademicaApp.#admitir,
			abrirMatricula: VidaAcademicaApp.#abrirMatricula,
			iniciarSemestre: VidaAcademicaApp.#iniciarSemestre,
			encerrarSemestre: VidaAcademicaApp.#encerrarSemestre,
			reabrirSemestre: VidaAcademicaApp.#reabrirSemestre,
			excluirSemestre: VidaAcademicaApp.#excluirSemestre,
			desligar: VidaAcademicaApp.#desligar,
			matricular: VidaAcademicaApp.#matricular,
			desmatricular: VidaAcademicaApp.#desmatricular,
			rolar: VidaAcademicaApp.#rolar,
			alternarElemento: VidaAcademicaApp.#alternarElemento,
			abrirCompendio: VidaAcademicaApp.#abrirCompendio
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/vida-academica.hbs`, scrollable: [".aa-conteudo"] }
	};

	constructor(options = {}) {
		super(options);
		this.actor = options.actor;
		this.aba = "resumo";
		this.filtro = "";
		this.soDisponiveis = false;
		this.gruposAbertos = new Set();
	}

	get title() {
		return `${game.i18n.localize("ACADEMIA.VidaAcademica")}: ${this.actor.name}`;
	}

	async _onClose(options) {
		await super._onClose(options);
		VidaAcademicaApp.instancias.delete(this.actor.uuid);
	}

	async _prepareContext(options) {
		const aluno = lerAluno(this.actor);
		const gm = game.user.isGM;
		const contexto = {
			actor: this.actor,
			gm,
			dono: this.actor.isOwner,
			aluno: !!aluno,
			aba: this.aba,
			abas: [
				{ id: "resumo", rotulo: "Ficha do Aluno", icone: "fa-solid fa-id-card", ativa: this.aba === "resumo" },
				{ id: "matricula", rotulo: "Matrícula", icone: "fa-solid fa-file-signature", ativa: this.aba === "matricula" },
				{ id: "boletim", rotulo: "Boletim", icone: "fa-solid fa-scroll", ativa: this.aba === "boletim" }
			]
		};
		if (!aluno) return contexto;

		const { catalogo, pericias, ofertas } = contextoCatalogo();
		const { chaves: chavesOficio, rotulos } = oficiosDisponiveis(this.actor.system?.pericias);
		const rotular = (chave) => nomePericia(chave, rotulos);
		const opcoesOficio = (sel) =>
			[{ valor: "", rotulo: "— escolha o ofício —", selecionado: !sel }].concat(
				chavesOficio.map((c) => ({ valor: c, rotulo: rotular(c), selecionado: c === sel }))
			);
		const usarNotas = opcao("usarNotas");
		const maxSemestres = opcao("maxSemestres");
		const regulares = opcao("semestresRegulares");
		const minDisc = opcao("minDisciplinas");
		const maxDisc = opcao("maxDisciplinas");
		const indiceAtual = aluno.semestres.length - 1;
		const atual = aluno.semestres[indiceAtual] ?? null;
		const est = estatisticas(aluno);

		contexto.usarNotas = usarNotas;
		contexto.ficha = {
			gremio: aluno.gremio,
			gremioInfo: GREMIOS[aluno.gremio] ?? null,
			gremios: [{ valor: "", rotulo: "— sem grêmio —", selecionado: !aluno.gremio }].concat(
				Object.entries(GREMIOS).map(([valor, g]) => ({ valor, rotulo: `${g.nome} (${g.tendencias})`, selecionado: valor === aluno.gremio }))
			),
			ingresso: aluno.ingresso,
			bolsista: aluno.bolsista,
			situacaoCurso: SITUACOES_CURSO[aluno.situacaoCurso] ?? aluno.situacaoCurso,
			situacoesCurso: opcoes(SITUACOES_CURSO, aluno.situacaoCurso),
			anotacoes: aluno.anotacoes,
			semestreAtual: atual ? { numero: atual.numero, status: STATUS_SEMESTRE[atual.status], chave: atual.status } : null,
			maxSemestres,
			regulares,
			progresso: Math.min(100, Math.round((est.semestresCursados / regulares) * 100)),
			est: { ...est, coeficiente: formatarNota(est.coeficiente) },
			porPericia: aprovadasPorPericia(aluno)
				.map((p) => ({ nome: rotular(p.chave), quantidade: p.quantidade }))
				.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")),
			elementos: Object.entries(QUATRO_ELEMENTOS).map(([id, e]) => ({ id, ...e, concluido: !!aluno.quatroElementos[id] })),
			podeAbrirMatricula: (!atual || atual.status === "encerrado") && aluno.semestres.length < maxSemestres,
			limiteAtingido: aluno.semestres.length >= maxSemestres && (!atual || atual.status === "encerrado"),
			podeIniciar: atual?.status === "matricula",
			podeEncerrar: atual?.status === "cursando",
			podeReabrir: atual?.status === "encerrado",
			proximoNumero: aluno.semestres.length + 1
		};

		const indiceMatricula = atual?.status === "matricula" ? indiceAtual : aluno.semestres.length;
		const matriculaAberta = atual?.status === "matricula";
		const pode = matriculaAberta && podeMatricular(this.actor);
		const termo = this.filtro.trim().toLowerCase();
		contexto.matricula = {
			aberta: matriculaAberta,
			pode,
			numero: matriculaAberta ? atual.numero : aluno.semestres.length + 1,
			quantidade: matriculaAberta ? atual.disciplinas.length : 0,
			min: minDisc,
			max: maxDisc,
			abaixoMin: matriculaAberta && atual.disciplinas.length < minDisc,
			cheia: matriculaAberta && maxDisc > 0 && atual.disciplinas.length >= maxDisc,
			semOficio: matriculaAberta && atual.disciplinas.some((d) => d.pericia === OFICIO_LIVRE && !d.oficio),
			filtro: this.filtro,
			soDisponiveis: this.soDisponiveis,
			predominantes: matriculaAberta ? periciasPredominantes(atual).map(rotular) : [],
			selecionadas: matriculaAberta
				? atual.disciplinas.map((d) => ({
						id: d.id,
						nome: d.nome,
						pericia: rotular(periciaEfetiva(d)),
						professor: catalogo.get(d.id)?.professor ?? "",
						escolheOficio: d.pericia === OFICIO_LIVRE,
						oficios: opcoesOficio(d.oficio)
					}))
				: [],
			grupos: pericias
				.map((chave) => {
					const disciplinas = [...catalogo.values()]
						.filter((d) => d.pericia === chave)
						.map((d) => {
							const av = avaliarDisciplina(d, aluno, indiceMatricula, catalogo, ofertas);
							const req = preRequisitos(d, catalogo).map((id) => catalogo.get(id)?.nome ?? id);
							return {
								...d,
								...av,
								requisitos: req.join(", "),
								podeAdicionar: pode && av.estado === "disponivel",
								podeRemover: pode && av.estado === "matriculada",
								visivel:
									(!termo || `${d.nome} ${d.professor}`.toLowerCase().includes(termo)) &&
									(!this.soDisponiveis || av.estado === "disponivel" || av.estado === "matriculada")
							};
						});
					return {
						id: chave,
						nome: rotular(chave),
						livre: chave === OFICIO_LIVRE,
						disciplinas,
						total: disciplinas.length,
						disponiveis: disciplinas.filter((d) => d.estado === "disponivel").length,
						matriculadas: disciplinas.filter((d) => d.estado === "matriculada").length,
						aprovadas: disciplinas.filter((d) => d.estado === "aprovada").length,
						visivel: disciplinas.some((d) => d.visivel),
						aberto: !!termo || this.gruposAbertos.has(chave)
					};
				})
				.filter((g) => g.total > 0)
		};

		contexto.boletim = aluno.semestres
			.map((s, i) => {
				const editavel = gm && s.status !== "matricula";
				return {
					indice: i,
					numero: s.numero,
					ano: s.ano,
					status: STATUS_SEMESTRE[s.status],
					chave: s.status,
					observacoes: s.observacoes,
					editavel,
					media: formatarNota(media(s.disciplinas)),
					predominantes: periciasPredominantes(s).map(rotular).join(", "),
					disciplinas: s.disciplinas.map((d, j) => {
						const efetiva = periciaEfetiva(d);
						return {
							indice: j,
							id: d.id,
							nome: d.nome,
							pericia: rotular(efetiva),
							escolheOficio: d.pericia === OFICIO_LIVRE,
							oficios: opcoesOficio(d.oficio),
							professor: catalogo.get(d.id)?.professor ?? "",
							nota: d.nota ?? "",
							notaTexto: formatarNota(d.nota),
							situacao: d.situacao,
							situacaoTexto: SITUACOES[d.situacao] ?? d.situacao,
							situacoes: opcoes(SITUACOES, d.situacao),
							podeRolar: s.status === "cursando" && this.actor.isOwner
						};
					})
				};
			})
			.reverse();
		return contexto;
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		const raiz = this.element;
		raiz.querySelectorAll("[data-campo]").forEach((el) => el.addEventListener("change", (ev) => this.#alterarCampo(ev)));
		raiz.querySelectorAll("select[data-oficio]").forEach((el) => el.addEventListener("change", (ev) => this.#escolherOficio(ev)));
		const busca = raiz.querySelector("input[name='aa-filtro']");
		if (busca) {
			busca.addEventListener("input", foundry.utils.debounce((ev) => {
				this.filtro = ev.target.value;
				this.render().then(() => {
					const campo = this.element.querySelector("input[name='aa-filtro']");
					campo?.focus();
					campo?.setSelectionRange(campo.value.length, campo.value.length);
				});
			}, 300));
		}
		raiz.querySelector("input[name='aa-so-disponiveis']")?.addEventListener("change", (ev) => {
			this.soDisponiveis = ev.target.checked;
			this.render();
		});
		raiz.querySelectorAll("details[data-grupo]").forEach((el) =>
			el.addEventListener("toggle", () => {
				if (el.open) this.gruposAbertos.add(el.dataset.grupo);
				else this.gruposAbertos.delete(el.dataset.grupo);
			})
		);
	}

	async #alterarCampo(ev) {
		const el = ev.currentTarget;
		const caminho = el.dataset.campo;
		if (!game.user.isGM && !(this.actor.isOwner && CAMPOS_DO_DONO.has(caminho))) return;
		const aluno = lerAluno(this.actor);
		if (!aluno) return;
		let valor;
		if (el.type === "checkbox") valor = el.checked;
		else if (el.dataset.tipo === "numero") valor = el.value === "" ? null : Number(el.value);
		else valor = el.value;
		if (el.dataset.tipo === "numero" && valor !== null && !Number.isFinite(valor)) return;
		foundry.utils.setProperty(aluno, caminho, valor);
		await salvarAluno(this.actor, aluno);
	}

	async #escolherOficio(ev) {
		if (!podeMatricular(this.actor)) return;
		const id = ev.currentTarget.dataset.oficio;
		const valor = ev.currentTarget.value || null;
		await this.#modificar((aluno) => {
			const atual = aluno.semestres.at(-1);
			const entrada = atual?.status === "matricula" ? atual.disciplinas.find((d) => d.id === id) : null;
			if (!entrada || entrada.pericia !== OFICIO_LIVRE) return false;
			entrada.oficio = valor;
		});
	}

	async #modificar(fn) {
		const aluno = lerAluno(this.actor);
		if (!aluno) return;
		const resultado = await fn(aluno);
		if (resultado === false) return;
		await salvarAluno(this.actor, aluno);
	}

	static #trocarAba(event, alvo) {
		this.aba = alvo.dataset.aba;
		this.render();
	}

	static async #admitir() {
		if (!game.user.isGM) return;
		await salvarAluno(this.actor, novoAluno());
		ui.notifications.info(game.i18n.format("ACADEMIA.Aviso.Admitido", { nome: this.actor.name }));
	}

	static async #abrirMatricula() {
		if (!game.user.isGM) return;
		this.aba = "matricula";
		await this.#modificar((aluno) => {
			const atual = aluno.semestres.at(-1);
			if (atual && atual.status !== "encerrado") return false;
			if (aluno.semestres.length >= opcao("maxSemestres")) {
				ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.LimiteSemestres"));
				return false;
			}
			aluno.semestres.push(novoSemestre(aluno.semestres.length + 1));
		});
		this.render();
	}

	static async #iniciarSemestre() {
		if (!game.user.isGM) return;
		const aluno = lerAluno(this.actor);
		const atual = aluno?.semestres.at(-1);
		if (!atual || atual.status !== "matricula") return;
		const min = opcao("minDisciplinas");
		if (atual.disciplinas.length < min) {
			const ok = await DialogV2.confirm({
				window: { title: "Iniciar semestre" },
				content: `<p>${game.i18n.format("ACADEMIA.Aviso.AbaixoMinimo", { qtd: atual.disciplinas.length, min })}</p>`
			});
			if (!ok) return;
		}
		const semOficio = atual.disciplinas.filter((d) => d.pericia === OFICIO_LIVRE && !d.oficio);
		if (semOficio.length) {
			const ok = await DialogV2.confirm({
				window: { title: "Iniciar semestre" },
				content: `<p>${game.i18n.format("ACADEMIA.Aviso.SemOficio", { lista: semOficio.map((d) => d.nome).join(", ") })}</p>`
			});
			if (!ok) return;
		}
		atual.status = "cursando";
		this.aba = "boletim";
		await salvarAluno(this.actor, aluno);
	}

	static async #encerrarSemestre() {
		if (!game.user.isGM) return;
		const aluno = lerAluno(this.actor);
		const atual = aluno?.semestres.at(-1);
		if (!atual || atual.status !== "cursando") return;
		const pendentes = pendenciasParaEncerrar(atual);
		if (pendentes.length) {
			ui.notifications.warn(game.i18n.format("ACADEMIA.Aviso.Pendencias", { lista: pendentes.map((d) => d.nome).join(", ") }));
			return;
		}
		atual.status = "encerrado";
		await salvarAluno(this.actor, aluno);
	}

	static async #reabrirSemestre() {
		if (!game.user.isGM) return;
		await this.#modificar((aluno) => {
			const atual = aluno.semestres.at(-1);
			if (!atual || atual.status !== "encerrado") return false;
			atual.status = "cursando";
		});
	}

	static async #excluirSemestre(event, alvo) {
		if (!game.user.isGM) return;
		const aluno = lerAluno(this.actor);
		if (!aluno?.semestres.length) return;
		const ultimo = aluno.semestres.at(-1);
		const ok = await DialogV2.confirm({
			window: { title: "Excluir semestre" },
			content: `<p>${game.i18n.format("ACADEMIA.Aviso.ConfirmaExcluirSemestre", { numero: ultimo.numero })}</p>`
		});
		if (!ok) return;
		aluno.semestres.pop();
		await salvarAluno(this.actor, aluno);
	}

	static async #desligar() {
		if (!game.user.isGM) return;
		const ok = await DialogV2.confirm({
			window: { title: "Remover registro acadêmico" },
			content: `<p>${game.i18n.format("ACADEMIA.Aviso.ConfirmaDesligar", { nome: this.actor.name })}</p>`
		});
		if (!ok) return;
		await removerAluno(this.actor);
	}

	static async #matricular(event, alvo) {
		if (!podeMatricular(this.actor)) return;
		const id = alvo.closest("[data-disciplina]")?.dataset.disciplina;
		const { catalogo, ofertas } = contextoCatalogo();
		const disc = catalogo.get(id);
		if (!disc) return;
		await this.#modificar((aluno) => {
			const indice = aluno.semestres.length - 1;
			const atual = aluno.semestres[indice];
			if (atual?.status !== "matricula") return false;
			const max = opcao("maxDisciplinas");
			if (max > 0 && atual.disciplinas.length >= max) {
				ui.notifications.warn(game.i18n.format("ACADEMIA.Aviso.Maximo", { max }));
				return false;
			}
			const av = avaliarDisciplina(disc, aluno, indice, catalogo, ofertas);
			if (av.estado !== "disponivel") {
				ui.notifications.warn(av.motivo);
				return false;
			}
			atual.disciplinas.push({ id: disc.id, nome: disc.nome, pericia: disc.pericia, oficio: null, nota: null, situacao: "cursando" });
		});
	}

	static async #desmatricular(event, alvo) {
		if (!podeMatricular(this.actor)) return;
		const id = alvo.closest("[data-disciplina]")?.dataset.disciplina;
		await this.#modificar((aluno) => {
			const atual = aluno.semestres.at(-1);
			if (atual?.status !== "matricula") return false;
			atual.disciplinas = atual.disciplinas.filter((d) => d.id !== id);
		});
	}

	static async #rolar(event, alvo) {
		const linha = alvo.closest("[data-semestre]");
		const aluno = lerAluno(this.actor);
		const entrada = aluno?.semestres[Number(linha?.dataset.semestre)]?.disciplinas[Number(linha?.dataset.indice)];
		if (!entrada) return;
		const chave = periciaEfetiva(entrada);
		if (chave === OFICIO_LIVRE) {
			ui.notifications.warn(game.i18n.format("ACADEMIA.Aviso.EscolhaOficio", { nome: entrada.nome }));
			return;
		}
		const pericias = this.actor.system?.pericias ?? {};
		if (typeof this.actor.rollPericia === "function" && pericias[chave]) {
			return this.actor.rollPericia(chave, { event, message: true });
		}
		const { rotulos } = oficiosDisponiveis(pericias);
		const roll = await new Roll(`1d20 + ${Number(pericias[chave]?.value ?? 0)}`).evaluate();
		return roll.toMessage({
			speaker: ChatMessage.getSpeaker({ actor: this.actor }),
			flavor: `${nomePericia(chave, rotulos)} (${entrada.nome})`
		});
	}

	static async #alternarElemento(event, alvo) {
		if (!game.user.isGM) return;
		const id = alvo.dataset.elemento;
		await this.#modificar((aluno) => {
			aluno.quatroElementos[id] = !aluno.quatroElementos[id];
		});
	}

	static async #abrirCompendio() {
		const pack = game.packs.get(`${MODULO}.compendio`);
		if (!pack) return;
		const indice = await pack.getIndex();
		const entrada = indice.contents[0];
		if (entrada) (await pack.getDocument(entrada._id))?.sheet.render(true);
		else pack.render(true);
	}
}

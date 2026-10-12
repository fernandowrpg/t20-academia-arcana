import { DIAS_LETIVOS, TURNOS } from "../data/alunos.mjs";
import { TOTAL_HORARIOS, choquesDeHorario, colegasDeTurma, distribuirHorarios, montarTurmas, rotuloHorario, semestreVigente } from "../calendario.mjs";
import { descricaoNpc } from "../gerador.mjs";
import { nomePericia } from "../logica.mjs";
import { MODULO, contextoCatalogo, ehAluno, lerAluno, opcao } from "../config.mjs";
import { VidaAcademicaApp } from "./vida-academica.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

function participantes() {
	return game.actors
		.filter((a) => ehAluno(a))
		.map((actor) => {
			const aluno = lerAluno(actor);
			return {
				id: actor.id,
				nome: actor.name,
				img: actor.img,
				pc: actor.hasPlayerOwner || (actor.type === "character" && !aluno.npc),
				detalhe: descricaoNpc(aluno.npc),
				abre: game.user.isGM || actor.isOwner,
				aluno
			};
		})
		.filter((p) => semestreVigente(p.aluno))
		.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export class CalendarioApp extends HandlebarsApplicationMixin(ApplicationV2) {
	static instancia = null;

	static abrir() {
		if (!game.user.isGM && !opcao("calendarioJogadores")) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.CalendarioRestrito"));
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
		id: "academia-arcana-calendario",
		classes: ["academia-arcana", "aa-calendario-app"],
		window: { title: "ACADEMIA.Calendario", icon: "fa-solid fa-calendar-week", resizable: true },
		position: { width: 1080, height: 720 },
		actions: {
			abrirAluno: CalendarioApp.#abrirAluno,
			redistribuir: CalendarioApp.#redistribuir
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/calendario.hbs`, scrollable: [".aa-conteudo"] }
	};

	filtro = null;

	async _onClose(options) {
		await super._onClose(options);
		CalendarioApp.instancia = null;
	}

	async _prepareContext() {
		const gm = game.user.isGM;
		const todos = participantes();
		const pcs = todos.filter((p) => p.pc);
		const turmas = montarTurmas(todos);
		const salvos = opcao("horarios") ?? {};
		const horarios = distribuirHorarios(turmas, salvos);
		const choques = choquesDeHorario(turmas, horarios);
		const { catalogo } = contextoCatalogo();

		if (gm) {
			const novas = turmas.filter((t) => !Number.isInteger(salvos[t.id]));
			if (novas.length) game.settings.set(MODULO, "horarios", { ...salvos, ...Object.fromEntries(novas.map((t) => [t.id, horarios[t.id]])) });
		}

		let filtro = this.filtro;
		if (filtro !== "todas" && filtro !== "pcs" && !pcs.some((p) => p.id === filtro)) filtro = pcs.length ? "pcs" : "todas";
		const visiveis = turmas.filter((t) => {
			if (filtro === "todas") return true;
			if (filtro === "pcs") return t.alunos.some((a) => a.pc);
			return t.alunos.some((a) => a.id === filtro);
		});

		const aluno = (a) => ({ id: a.id, nome: a.nome, img: a.img, detalhe: a.detalhe, abre: a.abre, destaque: a.id === filtro });
		const cartao = (t) => ({
			id: t.id,
			nome: t.nome,
			pericia: nomePericia(t.pericia),
			professor: catalogo.get(t.id)?.professor ?? "",
			pcs: t.alunos.filter((a) => a.pc).map(aluno),
			npcs: t.alunos.filter((a) => !a.pc).map(aluno),
			total: t.alunos.length,
			comPc: t.alunos.some((a) => a.pc),
			choque: [...new Set(choques.get(t.id) ?? [])].join(", "),
			horarios: Array.from({ length: TOTAL_HORARIOS }, (_, h) => ({ valor: h, rotulo: rotuloHorario(h), selecionado: h === horarios[t.id] }))
		});
		const dias = DIAS_LETIVOS.map((nome, d) => {
			const turnos = TURNOS.map((turno, t) => ({
				nome: turno,
				turmas: visiveis.filter((x) => horarios[x.id] === d * TURNOS.length + t).map(cartao)
			}));
			return { nome, turnos, vazio: turnos.every((t) => !t.turmas.length) };
		});
		const colegas = colegasDeTurma(visiveis).map((c) => ({
			id: c.id,
			nome: c.nome,
			detalhe: c.detalhe,
			abre: c.abre,
			total: c.aulas.length,
			aulas: c.aulas.map((a) => ({ nome: a.nome, pcs: a.pcs.join(", ") }))
		}));

		return {
			gm,
			dias,
			colegas,
			vazio: !visiveis.length,
			semAlunos: !todos.length,
			totalTurmas: visiveis.length,
			filtros: [
				{ valor: "pcs", rotulo: "Aulas dos personagens", selecionado: filtro === "pcs" },
				...pcs.map((p) => ({ valor: p.id, rotulo: `Aulas de ${p.nome}`, selecionado: filtro === p.id })),
				{ valor: "todas", rotulo: "Todas as aulas da Academia", selecionado: filtro === "todas" }
			]
		};
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		this.element.querySelector("select[name='aa-cal-filtro']")?.addEventListener("change", (ev) => {
			this.filtro = ev.target.value;
			this.render();
		});
		this.element.querySelectorAll("select[data-horario]").forEach((el) =>
			el.addEventListener("change", (ev) => {
				if (!game.user.isGM) return;
				game.settings.set(MODULO, "horarios", { ...(opcao("horarios") ?? {}), [ev.target.dataset.horario]: Number(ev.target.value) });
			})
		);
	}

	static #abrirAluno(event, alvo) {
		const actor = game.actors.get(alvo.dataset.actor);
		if (actor && (game.user.isGM || actor.isOwner)) VidaAcademicaApp.abrir(actor);
	}

	static async #redistribuir() {
		if (!game.user.isGM) return;
		const ok = await DialogV2.confirm({
			window: { title: "Redistribuir horários" },
			content: "<p>Descartar os horários atuais e distribuir todas as turmas de novo, evitando choques?</p>"
		});
		if (ok) await game.settings.set(MODULO, "horarios", {});
	}
}

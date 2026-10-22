import { DIAS_DE_FOLGA, DIAS_LETIVOS, TURNOS } from "../data/alunos.mjs";
import {
	DEUSES_DOS_DIAS,
	DIAS_DA_SEMANA,
	DIAS_POR_MES,
	MESES,
	TOTAL_HORARIOS,
	choquesDeHorario,
	colegasDeTurma,
	diaDaSemana,
	distribuirHorarios,
	encontrosDaSemana,
	montarTurmas,
	normalizarData,
	rotuloData,
	rotuloHorario,
	semanaDe,
	semestreVigente,
	somarDias
} from "../calendario.mjs";
import { descricaoNpc, descricaoParceiro } from "../gerador.mjs";
import { nomePericia } from "../logica.mjs";
import { MODULO, contextoCatalogo, ehAluno, lerAluno, nomesDeProfessor, opcao } from "../config.mjs";
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
				parceiro: descricaoParceiro(aluno.npc),
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
			redistribuir: CalendarioApp.#redistribuir,
			mudarDia: CalendarioApp.#mudarDia,
			escolherDia: CalendarioApp.#escolherDia,
			definirData: CalendarioApp.#definirData
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/calendario.hbs`, scrollable: [".aa-conteudo"] }
	};

	filtro = null;

	/* Filtro do resumo do mestre: "juntos", "aluno:<id>" ou "prof:<nome>". */
	resumo = "juntos";

	/* O mês inteiro aberto abaixo da data. */
	mesAberto = false;

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
		const hoje = normalizarData(opcao("dataArton"));
		const semana = semanaDe(hoje);
		const mesmaData = (a, b) => a.ano === b.ano && a.mes === b.mes && a.dia === b.dia;
		const curta = (d) => `${d.dia} de ${MESES[d.mes].nome}`;
		const dias = DIAS_LETIVOS.map((nome, d) => {
			const turnos = TURNOS.map((turno, t) => ({
				nome: turno,
				turmas: visiveis.filter((x) => horarios[x.id] === d * TURNOS.length + t).map(cartao)
			}));
			return { nome, data: curta(semana[d].data), deus: DEUSES_DOS_DIAS[nome], hoje: mesmaData(semana[d].data, hoje), turnos, vazio: turnos.every((t) => !t.turmas.length) };
		});
		const folgas = semana.slice(DIAS_LETIVOS.length).map((d) => ({ nome: d.nome, data: curta(d.data), deus: DEUSES_DOS_DIAS[d.nome], hoje: mesmaData(d.data, hoje) }));
		const mes = MESES[hoje.mes];
		const calendario = {
			rotulo: rotuloData(hoje),
			diaDaSemana: DIAS_DA_SEMANA[diaDaSemana(hoje)],
			deus: DEUSES_DOS_DIAS[DIAS_DA_SEMANA[diaDaSemana(hoje)]],
			mes: mes.nome,
			estacao: mes.estacao,
			sobre: mes.sobre,
			folga: diaDaSemana(hoje) >= DIAS_LETIVOS.length,
			aberto: this.mesAberto,
			cabecalho: DIAS_DA_SEMANA.map((nome, i) => ({ nome, folga: i >= DIAS_LETIVOS.length })),
			semanas: Array.from({ length: DIAS_POR_MES / DIAS_DA_SEMANA.length }, (_, w) =>
				DIAS_DA_SEMANA.map((_, i) => {
					const dia = w * DIAS_DA_SEMANA.length + i + 1;
					return { dia, hoje: dia === hoje.dia, folga: i >= DIAS_LETIVOS.length, semana: semana.some((s) => s.data.mes === hoje.mes && s.data.dia === dia) };
				})
			)
		};
		const colegas = colegasDeTurma(visiveis).map((c) => ({
			id: c.id,
			nome: c.nome,
			detalhe: c.detalhe,
			parceiro: c.parceiro,
			abre: c.abre,
			total: c.aulas.length,
			aulas: c.aulas.map((a) => ({ nome: a.nome, pcs: a.pcs.join(", ") }))
		}));

		return {
			gm,
			dias,
			folga: DIAS_DE_FOLGA.join(" e "),
			folgas,
			calendario,
			resumo: gm ? this.#resumoDoMestre(turmas, horarios, catalogo, aluno) : null,
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

	/* Momentos da semana em que os personagens têm aula juntos, ou com um NPC escolhido. */
	#resumoDoMestre(turmas, horarios, catalogo, aluno) {
		const professoresDe = (id) => nomesDeProfessor(catalogo.get(id)?.professor);
		const comPc = turmas.filter((t) => t.alunos.some((a) => a.pc));
		const npcs = colegasDeTurma(turmas).map((c) => ({ valor: `aluno:${c.id}`, rotulo: `${c.nome} (${c.aulas.length})` }));
		const contagem = new Map();
		for (const t of comPc) for (const nome of professoresDe(t.id)) contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
		const professores = [...contagem]
			.sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
			.map(([nome, total]) => ({ valor: `prof:${nome}`, rotulo: `${nome} (${total})` }));

		let alvo = this.resumo;
		if (![...npcs, ...professores].some((o) => o.valor === alvo)) alvo = "juntos";
		const marcar = (o) => ({ ...o, selecionado: o.valor === alvo });
		const totalPcs = new Set(comPc.flatMap((t) => t.alunos.filter((a) => a.pc).map((a) => a.id))).size;
		const destaque = alvo.startsWith("aluno:") ? alvo.slice(6) : null;
		const chip = (a) => ({ ...aluno(a), destaque: a.id === destaque });

		const encontros = encontrosDaSemana(turmas, horarios, alvo, professoresDe);
		const dias = DIAS_LETIVOS.map((nome, d) => ({
			nome,
			aulas: encontros
				.filter((e) => Math.floor(e.horario / TURNOS.length) === d)
				.map(({ turma: t, horario }) => {
					const pcs = t.alunos.filter((a) => a.pc);
					return {
						turno: TURNOS[horario % TURNOS.length],
						nome: t.nome,
						professor: catalogo.get(t.id)?.professor ?? "",
						pcs: pcs.map(chip),
						npcs: t.alunos.filter((a) => !a.pc).map(chip),
						todos: totalPcs > 1 && pcs.length === totalPcs
					};
				})
		})).filter((d) => d.aulas.length);

		return {
			dias,
			total: encontros.length,
			juntos: alvo === "juntos",
			npcs: npcs.map(marcar),
			professores: professores.map(marcar),
			vazio: alvo === "juntos" ? "Nenhuma aula reúne dois ou mais personagens nesta semana." : "Esse NPC não divide aula com os personagens nesta semana."
		};
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		this.element.querySelector("select[name='aa-cal-filtro']")?.addEventListener("change", (ev) => {
			this.filtro = ev.target.value;
			this.render();
		});
		this.element.querySelector("details.aa-cal-mes")?.addEventListener("toggle", (ev) => (this.mesAberto = ev.target.open));
		this.element.querySelector("select[name='aa-cal-mestre']")?.addEventListener("change", (ev) => {
			this.resumo = ev.target.value;
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

	static async #mudarDia(event, alvo) {
		if (!game.user.isGM) return;
		await game.settings.set(MODULO, "dataArton", somarDias(opcao("dataArton"), Number(alvo.dataset.dias) || 0));
	}

	static async #escolherDia(event, alvo) {
		if (!game.user.isGM) return;
		await game.settings.set(MODULO, "dataArton", normalizarData({ ...normalizarData(opcao("dataArton")), dia: Number(alvo.dataset.dia) }));
	}

	static async #definirData() {
		if (!game.user.isGM) return;
		const atual = normalizarData(opcao("dataArton"));
		const meses = MESES.map((m, i) => `<option value="${i}" ${i === atual.mes ? "selected" : ""}>${m.nome} (${m.estacao.toLowerCase()})</option>`).join("");
		const data = await DialogV2.prompt({
			window: { title: "Data em Arton" },
			content: `<div style="display:grid;grid-template-columns:5rem 1fr 6rem;gap:.5rem">
				<label>Dia<input type="number" name="dia" min="1" max="${DIAS_POR_MES}" step="1" value="${atual.dia}"></label>
				<label>Mês<select name="mes">${meses}</select></label>
				<label>Ano<input type="number" name="ano" step="1" value="${atual.ano}"></label>
			</div>
			<p class="hint">Cada mês tem ${DIAS_POR_MES} dias (quatro semanas de Valk a Leen).</p>`,
			ok: { label: "Salvar", callback: (ev, botao) => ({ dia: botao.form.elements.dia.value, mes: botao.form.elements.mes.value, ano: botao.form.elements.ano.value }) },
			rejectClose: false
		});
		if (data) await game.settings.set(MODULO, "dataArton", normalizarData(data));
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

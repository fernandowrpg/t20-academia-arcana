import { ATRIBUTOS, CLASSES, NIVEL_MAXIMO, RACAS } from "../data/alunos.mjs";
import { GREMIOS } from "../data/disciplinas.mjs";
import { descricaoNpc, descricaoParceiro, gerarAluno, resumoNpc } from "../gerador.mjs";
import { nomePericia } from "../logica.mjs";
import { FLAG, MODULO, contextoCatalogo, disciplinasDosPersonagens, opcao, sincronizarPericias } from "../config.mjs";
import { CalendarioApp } from "./calendario.mjs";
import { VidaAcademicaApp } from "./vida-academica.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const PASTA = "Alunos da Academia";
const MAX_POR_VEZ = 20;

function opcoes(mapa, selecionado, rotuloAleatorio) {
	return [{ valor: "", rotulo: rotuloAleatorio, selecionado: !selecionado }].concat(
		Object.entries(mapa)
			.map(([valor, d]) => ({ valor, rotulo: d.nome, selecionado: valor === selecionado }))
			.sort((a, b) => a.rotulo.localeCompare(b.rotulo, "pt-BR"))
	);
}

export class GeradorAlunosApp extends HandlebarsApplicationMixin(ApplicationV2) {
	static instancia = null;

	static abrir() {
		if (!game.user.isGM) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.SomenteMestreGerador"));
			return null;
		}
		this.instancia ??= new this();
		this.instancia.render({ force: true });
		return this.instancia;
	}

	static DEFAULT_OPTIONS = {
		id: "academia-arcana-gerador",
		classes: ["academia-arcana", "aa-gerador-app"],
		window: { title: "ACADEMIA.Gerador", icon: "fa-solid fa-dice-d20", resizable: true },
		position: { width: 560, height: 640 },
		actions: {
			gerar: GeradorAlunosApp.#gerar,
			abrirFicha: GeradorAlunosApp.#abrirFicha,
			abrirVida: GeradorAlunosApp.#abrirVida,
			calendario: GeradorAlunosApp.#calendario
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/gerador.hbs`, scrollable: [".aa-conteudo"] }
	};

	escolhas = { quantidade: 1, nivel: "", raca: "", classe: "", periodo: "" };

	gerados = [];

	async _onClose(options) {
		await super._onClose(options);
		GeradorAlunosApp.instancia = null;
	}

	async _prepareContext() {
		const regulares = opcao("semestresRegulares");
		const periodos = [{ valor: "", rotulo: "Aleatório", selecionado: !this.escolhas.periodo }];
		for (let n = 1; n <= regulares; n++) periodos.push({ valor: n, rotulo: `${n}º semestre`, selecionado: Number(this.escolhas.periodo) === n });
		return {
			...this.escolhas,
			nivelMaximo: NIVEL_MAXIMO,
			maxPorVez: MAX_POR_VEZ,
			racas: opcoes(RACAS, this.escolhas.raca, "Aleatória"),
			classes: opcoes(CLASSES, this.escolhas.classe, "Aleatória"),
			periodos,
			pasta: PASTA,
			gerados: this.gerados
		};
	}

	#lerEscolhas() {
		const campo = (nome) => this.element.querySelector(`[name='aa-${nome}']`)?.value ?? "";
		const inteiro = (nome, max) => Math.max(1, Math.min(max, Math.round(Number(campo(nome))) || 1));
		this.escolhas = {
			quantidade: inteiro("quantidade", MAX_POR_VEZ),
			nivel: campo("nivel") === "" ? "" : inteiro("nivel", NIVEL_MAXIMO),
			raca: campo("raca"),
			classe: campo("classe"),
			periodo: campo("periodo")
		};
		return this.escolhas;
	}

	static async #gerar(event, alvo) {
		if (!game.user.isGM) return;
		const { quantidade, nivel, raca, classe, periodo } = this.#lerEscolhas();
		alvo.disabled = true;
		const { catalogo, ofertas } = contextoCatalogo();
		const usados = new Set(game.actors.map((a) => a.name));
		const preferidas = disciplinasDosPersonagens();
		const pasta = game.folders.find((f) => f.type === "Actor" && f.name === PASTA) ?? (await Folder.create({ name: PASTA, type: "Actor" }));
		const novos = [];
		for (let i = 0; i < quantidade; i++) {
			const g = gerarAluno({
				nivel,
				raca,
				classe,
				periodo,
				usados,
				catalogo,
				ofertas,
				preferidas,
				min: opcao("minDisciplinas"),
				max: opcao("maxDisciplinas"),
				semestresRegulares: opcao("semestresRegulares")
			});
			usados.add(g.nome);
			const actor = await Actor.implementation.create({
				name: g.nome,
				type: "character",
				folder: pasta?.id ?? null,
				system: {
					atributos: Object.fromEntries(Object.keys(ATRIBUTOS).map((chave) => [chave, { base: g.atributos.base[chave], racial: g.atributos.bonus[chave] }])),
					attributes: { pv: { value: g.pv, max: g.pv }, pm: { value: g.pm, max: g.pm } },
					detalhes: { raca: RACAS[g.raca].nome, biography: { value: resumoNpc(g.aluno) } }
				},
				/* No sistema Tormenta20, nível, PV e PM do personagem vêm do item de classe. */
				items: [
					{
						name: CLASSES[g.classe].nome,
						type: "classe",
						system: { niveis: g.nivel, pvPorNivel: CLASSES[g.classe].pv[1], pmPorNivel: CLASSES[g.classe].pm, inicial: true }
					}
				],
				prototypeToken: { name: g.nome, disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL, actorLink: true },
				flags: { [MODULO]: { [FLAG]: g.aluno } }
			});
			if (!actor) continue;
			await sincronizarPericias(actor, g.aluno);
			novos.push({
				id: actor.id,
				nome: g.nome,
				descricao: descricaoNpc(g.aluno.npc),
				periodo: g.periodo,
				parceiro: descricaoParceiro(g.aluno.npc),
				nivel: g.nivel,
				atributos: Object.entries(g.atributos.total).map(([chave, valor]) => ({ sigla: chave.toUpperCase(), valor, foco: chave === CLASSES[g.classe].foco, nome: ATRIBUTOS[chave] })),
				gremio: GREMIOS[g.aluno.gremio] ?? null,
				pericias: g.pericias.map((p) => nomePericia(p)).sort((a, b) => a.localeCompare(b, "pt-BR")),
				disciplinas: g.aluno.semestres.at(-1)?.disciplinas.map((d) => d.nome) ?? []
			});
		}
		this.gerados = [...novos, ...this.gerados];
		ui.notifications.info(game.i18n.format("ACADEMIA.Aviso.Gerados", { qtd: novos.length, pasta: PASTA }));
		this.render();
	}

	static #abrirFicha(event, alvo) {
		game.actors.get(alvo.closest("[data-actor]")?.dataset.actor)?.sheet.render(true);
	}

	static #abrirVida(event, alvo) {
		VidaAcademicaApp.abrir(game.actors.get(alvo.closest("[data-actor]")?.dataset.actor));
	}

	static #calendario() {
		CalendarioApp.abrir();
	}
}

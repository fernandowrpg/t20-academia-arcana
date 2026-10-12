import { DISCIPLINAS, PERICIAS_T20, slug } from "../data/disciplinas.mjs";
import { configPadrao, montarCatalogo, nomePericia, normalizarPersonalizada, ordenarPericias } from "../logica.mjs";
import { MODULO, lerConfigCatalogo } from "../config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

export class CatalogoApp extends HandlebarsApplicationMixin(ApplicationV2) {
	static DEFAULT_OPTIONS = {
		id: "academia-arcana-catalogo",
		tag: "form",
		classes: ["academia-arcana", "aa-catalogo"],
		window: { title: "ACADEMIA.Catalogo", icon: "fa-solid fa-book-open", resizable: true },
		position: { width: 820, height: 720 },
		form: { handler: CatalogoApp.#salvar, submitOnChange: false, closeOnSubmit: false },
		actions: {
			adicionar: CatalogoApp.#adicionar,
			remover: CatalogoApp.#remover,
			restaurar: CatalogoApp.#restaurar
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/catalogo.hbs`, scrollable: [".aa-conteudo"] }
	};

	constructor(options = {}) {
		super(options);
		this.rascunho = lerConfigCatalogo();
	}

	async _prepareContext() {
		const r = this.rascunho;
		const ocultas = new Set(r.ocultas);
		const ofertas = new Set(r.ofertas);
		const catalogo = montarCatalogo({ ...r, ocultas: [] });
		const nomeDe = (id) => catalogo.get(id)?.nome ?? id;
		const opcoesPericia = (sel) =>
			ordenarPericias(Object.keys(PERICIAS_T20)).map((valor) => ({ valor, rotulo: nomePericia(valor), selecionado: valor === sel }));
		const padroes = ordenarPericias(DISCIPLINAS.map((d) => d.pericia));
		return {
			grupos: padroes.map((chave) => ({
				id: chave,
				nome: nomePericia(chave),
				disciplinas: DISCIPLINAS.filter((d) => d.pericia === chave).map((d) => {
					const atual = r.pericias?.[d.id] || d.pericia;
					return {
						id: d.id,
						nome: d.nome,
						professor: d.professor,
						oculta: ocultas.has(d.id),
						especial: d.especial,
						ofertada: ofertas.has(d.id),
						alterada: atual !== d.pericia,
						opcoes: opcoesPericia(atual)
					};
				})
			})),
			personalizadas: r.personalizadas.map((d, i) => ({
				indice: i,
				nome: d.nome,
				professor: d.professor,
				especial: d.especial,
				ofertada: ofertas.has(slug(d.nome)),
				id: slug(d.nome),
				prereqs: (Array.isArray(d.prereqs) ? d.prereqs.map(nomeDe) : [d.prereqs]).filter(Boolean).join(", "),
				pericias: opcoesPericia(d.pericia || "conh")
			}))
		};
	}

	#coletar() {
		const dados = foundry.utils.expandObject(new foundry.applications.ux.FormDataExtended(this.element).object);
		const marcados = (obj) =>
			Object.entries(obj ?? {})
				.filter(([, v]) => v)
				.map(([k]) => k);
		const personalizadas = Object.entries(dados.personalizadas ?? {})
			.sort(([a], [b]) => Number(a) - Number(b))
			.map(([, d]) => ({
				nome: String(d.nome ?? ""),
				pericia: d.pericia,
				professor: String(d.professor ?? ""),
				prereqs: String(d.prereqs ?? "")
					.split(",")
					.map((p) => slug(p))
					.filter(Boolean),
				especial: !!d.especial
			}));
		const ofertas = marcados(dados.ofertas);
		for (const d of Object.values(dados.personalizadas ?? {})) {
			if (d.ofertada && d.nome) ofertas.push(slug(d.nome));
		}
		const padrao = new Map(DISCIPLINAS.map((d) => [d.id, d.pericia]));
		const pericias = Object.fromEntries(Object.entries(dados.pericias ?? {}).filter(([id, chave]) => chave && chave !== padrao.get(id)));
		this.rascunho = {
			pericias,
			ocultas: marcados(dados.ocultas),
			ofertas: [...new Set(ofertas)],
			personalizadas
		};
	}

	static async #salvar() {
		this.#coletar();
		const final = {
			...this.rascunho,
			personalizadas: this.rascunho.personalizadas.filter((d) => d.nome.trim()).map((d) => {
				const n = normalizarPersonalizada(d);
				delete n.id;
				return n;
			})
		};
		await game.settings.set(MODULO, "catalogo", final);
		this.rascunho = lerConfigCatalogo();
		ui.notifications.info(game.i18n.localize("ACADEMIA.Aviso.CatalogoSalvo"));
		this.render();
	}

	static #adicionar() {
		this.#coletar();
		this.rascunho.personalizadas.push({ nome: "", pericia: "conh", professor: "", prereqs: [], especial: false });
		this.render();
	}

	static #remover(event, alvo) {
		this.#coletar();
		this.rascunho.personalizadas.splice(Number(alvo.closest("[data-indice]").dataset.indice), 1);
		this.render();
	}

	static async #restaurar() {
		const ok = await DialogV2.confirm({
			window: { title: "Restaurar catálogo" },
			content: "<p>Descartar todas as alterações do catálogo (disciplinas da mesa, ocultas, ofertas e perícias alteradas)?</p>"
		});
		if (!ok) return;
		await game.settings.set(MODULO, "catalogo", configPadrao());
		this.rascunho = lerConfigCatalogo();
		this.render();
	}
}

import { MODULO } from "../config.mjs";
import { ATOS, PLANOS } from "../data/planos.mjs";
import { anunciarPlano, dadosDaAcademia, dadosDoPlano, definirPlanoAtual, lerExpedicao, restaurarRegrasDoPlano, salvarTextosDoPlano } from "../planos.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

const CAMPOS = ["titulo", "regraTitulo", "regras", "anotacoes", "segredo"];

/* Editor do mestre: escolhe em que plano a turma está e edita regras e anotações de cada um. */
export class PlanosApp extends HandlebarsApplicationMixin(ApplicationV2) {
	static instancia = null;

	static abrir(id) {
		if (!game.user.isGM) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.SomenteMestrePlanos"));
			return null;
		}
		this.instancia ??= new this();
		if (id) this.instancia.selecionado = id;
		this.instancia.render({ force: true });
		return this.instancia;
	}

	static atualizar() {
		const app = this.instancia;
		if (!app?.rendered) return;
		/* Não redesenha enquanto o mestre digita: o texto em edição se perderia. */
		if (app.element.contains(document.activeElement) && document.activeElement.matches("input, textarea")) return;
		app.render();
	}

	selecionado = lerExpedicao().atual || "academia";

	static DEFAULT_OPTIONS = {
		id: "academia-arcana-planos",
		classes: ["academia-arcana", "aa-planos-app"],
		window: { title: "ACADEMIA.Planos", icon: "fa-solid fa-dungeon", resizable: true },
		position: { width: 760, height: 700 },
		actions: {
			selecionar: PlanosApp.#selecionar,
			irPara: PlanosApp.#irPara,
			anunciar: PlanosApp.#anunciar,
			restaurar: PlanosApp.#restaurar
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/planos.hbs`, scrollable: [".aa-planos-lista", ".aa-planos-editor"] }
	};

	async _onClose(options) {
		await super._onClose(options);
		PlanosApp.instancia = null;
	}

	async _prepareContext() {
		const expedicao = lerExpedicao();
		const atos = Object.entries(ATOS).map(([numero, rotulo]) => ({
			rotulo,
			planos: PLANOS.filter((p) => p.ato === Number(numero)).map((p) => {
				const dados = dadosDoPlano(p.id, expedicao);
				return {
					id: p.id,
					nome: p.nome,
					deus: p.deus,
					icone: p.icone,
					ordem: dados.ordem,
					atual: p.id === expedicao.atual,
					selecionado: p.id === this.selecionado,
					anotado: dados.editado || !!dados.anotacoes || !!dados.segredo
				};
			})
		}));
		const academia = dadosDaAcademia(expedicao);
		const naAcademia = !expedicao.atual;
		const plano = this.selecionado === "academia" ? { ...academia, atual: naAcademia } : { ...dadosDoPlano(this.selecionado, expedicao), atual: this.selecionado === expedicao.atual };
		return {
			atos,
			naAcademia,
			academiaSelecionada: this.selecionado === "academia",
			academiaAnotada: !!academia.titulo || !!academia.anotacoes || !!academia.segredo,
			plano
		};
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		const editor = this.element.querySelector(".aa-planos-editor");
		if (!editor) return;
		editor.dataset.aaPlano = context.plano.id;
		for (const campo of CAMPOS) {
			editor.querySelector(`[name='${campo}']`)?.addEventListener("change", (ev) => salvarTextosDoPlano(context.plano.id, { [campo]: ev.target.value }));
		}
	}

	static #selecionar(event, alvo) {
		this.selecionado = alvo.closest("[data-plano]").dataset.plano;
		this.render();
	}

	/* "academia" não é um plano: definirPlanoAtual tira a turma dos planos. */
	static async #irPara() {
		await definirPlanoAtual(this.selecionado);
	}

	static async #anunciar() {
		await anunciarPlano(this.selecionado);
	}

	static async #restaurar() {
		const plano = dadosDoPlano(this.selecionado);
		const ok = await DialogV2.confirm({
			window: { title: "Restaurar regras" },
			content: `<p>Voltar o título e as regras de <strong>${plano.nome}</strong> ao texto da Wiki Divina? As anotações e as notas do mestre continuam.</p>`
		});
		if (ok) await restaurarRegrasDoPlano(this.selecionado);
	}
}

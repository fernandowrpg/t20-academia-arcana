import { MODULO } from "../config.mjs";
import { planoAtual } from "../planos.mjs";
import {
	CAMPOS_TESTE,
	alternarVisibilidade,
	anunciarTeste,
	contextoDoTeste,
	excluirGuardado,
	guardarTeste,
	lerTeste,
	salvarCamposDoTeste,
	substituirTeste,
	testeDeExemplo,
	testeEmBranco,
	zerarTeste
} from "../teste-estendido.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

/* Editor do mestre para o teste estendido, nos campos do template "T20 - Teste Estendido" do Obsidian. */
export class TesteEstendidoApp extends HandlebarsApplicationMixin(ApplicationV2) {
	static instancia = null;

	static abrir() {
		if (!game.user.isGM) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.SomenteMestreTeste"));
			return null;
		}
		this.instancia ??= new this();
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

	static DEFAULT_OPTIONS = {
		id: "academia-arcana-teste-estendido",
		classes: ["academia-arcana", "aa-teste-app"],
		window: { title: "ACADEMIA.TesteEstendido", icon: "fa-solid fa-dice-d20", resizable: true },
		position: { width: 700, height: 760 },
		actions: {
			visivel: TesteEstendidoApp.#visivel,
			zerar: TesteEstendidoApp.#zerar,
			anunciar: TesteEstendidoApp.#anunciar,
			novo: TesteEstendidoApp.#novo,
			exemplo: TesteEstendidoApp.#exemplo,
			guardar: TesteEstendidoApp.#guardar,
			carregar: TesteEstendidoApp.#carregar,
			excluir: TesteEstendidoApp.#excluir,
			cdDoPlano: TesteEstendidoApp.#cdDoPlano
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/teste-estendido.hbs`, scrollable: [".aa-teste-editor"] }
	};

	async _onClose(options) {
		await super._onClose(options);
		TesteEstendidoApp.instancia = null;
	}

	async _prepareContext() {
		const dados = lerTeste();
		const plano = planoAtual();
		return {
			teste: dados.atual,
			resumo: contextoDoTeste({ gm: true, dados }),
			visivel: dados.visivel,
			salvos: dados.salvos.map((t, indice) => ({ indice, titulo: t.titulo, cd: t.cd, meta: `${t.sucessosNecessarios} antes de ${t.falhasLimite}`, atual: t.titulo.trim() && t.titulo.trim() === dados.atual.titulo.trim() })),
			plano: plano && { nome: plano.nome, cd: plano.cd }
		};
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		for (const campo of CAMPOS_TESTE) {
			this.element.querySelector(`[name='${campo}']`)?.addEventListener("change", (ev) => salvarCamposDoTeste({ [campo]: ev.target.value }));
		}
	}

	static #visivel() {
		alternarVisibilidade();
	}

	static #zerar() {
		zerarTeste();
	}

	static #anunciar() {
		anunciarTeste();
	}

	static async #confirmarTroca(acao) {
		const dados = lerTeste();
		if (!dados.atual.titulo.trim() && !dados.atual.principais.trim()) return true;
		return DialogV2.confirm({
			window: { title: "Trocar o teste" },
			content: `<p>${acao} O teste atual (<strong>${foundry.utils.escapeHTML(dados.atual.titulo || "sem título")}</strong>) sai da tela e o contador é zerado. Use <em>Guardar</em> antes se quiser reaproveitá-lo.</p>`
		});
	}

	static async #novo() {
		if (await TesteEstendidoApp.#confirmarTroca("Começar um teste em branco?")) await substituirTeste(testeEmBranco());
		this.render();
	}

	static async #exemplo() {
		if (await TesteEstendidoApp.#confirmarTroca("Carregar o exemplo A Rua que Andou?")) await substituirTeste(testeDeExemplo());
		this.render();
	}

	static async #guardar() {
		const ok = await guardarTeste();
		if (!ok) ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.TesteSemTitulo"));
	}

	static async #carregar(event, alvo) {
		const indice = Number(alvo.closest("[data-indice]").dataset.indice);
		const teste = lerTeste().salvos[indice];
		if (!teste) return;
		if (await TesteEstendidoApp.#confirmarTroca(`Usar o teste guardado ${foundry.utils.escapeHTML(teste.titulo)}?`)) await substituirTeste(teste);
		this.render();
	}

	static async #excluir(event, alvo) {
		const indice = Number(alvo.closest("[data-indice]").dataset.indice);
		const teste = lerTeste().salvos[indice];
		if (!teste) return;
		const ok = await DialogV2.confirm({
			window: { title: "Excluir teste guardado" },
			content: `<p>Excluir <strong>${foundry.utils.escapeHTML(teste.titulo)}</strong> da lista de testes guardados?</p>`
		});
		if (ok) await excluirGuardado(indice);
	}

	/* Deixa a CD em branco: o teste passa a usar a CD do plano atual (18 + nível). */
	static async #cdDoPlano() {
		await salvarCamposDoTeste({ cd: "" });
		this.render();
	}
}

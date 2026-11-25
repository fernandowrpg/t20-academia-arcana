import { MODULO } from "../config.mjs";
import { planoAtual } from "../planos.mjs";
import {
	CAMPOS_TESTE,
	alternarVisibilidade,
	anunciarTeste,
	contextoDoTeste,
	definirCdOculta,
	excluirGuardado,
	guardarTeste,
	importarTestes,
	lerTeste,
	progressoAtual,
	salvarCamposDoTeste,
	substituirTeste,
	testeDeExemplo,
	testeEmBranco,
	zerarTeste
} from "../teste-estendido.mjs";
import { exportarNota, lerDoVault, macroDoTeste, nomeDeArquivo } from "../vault.mjs";

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
			cdDoPlano: TesteEstendidoApp.#cdDoPlano,
			importar: TesteEstendidoApp.#importar,
			exportar: TesteEstendidoApp.#exportar,
			copiarMacro: TesteEstendidoApp.#copiarMacro
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
		this.element.querySelector("[name='tipo']")?.addEventListener("change", () => this.render());
		this.element.querySelector("[name='cdOculta']")?.addEventListener("change", (ev) => definirCdOculta(ev.target.checked));
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

	/* Notas do Vault (.md) ou texto colado: lê os blocos da macro ou o formato do template. */
	static async #importar() {
		const textos = await DialogV2.prompt({
			window: { title: "Importar do Vault", icon: "fa-solid fa-file-import" },
			position: { width: 520 },
			content: `<p>Escolha notas do Vault (<code>.md</code>) ou cole o texto de uma nota ou da macro. O módulo lê o bloco da macro do Foundry ou, sem ele, a nota no formato do template <em>T20 - Teste Estendido</em>.</p>
				<div class="form-group"><label>Notas</label><input type="file" name="arquivos" accept=".md,.json,.txt" multiple></div>
				<div class="form-group stacked"><label>Ou cole aqui</label><textarea name="texto" rows="8"></textarea></div>`,
			ok: {
				label: "Importar",
				callback: async (event, botao) => {
					const form = botao.form;
					const lidos = await Promise.all([...(form.elements.arquivos.files ?? [])].map(async (f) => ({ texto: await f.text(), origem: f.name })));
					if (form.elements.texto.value.trim()) lidos.push({ texto: form.elements.texto.value, origem: "" });
					return lidos;
				}
			},
			rejectClose: false
		});
		if (!textos?.length) return;
		const itens = [];
		for (const { texto, origem } of textos) {
			const r = lerDoVault(texto, origem);
			itens.push(...r.testes);
			for (const e of r.erros) ui.notifications.error(`Não consegui ler o teste de ${e}`);
		}
		if (!itens.length) return ui.notifications.warn("Nenhum teste encontrado. A nota precisa da macro do Foundry ou do formato do template T20 - Teste Estendido.");
		const importados = await importarTestes(itens);
		ui.notifications.info(`${importados.length} teste(s) importado(s) e guardado(s). Na tela: ${importados.at(-1).titulo || "sem título"}.`);
		this.render();
	}

	static async #exportar() {
		const dados = lerTeste();
		const comProgresso = await DialogV2.confirm({
			window: { title: "Exportar para o Vault" },
			content: "<p>Incluir o progresso atual na macro da nota exportada?</p>",
			yes: { label: "Com progresso" },
			no: { label: "Só o teste" },
			rejectClose: false
		});
		if (comProgresso === null) return;
		foundry.utils.saveDataToFile(exportarNota(dados.atual, comProgresso ? progressoAtual(dados) : null), "text/markdown", nomeDeArquivo(dados.atual));
	}

	static async #copiarMacro() {
		await game.clipboard.copyPlainText(macroDoTeste(lerTeste().atual));
		ui.notifications.info("Macro do teste copiada.");
	}

	/* Deixa a CD em branco: o teste passa a usar a CD do plano atual (18 + nível). */
	static async #cdDoPlano() {
		await salvarCamposDoTeste({ cd: "" });
		this.render();
	}
}

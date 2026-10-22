import { MODULO, corpoDocente, lerAluno, opcao, salvarAluno } from "../config.mjs";
import {
	alterarParticipantes,
	alternarRevelacao,
	conversas,
	correioDisponivel,
	criarGrupo,
	editarMensagem,
	enviar,
	informaLeitura,
	itensEnviaveis,
	leituraDaMensagem,
	marcarLida,
	naoLidas,
	naoLidasPorRemetente,
	noCorreio,
	paraTexto,
	quantidadeDoItem,
	receberItem,
	remetentesDoUsuario
} from "../correio.mjs";

const { ApplicationV2, HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;

function dataHora(instante) {
	return new Date(instante).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function escapar(texto) {
	return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function marcaDeLeitura({ leram, pendentes, ocultos }) {
	const partes = [];
	if (leram.length) partes.push(`Lida por ${leram.join(", ")}`);
	if (pendentes.length) partes.push(`Ainda não leu: ${pendentes.join(", ")}`);
	if (ocultos.length) partes.push(`Não informa leitura: ${ocultos.join(", ")}`);
	const estado = leram.length && !pendentes.length ? "lida" : leram.length ? "parcial" : pendentes.length ? "enviada" : "oculta";
	const rotulos = { lida: "lida", parcial: `lida por ${leram.length}`, enviada: "não lida", oculta: "leitura não informada" };
	return { estado, rotulo: rotulos[estado], dica: partes.join(". "), icone: estado === "lida" || estado === "parcial" ? "fa-check-double" : estado === "enviada" ? "fa-check" : "fa-eye-slash" };
}

function previa(mensagem) {
	if (!mensagem) return "";
	return paraTexto(mensagem.html).replace(/\s+/g, " ") || `Enviou ${mensagem.item?.nome ?? "um item"}`;
}

export class CorreioApp extends HandlebarsApplicationMixin(ApplicationV2) {
	static instancia = null;

	static abrir({ de, para } = {}) {
		if (!game.user.isGM && !opcao("correioJogadores")) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.CorreioRestrito"));
			return null;
		}
		if (!remetentesDoUsuario().length) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.CorreioSemAluno"));
			return null;
		}
		this.instancia ??= new this();
		if (de) this.instancia.remetente = de;
		if (para) this.instancia.aberta = para;
		this.instancia.render({ force: true });
		return this.instancia;
	}

	static atualizar() {
		if (this.instancia?.rendered) this.instancia.render();
	}

	static DEFAULT_OPTIONS = {
		id: "academia-arcana-correio",
		classes: ["academia-arcana", "aa-correio-app"],
		window: { title: "ACADEMIA.Correio", icon: "fa-solid fa-envelope-open-text", resizable: true },
		position: { width: 780, height: 600 },
		actions: {
			abrirConversa: CorreioApp.#abrirConversa,
			novoGrupo: CorreioApp.#novoGrupo,
			enviar: CorreioApp.#enviar,
			receber: CorreioApp.#receber,
			abrirNota: CorreioApp.#abrirNota,
			participantes: CorreioApp.#participantes,
			editar: CorreioApp.#editar,
			revelar: CorreioApp.#revelar,
			alternarIdentidades: CorreioApp.#alternarIdentidades,
			escolherRemetente: CorreioApp.#escolherRemetente
		}
	};

	static PARTS = {
		corpo: { template: `modules/${MODULO}/templates/correio.hbs`, scrollable: [".aa-correio-contatos", ".aa-correio-mensagens"] }
	};

	remetente = null;

	/* Id da nota de um grupo ou do ator com quem se conversa a dois. */
	aberta = null;

	rascunho = "";

	/* A lista de "escrever como" aberta no lugar dos contatos. */
	escolhendo = false;

	irParaOFim = true;

	/* Até onde o usuário já tinha lido quando abriu cada conversa; serve para destacar as mensagens novas. */
	vistos = {};

	async _onClose(options) {
		await super._onClose(options);
		CorreioApp.instancia = null;
	}

	/* A conversa aberta, se a nota dela já existir. */
	#conversaAberta(todas = conversas()) {
		if (!this.aberta) return null;
		return (
			todas.find((c) => c.grupo && c.id === this.aberta) ??
			todas.find((c) => !c.grupo && c.participantes.includes(this.remetente) && c.participantes.includes(this.aberta)) ??
			null
		);
	}

	async _prepareContext() {
		const gm = game.user.isGM;
		const remetentes = remetentesDoUsuario();
		const porRemetente = naoLidasPorRemetente();
		if (!remetentes.some((a) => a.id === this.remetente)) {
			const comNovas = [...remetentes].sort((a, b) => (porRemetente[b.id] ?? 0) - (porRemetente[a.id] ?? 0)).find((a) => porRemetente[a.id]);
			this.remetente = (remetentes.find((a) => a.id === game.user.character?.id) ?? comNovas ?? remetentes[0])?.id ?? null;
		}
		const eu = game.actors.get(this.remetente);
		const todas = conversas().filter((c) => c.participantes.includes(this.remetente));
		const pendentes = naoLidas();
		const nomes = (ids) => ids.map((id) => game.actors.get(id)?.name ?? "?");
		/* Fichas de professor: id -> disciplinas que lecionam. */
		const docentes = new Map();
		for (const p of corpoDocente()) {
			if (!p.actor) continue;
			docentes.set(p.actor.id, [...new Set([...(docentes.get(p.actor.id) ?? []), ...p.disciplinas])]);
		}
		this.docentes = docentes;

		/* Quem o usuário pode ser no correio, com as mensagens novas de cada um. */
		const donoDe = (a) => game.users.find((u) => !u.isGM && a.testUserPermission(u, "OWNER"))?.name ?? null;
		const identidades = remetentes.map((a) => {
			const leciona = (docentes.get(a.id) ?? []).join(", ");
			const jogador = gm && a.hasPlayerOwner ? donoDe(a) : null;
			return {
				id: a.id,
				nome: a.name,
				img: a.img,
				professor: docentes.has(a.id),
				detalhe: leciona ? `Professor · ${leciona}` : jogador ? `Personagem de ${jogador}` : gm && a.hasPlayerOwner ? "Personagem de jogador" : gm ? "NPC" : "",
				novas: porRemetente[a.id] ?? 0,
				selecionado: a.id === this.remetente,
				tipo: docentes.has(a.id) ? "professor" : gm && a.hasPlayerOwner ? "jogador" : "npc"
			};
		});
		const secoes = [
			{ rotulo: "Com mensagens novas", itens: identidades.filter((i) => i.novas).sort((a, b) => b.novas - a.novas) },
			{ rotulo: "Professores", itens: identidades.filter((i) => !i.novas && i.tipo === "professor") },
			{ rotulo: gm ? "NPCs" : "Seus personagens", itens: identidades.filter((i) => !i.novas && i.tipo === "npc") },
			{ rotulo: "Personagens dos jogadores", itens: identidades.filter((i) => !i.novas && i.tipo === "jogador") }
		].filter((s) => s.itens.length);
		const outrasNovas = identidades.filter((i) => i.novas && !i.selecionado);
		if (remetentes.length < 2) this.escolhendo = false;

		const grupos = todas
			.filter((c) => c.grupo)
			.map((c) => ({ id: c.id, grupo: true, nome: c.nome, quando: c.mensagens.at(-1)?.quando ?? 0, previa: previa(c.mensagens.at(-1)) || nomes(c.participantes).join(", "), novas: pendentes[c.id] ?? 0 }));
		const pessoas = game.actors
			.filter((a) => noCorreio(a) && a.id !== this.remetente)
			.map((a) => {
				const conversa = todas.find((c) => !c.grupo && c.participantes.includes(a.id));
				const ultima = conversa?.mensagens.at(-1) ?? null;
				return { id: a.id, nome: a.name, img: a.img, professor: docentes.has(a.id), leciona: (docentes.get(a.id) ?? []).join(", "), quando: ultima?.quando ?? 0, previa: previa(ultima), novas: conversa ? (pendentes[conversa.id] ?? 0) : 0 };
			});
		const lista = [...grupos, ...pessoas].sort((a, b) => b.quando - a.quando || Number(!!b.grupo) - Number(!!a.grupo) || a.nome.localeCompare(b.nome, "pt-BR"));
		if (!lista.some((c) => c.id === this.aberta)) this.aberta = null;
		for (const c of lista) c.ativa = c.id === this.aberta;

		const atual = this.#conversaAberta(todas);
		const grupo = atual?.grupo ? atual : null;
		const outro = grupo ? null : game.actors.get(this.aberta);
		if (atual) this.vistos[atual.id] ??= Number((opcao("correioLido") ?? {})[atual.id]) || 0;
		const mensagens = (atual?.mensagens ?? []).map((m) => {
			const verHistorico = (gm || m.revelada) && m.edicoes.length > 0;
			const dono = game.actors.get(m.item?.para);
			return {
				id: m.id,
				sistema: !!m.sistema,
				minha: m.de === this.remetente,
				professor: docentes.has(m.de),
				nova: m.de !== this.remetente && m.quando > this.vistos[atual.id],
				leitura: !m.sistema && (m.de === this.remetente || gm) ? marcaDeLeitura(leituraDaMensagem(atual, m)) : null,
				autor: game.actors.get(m.de)?.name ?? "?",
				html: m.html,
				quando: dataHora(m.quando),
				item: m.item && {
					nome: m.item.nome,
					img: m.item.img,
					qtd: m.item.qtd,
					recebido: m.item.recebido,
					para: dono?.name ?? null,
					podeReceber: !m.item.recebido && !!m.item.dados && !!dono && (gm || dono.isOwner)
				},
				editada: verHistorico,
				revelada: m.revelada,
				edicoes: verHistorico ? m.edicoes.map((e) => ({ html: e.texto, quando: dataHora(e.quando), por: e.por })) : []
			};
		});
		if (atual) marcarLida(atual, this.remetente);

		const itens = eu && (gm || eu.isOwner) ? itensEnviaveis(eu).map((i) => ({ id: i.id, qtd: quantidadeDoItem(i), rotulo: quantidadeDoItem(i) > 1 ? `${i.name} (×${quantidadeDoItem(i)})` : i.name })) : [];
		return {
			gm,
			variosRemetentes: remetentes.length > 1,
			escolhendo: this.escolhendo,
			secoes,
			buscavel: remetentes.length > 6,
			outrasNovas,
			totalOutrasNovas: outrasNovas.reduce((soma, i) => soma + i.novas, 0),
			eu: eu
				? { id: eu.id, nome: eu.name, img: eu.img, detalhe: identidades.find((i) => i.selecionado)?.detalhe ?? "", informa: informaLeitura(eu), podeConfigurar: gm || eu.isOwner }
				: null,
			conversas: lista,
			aberta: grupo
				? { nome: grupo.nome, grupo: true, membros: nomes(grupo.participantes).join(", ") }
				: outro
					? { nome: outro.name, img: outro.img, professor: docentes.has(outro.id), membros: docentes.has(outro.id) ? `Professor · ${docentes.get(outro.id).join(", ")}` : "" }
					: null,
			temNota: !!atual,
			podeGerir: !!grupo && (gm || (grupo.criador === this.remetente && !!eu?.isOwner)),
			destinatarios: grupo ? grupo.participantes.filter((id) => id !== this.remetente).map((id) => ({ id, nome: game.actors.get(id)?.name ?? "?" })) : [],
			mensagens,
			itens,
			rascunho: this.rascunho,
			disponivel: correioDisponivel()
		};
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		const raiz = this.element;
		const busca = raiz.querySelector("input[name='aa-correio-busca']");
		busca?.addEventListener("input", () => {
			const termo = busca.value.trim().toLocaleLowerCase("pt-BR");
			for (const secao of raiz.querySelectorAll(".aa-correio-identidades section")) {
				let visiveis = 0;
				for (const li of secao.querySelectorAll("li[data-remetente]")) {
					li.hidden = !!termo && !li.textContent.toLocaleLowerCase("pt-BR").includes(termo);
					if (!li.hidden) visiveis++;
				}
				secao.hidden = !visiveis;
			}
		});
		busca?.addEventListener("keydown", (ev) => {
			if (ev.key === "Escape") {
				ev.preventDefault();
				ev.stopPropagation();
				this.escolhendo = false;
				this.render();
			} else if (ev.key === "Enter") {
				ev.preventDefault();
				raiz.querySelector(".aa-correio-identidades li[data-remetente]:not([hidden])")?.click();
			}
		});
		for (const li of raiz.querySelectorAll(".aa-correio-identidades li[data-remetente]")) {
			li.addEventListener("keydown", (ev) => {
				if (ev.key !== "Enter" && ev.key !== " ") return;
				ev.preventDefault();
				li.click();
			});
		}
		if (this.escolhendo) (busca ?? raiz.querySelector(".aa-correio-identidades li[data-remetente]"))?.focus();
		raiz.querySelector("input[name='aa-correio-informa']")?.addEventListener("change", async (ev) => {
			const actor = game.actors.get(this.remetente);
			const aluno = lerAluno(actor);
			if (!aluno || !(game.user.isGM || actor.isOwner)) return;
			aluno.confirmaLeitura = ev.target.checked;
			await salvarAluno(actor, aluno);
			this.render();
		});
		const texto = raiz.querySelector("textarea[name='aa-correio-texto']");
		texto?.addEventListener("input", () => (this.rascunho = texto.value));
		texto?.addEventListener("keydown", (ev) => {
			if (ev.key !== "Enter" || ev.shiftKey) return;
			ev.preventDefault();
			raiz.querySelector("[data-action='enviar']")?.click();
		});
		const item = raiz.querySelector("select[name='aa-correio-item']");
		const qtd = raiz.querySelector("input[name='aa-correio-qtd']");
		const para = raiz.querySelector("select[name='aa-correio-para']");
		const ajustar = () => {
			const max = Number(item?.selectedOptions[0]?.dataset.qtd) || 1;
			if (qtd) {
				qtd.max = max;
				qtd.value = Math.min(Number(qtd.value) || 1, max);
				qtd.hidden = !item?.value || max < 2;
			}
			if (para) para.hidden = !item?.value;
		};
		item?.addEventListener("change", ajustar);
		ajustar();
		/* Arrastar um item da ficha do remetente para a mensagem escolhe o anexo. */
		raiz.querySelector(".aa-correio-escrever")?.addEventListener("drop", (ev) => {
			let dados;
			try {
				dados = JSON.parse(ev.dataTransfer.getData("text/plain"));
			} catch {
				return;
			}
			const id = dados?.type === "Item" && String(dados.uuid ?? "").startsWith(`Actor.${this.remetente}.Item.`) ? dados.uuid.split(".").at(-1) : null;
			if (!id || !item || ![...item.options].some((o) => o.value === id)) return;
			ev.preventDefault();
			item.value = id;
			ajustar();
		});
		const lista = raiz.querySelector(".aa-correio-mensagens");
		if (lista && this.irParaOFim) lista.scrollTop = lista.scrollHeight;
		this.irParaOFim = true;
	}

	static #alternarIdentidades() {
		this.escolhendo = !this.escolhendo;
		this.render();
	}

	static #escolherRemetente(event, alvo) {
		const id = alvo.dataset.remetente;
		this.escolhendo = false;
		if (id && id !== this.remetente) {
			this.remetente = id;
			this.aberta = null;
			this.vistos = {};
			this.rascunho = "";
			/* Já abre a conversa mais recente com mensagens novas para essa identidade. */
			const pendentes = naoLidas();
			const nova = conversas()
				.filter((c) => c.participantes.includes(id) && pendentes[c.id] && c.mensagens.some((m) => m.de !== id))
				.sort((a, b) => (b.mensagens.at(-1)?.quando ?? 0) - (a.mensagens.at(-1)?.quando ?? 0))[0];
			if (nova) this.aberta = nova.grupo ? nova.id : nova.participantes.find((p) => p !== id);
		}
		this.render();
	}

	static #abrirConversa(event, alvo) {
		this.aberta = alvo.dataset.conversa;
		this.vistos = {};
		this.rascunho = "";
		this.render();
	}

	static async #novoGrupo() {
		const colegas = game.actors.filter((a) => noCorreio(a) && a.id !== this.remetente).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
		const opcoes = colegas.map((a) => `<label style="display:flex;gap:.4rem;align-items:center"><input type="checkbox" name="membro" value="${a.id}"> ${escapar(a.name)}${this.docentes?.has(a.id) ? " <em>(professor)</em>" : ""}</label>`).join("");
		const dados = await DialogV2.prompt({
			window: { title: "Novo grupo" },
			content: `<label>Nome do grupo<input type="text" name="nome" maxlength="60" placeholder="Grupo de estudos" style="width:100%"></label><p>Escolha ao menos dois colegas:</p><div style="max-height:260px;overflow:auto;display:grid;gap:.2rem">${opcoes}</div>`,
			ok: {
				label: "Criar grupo",
				callback: (ev, botao) => ({ nome: botao.form.elements.nome.value, participantes: [...botao.form.querySelectorAll("input[name='membro']:checked")].map((el) => el.value) })
			},
			rejectClose: false
		});
		if (!dados) return;
		if (dados.participantes.length < 2) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.GrupoPequeno"));
			return;
		}
		const nota = await criarGrupo({ de: this.remetente, nome: dados.nome, participantes: dados.participantes });
		if (nota) this.aberta = nota.id;
		this.render();
	}

	static async #enviar() {
		if (!this.remetente || !this.aberta) return;
		const campo = (seletor) => this.element.querySelector(seletor)?.value ?? "";
		const texto = campo("textarea[name='aa-correio-texto']");
		const idDoItem = campo("select[name='aa-correio-item']") || null;
		if (!texto.trim() && !idDoItem) return;
		const atual = this.#conversaAberta();
		const item = idDoItem ? { id: idDoItem, qtd: Number(campo("input[name='aa-correio-qtd']")) || 1, para: campo("select[name='aa-correio-para']") || null } : null;
		this.rascunho = "";
		const pagina = await enviar({ de: this.remetente, para: atual ? null : this.aberta, conversa: atual?.id ?? null, texto, item });
		if (!pagina) this.rascunho = texto;
		this.render();
	}

	static async #receber(event, alvo) {
		const atual = this.#conversaAberta();
		if (!atual) return;
		this.irParaOFim = false;
		await receberItem(atual.id, alvo.closest("[data-mensagem]")?.dataset.mensagem);
	}

	static async #participantes() {
		const atual = this.#conversaAberta();
		if (!atual?.grupo) return;
		const colegas = game.actors.filter((a) => noCorreio(a) && a.id !== atual.criador).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
		const opcoes = colegas
			.map((a) => `<label style="display:flex;gap:.4rem;align-items:center"><input type="checkbox" name="membro" value="${a.id}" ${atual.participantes.includes(a.id) ? "checked" : ""}> ${escapar(a.name)}${this.docentes?.has(a.id) ? " <em>(professor)</em>" : ""}</label>`)
			.join("");
		const escolhidos = await DialogV2.prompt({
			window: { title: `Participantes: ${atual.nome}` },
			content: `<p>Marque quem faz parte do grupo. ${escapar(game.actors.get(atual.criador)?.name ?? "Quem criou")} criou o grupo e sempre participa. Quem sair deixa de ver a conversa.</p><div style="max-height:300px;overflow:auto;display:grid;gap:.2rem">${opcoes}</div>`,
			ok: { label: "Salvar", callback: (ev, botao) => [...botao.form.querySelectorAll("input[name='membro']:checked")].map((el) => el.value) },
			rejectClose: false
		});
		if (!Array.isArray(escolhidos)) return;
		if (!escolhidos.length) {
			ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.GrupoVazio"));
			return;
		}
		await alterarParticipantes(atual.id, escolhidos, this.remetente);
	}

	static #abrirNota() {
		this.#conversaAberta()?.nota.sheet.render(true);
	}

	static async #editar(event, alvo) {
		if (!game.user.isGM) return;
		const atual = this.#conversaAberta();
		const id = alvo.closest("[data-mensagem]")?.dataset.mensagem;
		const mensagem = atual?.mensagens.find((m) => m.id === id);
		if (!mensagem) return;
		const texto = await DialogV2.prompt({
			window: { title: "Editar mensagem" },
			content: `<p>O texto anterior fica guardado no histórico da mensagem.</p><textarea name="texto" rows="6" style="width:100%">${escapar(paraTexto(mensagem.html))}</textarea>`,
			ok: { label: "Salvar", callback: (ev, botao) => botao.form.elements.texto.value },
			rejectClose: false
		});
		if (typeof texto !== "string") return;
		this.irParaOFim = false;
		await editarMensagem(atual.id, id, texto);
	}

	static async #revelar(event, alvo) {
		if (!game.user.isGM) return;
		const atual = this.#conversaAberta();
		if (!atual) return;
		this.irParaOFim = false;
		await alternarRevelacao(atual.id, alvo.closest("[data-mensagem]")?.dataset.mensagem);
	}
}

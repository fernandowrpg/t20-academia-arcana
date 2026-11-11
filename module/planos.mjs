import { MODULO, opcao } from "./config.mjs";
import { ATOS, PLANOS, PLANOS_POR_ID, cdDoPlano } from "./data/planos.mjs";

/*
 * Estado da expedição, gravado na configuração de mundo "expedicao":
 * { atual: id do plano em que a turma está ("" = na Academia),
 *   planos: { [id]: { regraTitulo?, regras?, anotacoes?, segredo? } } }
 * regraTitulo e regras ausentes usam o texto padrão de data/planos.mjs.
 */

export function lerExpedicao() {
	const salvo = foundry.utils.deepClone(opcao("expedicao") ?? {});
	return { atual: PLANOS_POR_ID.has(salvo.atual) ? salvo.atual : "", planos: salvo.planos ?? {} };
}

async function gravar(expedicao) {
	return game.settings.set(MODULO, "expedicao", expedicao);
}

export function planoAtual() {
	const { atual } = lerExpedicao();
	return atual ? dadosDoPlano(atual) : null;
}

/* O plano com o texto do mestre por cima do padrão. */
export function dadosDoPlano(id, expedicao = lerExpedicao()) {
	const base = PLANOS_POR_ID.get(id);
	if (!base) return null;
	const editado = expedicao.planos[id] ?? {};
	return {
		...base,
		rotuloAto: ATOS[base.ato],
		cd: cdDoPlano(base),
		regraTitulo: editado.regraTitulo ?? base.regraTitulo,
		regras: editado.regras ?? base.regras.join("\n"),
		anotacoes: editado.anotacoes ?? "",
		segredo: editado.segredo ?? "",
		editado: editado.regraTitulo !== undefined || editado.regras !== undefined
	};
}

export async function definirPlanoAtual(id) {
	const expedicao = lerExpedicao();
	expedicao.atual = PLANOS_POR_ID.has(id) ? id : "";
	return gravar(expedicao);
}

/* Anda na ordem do roteiro: +1 vai ao próximo plano, -1 volta. Da Academia, +1 vai a Magika. */
export async function avancarPlano(passo) {
	const { atual } = lerExpedicao();
	const indice = atual ? PLANOS.findIndex((p) => p.id === atual) : -1;
	const destino = Math.max(-1, Math.min(PLANOS.length - 1, indice + passo));
	return definirPlanoAtual(destino < 0 ? "" : PLANOS[destino].id);
}

export async function salvarTextosDoPlano(id, campos) {
	if (!PLANOS_POR_ID.has(id)) return;
	const expedicao = lerExpedicao();
	const base = PLANOS_POR_ID.get(id);
	const atual = { ...(expedicao.planos[id] ?? {}) };
	for (const [chave, valor] of Object.entries(campos)) atual[chave] = String(valor ?? "");
	/* Igual ao padrão: não guarda, para o texto padrão continuar valendo se mudar numa versão nova. */
	if (atual.regraTitulo !== undefined && atual.regraTitulo.trim() === base.regraTitulo) delete atual.regraTitulo;
	if (atual.regras !== undefined && atual.regras.trim() === base.regras.join("\n")) delete atual.regras;
	for (const chave of ["anotacoes", "segredo"]) if (atual[chave] !== undefined && !atual[chave].trim()) delete atual[chave];
	expedicao.planos[id] = atual;
	if (!Object.keys(atual).length) delete expedicao.planos[id];
	return gravar(expedicao);
}

export async function restaurarRegrasDoPlano(id) {
	const expedicao = lerExpedicao();
	const atual = expedicao.planos[id];
	if (!atual) return;
	delete atual.regraTitulo;
	delete atual.regras;
	if (!Object.keys(atual).length) delete expedicao.planos[id];
	return gravar(expedicao);
}

function escapar(texto) {
	return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function emLinha(texto) {
	return escapar(texto)
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

/* Uma regra por linha, cada uma vira um item; o marcador "-" ou "•" no começo é opcional. */
export function textoEmItens(texto) {
	return String(texto ?? "")
		.split(/\r?\n/)
		.map((l) => l.trim().replace(/^[-•*]\s+/, ""))
		.filter(Boolean)
		.map(emLinha);
}

/* Anotações livres: parágrafos separados por linha em branco, quebras de linha mantidas. */
export function textoEmParagrafos(texto) {
	return String(texto ?? "")
		.split(/\r?\n\s*\r?\n/)
		.map((p) => p.trim())
		.filter(Boolean)
		.map((p) => p.split(/\r?\n/).map(emLinha).join("<br>"));
}

/* Cartão de chegada no chat, com as cores do plano. */
export async function anunciarPlano(id) {
	const plano = dadosDoPlano(id);
	if (!plano) return;
	const regras = textoEmItens(plano.regras).map((r) => `<li>${r}</li>`).join("");
	const anotacoes = textoEmParagrafos(plano.anotacoes).map((p) => `<p>${p}</p>`).join("");
	const content = `<div class="aa-plano-chat" data-aa-plano="${plano.id}">
	<header><i class="${plano.icone}"></i><div><strong>${escapar(plano.nome)}</strong><small>Mundo de ${escapar(plano.deus)} · ${escapar(plano.rotuloAto)}</small></div></header>
	<h4>Regra planar: ${escapar(plano.regraTitulo)}</h4>
	<ul>${regras}</ul>${anotacoes}
</div>`;
	await ChatMessage.create({ content, speaker: { alias: "Expedição aos Mundos dos Deuses" } });
}

let ultimoPlano = null;

/*
 * Tema do plano: o body ganha data-aa-plano (as cores de styles/planos.css passam a valer)
 * e uma classe conforme a escolha do usuário: aa-plano-paineis tinge os outros painéis do módulo;
 * aa-plano-moldura também desenha a moldura do plano nas bordas da tela.
 * Jogadores só recebem o tema quando o mestre libera o painel do plano.
 */
export function aplicarTemaDoPlano() {
	const corpo = document.body;
	const { atual } = lerExpedicao();
	const visivel = !!atual && (game.user?.isGM || opcao("planoJogadores"));
	const modo = opcao("temaPlano");
	if (visivel) corpo.dataset.aaPlano = atual;
	else delete corpo.dataset.aaPlano;
	corpo.classList.toggle("aa-plano-paineis", visivel && (modo === "paineis" || modo === "moldura"));
	corpo.classList.toggle("aa-plano-moldura", visivel && modo === "moldura");

	/* Aviso de chegada quando o mestre troca de plano (não na carga do mundo). */
	if (ultimoPlano !== null && atual !== ultimoPlano && visivel) {
		ui.notifications.info(game.i18n.format("ACADEMIA.Aviso.ChegadaPlano", { nome: PLANOS_POR_ID.get(atual).nome }));
	}
	ultimoPlano = atual;
}

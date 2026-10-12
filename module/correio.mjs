import { MODULO, ehAluno, opcao } from "./config.mjs";

const EVENTO = `module.${MODULO}`;
const TIPOS_FISICOS = new Set(["arma", "equipamento", "consumivel", "tesouro"]);
const LIMITE_TEXTO = 2000;
const LIMITE_NOME = 60;

export function idConversa(a, b) {
	return [a, b].sort().join("|");
}

export function lerCorreio() {
	const dados = foundry.utils.deepClone(opcao("correio") ?? {});
	dados.conversas ??= {};
	return dados;
}

/* Alunos pelos quais o usuário pode escrever: os seus personagens; para o mestre, todos (inclusive NPCs). */
export function remetentesDoUsuario(user = game.user) {
	return game.actors
		.filter((a) => ehAluno(a) && (user.isGM || a.testUserPermission(user, "OWNER")))
		.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function itensEnviaveis(actor) {
	return (actor?.items ?? [])
		.filter((i) => TIPOS_FISICOS.has(i.type) || i.system?.qtd !== undefined)
		.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function quantidadeDoItem(item) {
	return Math.max(1, Number(item?.system?.qtd) || 1);
}

/* Mensagens que o usuário ainda não viu: as recebidas pelos seus alunos (para o mestre, pelos NPCs). */
export function naoLidas(user = game.user, correio = lerCorreio(), lido = opcao("correioLido") ?? {}) {
	const meus = new Set(remetentesDoUsuario(user).filter((a) => !user.isGM || !a.hasPlayerOwner).map((a) => a.id));
	const porConversa = {};
	for (const conversa of Object.values(correio.conversas)) {
		const visto = Number(lido[conversa.id]) || 0;
		const novas = conversa.mensagens.filter((m) => m.quando > visto && !meus.has(m.de) && conversa.participantes.some((p) => p !== m.de && meus.has(p))).length;
		if (novas) porConversa[conversa.id] = novas;
	}
	return porConversa;
}

export function totalNaoLidas(user = game.user) {
	return Object.values(naoLidas(user)).reduce((soma, n) => soma + n, 0);
}

export async function marcarLida(idDaConversa) {
	const lido = foundry.utils.deepClone(opcao("correioLido") ?? {});
	const ultima = lerCorreio().conversas[idDaConversa]?.mensagens.at(-1)?.quando ?? 0;
	if ((Number(lido[idDaConversa]) || 0) >= ultima) return;
	lido[idDaConversa] = ultima;
	await game.settings.set(MODULO, "correioLido", lido);
}

async function transferirItem(de, para, idDoItem, quantidade) {
	const item = de.items.get(idDoItem);
	if (!item || !itensEnviaveis(de).some((i) => i.id === item.id)) return null;
	const total = quantidadeDoItem(item);
	const qtd = Math.max(1, Math.min(total, Math.round(Number(quantidade)) || 1));
	const dados = item.toObject();
	delete dados._id;
	if (dados.system && "qtd" in dados.system) dados.system.qtd = qtd;
	if (dados.system && "equipado" in dados.system) dados.system.equipado = typeof dados.system.equipado === "number" ? 0 : false;
	await para.createEmbeddedDocuments("Item", [dados]);
	if (qtd >= total) await item.delete();
	else await item.update({ "system.qtd": total - qtd });
	return { nome: item.name, img: item.img, qtd, para: para.name };
}

function abrirGrupo(correio, pedido, de) {
	const participantes = [...new Set([de.id, ...(Array.isArray(pedido.participantes) ? pedido.participantes : [])])].filter((id) => ehAluno(game.actors.get(id)));
	if (participantes.length < 3) return false;
	const id = `g-${foundry.utils.randomID()}`;
	const nome = String(pedido.nome ?? "").trim().slice(0, LIMITE_NOME) || "Grupo de estudos";
	correio.conversas[id] = { id, grupo: true, nome, criador: de.id, participantes: participantes.sort(), mensagens: [] };
	return true;
}

/* Só o cliente do mestre grava: confere o remetente, entrega o item e registra a mensagem. */
async function processar(pedido) {
	const usuario = game.users.get(pedido?.usuario);
	const de = game.actors.get(pedido?.de);
	if (!usuario || !de || !ehAluno(de)) return;
	if (!(usuario.isGM || de.testUserPermission(usuario, "OWNER"))) return;
	if (!usuario.isGM && !opcao("correioJogadores")) return;
	const correio = lerCorreio();

	if (pedido.acao === "criarGrupo") {
		if (abrirGrupo(correio, pedido, de)) await game.settings.set(MODULO, "correio", correio);
		return;
	}
	if (pedido.acao !== "enviar") return;

	let conversa;
	let destinatario;
	if (pedido.conversa) {
		conversa = correio.conversas[pedido.conversa];
		if (!conversa?.grupo || !conversa.participantes.includes(de.id)) return;
		destinatario = game.actors.get(pedido.item?.para);
		if (destinatario && !conversa.participantes.includes(destinatario.id)) destinatario = null;
	} else {
		destinatario = game.actors.get(pedido.para);
		if (!destinatario || !ehAluno(destinatario)) return;
		const id = idConversa(de.id, destinatario.id);
		conversa = correio.conversas[id] ??= { id, participantes: [de.id, destinatario.id].sort(), mensagens: [] };
	}
	if (destinatario?.id === de.id) return;

	const texto = String(pedido.texto ?? "").trim().slice(0, LIMITE_TEXTO);
	const item = pedido.item?.id && destinatario ? await transferirItem(de, destinatario, pedido.item.id, pedido.item.qtd) : null;
	if (!texto && !item) return;
	conversa.mensagens.push({ id: foundry.utils.randomID(), de: de.id, usuario: usuario.id, texto, quando: Date.now(), item, edicoes: [], revelada: false });
	await game.settings.set(MODULO, "correio", correio);
}

export function registrarSocket() {
	game.socket.on(EVENTO, (pedido) => {
		if (game.users.activeGM?.isSelf) processar(pedido);
	});
}

export function correioDisponivel() {
	return game.user.isGM || (opcao("correioJogadores") && !!game.users.activeGM);
}

async function despachar(pedido) {
	pedido.usuario = game.user.id;
	if (game.user.isGM) return processar(pedido);
	if (!game.users.activeGM) {
		ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.CorreioSemMestre"));
		return;
	}
	game.socket.emit(EVENTO, pedido);
}

/* Conversa a dois: informe para. Grupo: informe conversa; o item, se houver, leva o destinatário em item.para. */
export function enviar({ de, para = null, conversa = null, texto, item = null }) {
	return despachar({ acao: "enviar", de, para, conversa, texto, item });
}

export function criarGrupo({ de, nome, participantes }) {
	return despachar({ acao: "criarGrupo", de, nome, participantes });
}

function localizar(correio, idDaConversa, idDaMensagem) {
	return correio.conversas[idDaConversa]?.mensagens.find((m) => m.id === idDaMensagem) ?? null;
}

/* A edição do mestre nunca apaga: o texto anterior vai para o histórico da mensagem. */
export async function editarMensagem(idDaConversa, idDaMensagem, texto) {
	if (!game.user.isGM) return;
	const correio = lerCorreio();
	const mensagem = localizar(correio, idDaConversa, idDaMensagem);
	const novo = String(texto ?? "").trim().slice(0, LIMITE_TEXTO);
	if (!mensagem || novo === mensagem.texto) return;
	mensagem.edicoes.push({ texto: mensagem.texto, quando: Date.now(), por: game.user.name });
	mensagem.texto = novo;
	await game.settings.set(MODULO, "correio", correio);
}

export async function alternarRevelacao(idDaConversa, idDaMensagem) {
	if (!game.user.isGM) return;
	const correio = lerCorreio();
	const mensagem = localizar(correio, idDaConversa, idDaMensagem);
	if (!mensagem) return;
	mensagem.revelada = !mensagem.revelada;
	await game.settings.set(MODULO, "correio", correio);
}

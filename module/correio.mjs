import { MODULO, ehAluno, ehProfessor, lerAluno, opcao } from "./config.mjs";

/* Cada conversa é uma nota (JournalEntry) cujos donos são os usuários dos alunos participantes.
   Cada mensagem é uma página da nota: o texto fica no conteúdo e os dados (autor, item, edições) nas flags. */

const EVENTO = `module.${MODULO}`;
const PASTA = "Correio da Academia";
const TIPOS_FISICOS = new Set(["arma", "equipamento", "consumivel", "tesouro"]);
const LIMITE_TEXTO = 2000;
const LIMITE_NOME = 60;
const DONO = 3;

function escapar(texto) {
	return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function paraHtml(texto) {
	const limpo = String(texto ?? "").trim().slice(0, LIMITE_TEXTO);
	return limpo ? `<p>${escapar(limpo).replace(/\n/g, "<br>")}</p>` : "";
}

export function paraTexto(html) {
	return String(html ?? "")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, "&")
		.trim();
}

/* Participam do correio os alunos e os professores com ficha vinculada. */
export function noCorreio(actor) {
	return ehAluno(actor) || ehProfessor(actor);
}

/* Fichas pelas quais o usuário pode escrever: as suas; para o mestre, todas (inclusive NPCs e professores). */
export function remetentesDoUsuario(user = game.user) {
	return game.actors
		.filter((a) => noCorreio(a) && (user.isGM || a.testUserPermission(user, "OWNER")))
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

/* ---------------------------------------------------------------- */
/* Leitura                                                           */
/* ---------------------------------------------------------------- */

export function ehConversa(nota) {
	return !!nota?.getFlag?.(MODULO, "conversa");
}

function mensagensDaNota(nota) {
	return nota.pages
		.filter((p) => p.getFlag(MODULO, "mensagem"))
		.map((p) => ({ edicoes: [], revelada: false, item: null, ...p.getFlag(MODULO, "mensagem"), id: p.id, html: p.text?.content ?? "" }))
		.sort((a, b) => a.quando - b.quando);
}

/* Conversas que o usuário pode ver, já com as mensagens em ordem. */
export function conversas(user = game.user) {
	return game.journal
		.filter((nota) => ehConversa(nota) && (user.isGM || nota.testUserPermission(user, "OBSERVER")))
		.map((nota) => ({ ...nota.getFlag(MODULO, "conversa"), id: nota.id, nota, mensagens: mensagensDaNota(nota) }));
}

export function conversaADois(a, b) {
	return conversas().find((c) => !c.grupo && c.participantes.length === 2 && c.participantes.includes(a) && c.participantes.includes(b)) ?? null;
}

/* Mensagens que o usuário ainda não viu: as recebidas pelos seus alunos (para o mestre, pelos NPCs). */
export function naoLidas(user = game.user, lido = opcao("correioLido") ?? {}) {
	const meus = new Set(remetentesDoUsuario(user).filter((a) => !user.isGM || !a.hasPlayerOwner).map((a) => a.id));
	const porConversa = {};
	for (const conversa of conversas(user)) {
		const visto = Number(lido[conversa.id]) || 0;
		const novas = conversa.mensagens.filter((m) => m.quando > visto && !meus.has(m.de) && conversa.participantes.some((p) => p !== m.de && meus.has(p))).length;
		if (novas) porConversa[conversa.id] = novas;
	}
	return porConversa;
}

export function totalNaoLidas(user = game.user) {
	return Object.values(naoLidas(user)).reduce((soma, n) => soma + n, 0);
}

/* O aluno decide, na janela do correio, se os colegas ficam sabendo que ele leu. */
export function informaLeitura(actor) {
	return lerAluno(actor)?.confirmaLeitura !== false;
}

/* Guarda no navegador o que o usuário já viu e, se o aluno permitir, registra a leitura na nota para os colegas.
   O mestre lendo como personagem de jogador não conta como leitura do personagem. */
export async function marcarLida(conversa, leitor) {
	const ultima = conversa?.mensagens.at(-1)?.quando ?? 0;
	if (!conversa || !ultima) return;
	const lido = foundry.utils.deepClone(opcao("correioLido") ?? {});
	if ((Number(lido[conversa.id]) || 0) < ultima) {
		lido[conversa.id] = ultima;
		await game.settings.set(MODULO, "correioLido", lido);
	}
	const actor = game.actors.get(leitor);
	if (!actor || !conversa.participantes.includes(leitor) || !actor.isOwner || (game.user.isGM && actor.hasPlayerOwner) || !informaLeitura(actor)) return;
	if ((Number(conversa.lido?.[leitor]) || 0) < ultima) await conversa.nota.update({ [`flags.${MODULO}.conversa.lido.${leitor}`]: ultima });
}

/* Quem já leu uma mensagem, entre os outros participantes. Quem desligou a confirmação fica em "ocultos". */
export function leituraDaMensagem(conversa, mensagem) {
	const leram = [];
	const pendentes = [];
	const ocultos = [];
	for (const id of conversa.participantes) {
		if (id === mensagem.de) continue;
		const actor = game.actors.get(id);
		const nome = actor?.name ?? "?";
		if (!informaLeitura(actor)) ocultos.push(nome);
		else if ((Number(conversa.lido?.[id]) || 0) >= mensagem.quando) leram.push(nome);
		else pendentes.push(nome);
	}
	return { leram, pendentes, ocultos };
}

/* ---------------------------------------------------------------- */
/* Notas e permissões                                                */
/* ---------------------------------------------------------------- */

/* Donos da nota: os usuários (não mestres) que controlam algum dos alunos participantes. */
function donosDaConversa(participantes) {
	const dono = { default: 0 };
	for (const usuario of game.users) {
		if (usuario.isGM) continue;
		if (participantes.some((id) => game.actors.get(id)?.testUserPermission(usuario, "OWNER"))) dono[usuario.id] = DONO;
	}
	return dono;
}

async function pastaDoCorreio() {
	const pasta = game.folders.find((f) => f.type === "JournalEntry" && f.name === PASTA);
	if (pasta || !game.user.isGM) return pasta ?? null;
	return Folder.create({ name: PASTA, type: "JournalEntry" });
}

function nomeDaNota({ grupo, nome, participantes }) {
	if (grupo) return nome;
	return participantes.map((id) => game.actors.get(id)?.name ?? "?").join(" e ");
}

async function criarNota({ grupo = false, nome = "", participantes, criador }) {
	const ids = [...new Set(participantes)].filter((id) => noCorreio(game.actors.get(id))).sort();
	if (ids.length < (grupo ? 3 : 2)) return null;
	const conversa = { grupo, nome: grupo ? String(nome ?? "").trim().slice(0, LIMITE_NOME) || "Grupo de estudos" : "", participantes: ids, criador };
	const pasta = await pastaDoCorreio();
	return JournalEntry.create({ name: nomeDaNota(conversa), folder: pasta?.id ?? null, ownership: donosDaConversa(ids), flags: { [MODULO]: { conversa } } });
}

function esperar(achar, limite = 5000) {
	return new Promise((resolver) => {
		const inicio = Date.now();
		const tentar = () => {
			const achado = achar();
			if (achado || Date.now() - inicio > limite) resolver(achado ?? null);
			else setTimeout(tentar, 150);
		};
		tentar();
	});
}

/* Jogadores sem permissão de criar notas pedem ao mestre conectado que crie a conversa. */
async function abrirConversa(dados) {
	if (game.user.isGM || game.user.can("JOURNAL_CREATE")) return criarNota(dados);
	if (!game.users.activeGM) {
		ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.CorreioSemMestre"));
		return null;
	}
	const pedido = foundry.utils.randomID();
	game.socket.emit(EVENTO, { acao: "criarConversa", pedido, usuario: game.user.id, ...dados });
	return esperar(() => game.journal.find((n) => n.getFlag(MODULO, "conversa")?.pedido === pedido));
}

export function registrarSocket() {
	game.socket.on(EVENTO, async (dados) => {
		if (!game.users.activeGM?.isSelf || !opcao("correioJogadores")) return;
		const usuario = game.users.get(dados?.usuario);
		const criador = game.actors.get(dados?.criador);
		if (!usuario || !criador?.testUserPermission(usuario, "OWNER")) return;
		if (dados.acao === "criarConversa" && dados.participantes?.includes(criador.id)) {
			const nota = await criarNota(dados);
			if (nota) await nota.setFlag(MODULO, "conversa.pedido", dados.pedido);
		}
		if (dados.acao === "alterarGrupo") {
			const nota = game.journal.get(dados.nota);
			if (nota?.getFlag(MODULO, "conversa")?.criador === criador.id) await aplicarParticipantes(nota, dados.participantes, criador.id);
		}
	});
}

async function ajustarDonos(nota, participantes) {
	const esperado = donosDaConversa(participantes);
	const atual = nota.ownership ?? {};
	const chaves = new Set([...Object.keys(esperado), ...Object.keys(atual)]);
	if (![...chaves].some((k) => (esperado[k] ?? 0) !== (atual[k] ?? 0))) return;
	await nota.update({ ownership: { ...Object.fromEntries([...chaves].map((k) => [k, 0])), ...esperado } }, { diff: false, recursive: false });
}

/* O mestre mantém os donos das notas em dia quando um personagem muda de jogador. */
export async function sincronizarPermissoes() {
	if (!game.users.activeGM?.isSelf) return;
	for (const { nota, participantes } of conversas()) await ajustarDonos(nota, participantes);
}

/* Troca os participantes de um grupo, ajusta os donos da nota e registra a mudança na conversa. */
async function aplicarParticipantes(nota, participantes, autor) {
	const dados = nota.getFlag(MODULO, "conversa");
	if (!dados?.grupo || !Array.isArray(participantes)) return;
	const novos = [...new Set([dados.criador, ...participantes])].filter((id) => noCorreio(game.actors.get(id))).sort();
	const entraram = novos.filter((id) => !dados.participantes.includes(id));
	const sairam = dados.participantes.filter((id) => !novos.includes(id));
	if (novos.length < 2 || (!entraram.length && !sairam.length)) return;
	const nomes = (ids) => ids.map((id) => escapar(game.actors.get(id)?.name ?? "?")).join(", ");
	const quando = Date.now();
	/* O aviso entra antes da troca, para quem saiu ainda recebê-lo. */
	await nota.createEmbeddedDocuments("JournalEntryPage", [
		{
			name: `Participantes · ${new Date(quando).toLocaleString("pt-BR")}`,
			type: "text",
			text: { content: `<p><em>${[entraram.length ? `Entrou: ${nomes(entraram)}.` : "", sairam.length ? `Saiu: ${nomes(sairam)}.` : ""].filter(Boolean).join(" ")}</em></p>`, format: 1 },
			sort: quando,
			flags: { [MODULO]: { mensagem: { de: autor, usuario: game.user.id, quando, sistema: true, item: null, edicoes: [], revelada: false } } }
		}
	]);
	await nota.update({ [`flags.${MODULO}.conversa.participantes`]: novos });
	await ajustarDonos(nota, novos);
}

/* Só o criador do grupo ou o mestre mudam os participantes; quem grava é sempre o cliente do mestre. */
export async function alterarParticipantes(idDaNota, participantes, de) {
	const nota = game.journal.get(idDaNota);
	const dados = nota?.getFlag(MODULO, "conversa");
	if (!dados?.grupo) return;
	if (game.user.isGM) return aplicarParticipantes(nota, participantes, de ?? dados.criador);
	if (dados.criador !== de || !game.actors.get(de)?.isOwner) return;
	if (!game.users.activeGM) {
		ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.GrupoSemMestre"));
		return;
	}
	game.socket.emit(EVENTO, { acao: "alterarGrupo", nota: idDaNota, participantes, criador: de, usuario: game.user.id });
}

/* ---------------------------------------------------------------- */
/* Escrita                                                           */
/* ---------------------------------------------------------------- */

export function correioDisponivel() {
	return game.user.isGM || !!opcao("correioJogadores");
}

export async function criarGrupo({ de, nome, participantes }) {
	return abrirConversa({ grupo: true, nome, participantes: [de, ...participantes], criador: de });
}

/* Conversa a dois: informe para. Grupo: informe conversa (id da nota); o item leva o destinatário em item.para.
   O item sai da ficha do remetente e fica guardado na mensagem até o destinatário retirar. */
export async function enviar({ de, para = null, conversa = null, texto, item = null }) {
	const remetente = game.actors.get(de);
	if (!remetente || !correioDisponivel() || !(game.user.isGM || remetente.isOwner)) return null;
	let nota = conversa ? game.journal.get(conversa) : conversaADois(de, para)?.nota;
	nota ??= conversa ? null : await abrirConversa({ participantes: [de, para], criador: de });
	const dados = nota?.getFlag(MODULO, "conversa");
	if (!dados?.participantes.includes(de)) return null;

	const destinatario = dados.grupo ? item?.para : dados.participantes.find((id) => id !== de);
	const origem = item?.id && dados.participantes.includes(destinatario) && destinatario !== de ? remetente.items.get(item.id) : null;
	let anexo = null;
	if (origem && itensEnviaveis(remetente).some((i) => i.id === origem.id)) {
		const total = quantidadeDoItem(origem);
		const qtd = Math.max(1, Math.min(total, Math.round(Number(item.qtd)) || 1));
		const copia = origem.toObject();
		delete copia._id;
		if (copia.system && "qtd" in copia.system) copia.system.qtd = qtd;
		if (copia.system && "equipado" in copia.system) copia.system.equipado = typeof copia.system.equipado === "number" ? 0 : false;
		anexo = { nome: origem.name, img: origem.img, qtd, total, para: destinatario, recebido: false, dados: copia };
	}
	const html = paraHtml(texto);
	if (!html && !anexo) return null;

	const quando = Date.now();
	const mensagem = { de, usuario: game.user.id, quando, item: anexo && { ...anexo, total: undefined }, edicoes: [], revelada: false };
	const [pagina] = await nota.createEmbeddedDocuments("JournalEntryPage", [
		{ name: `${remetente.name} · ${new Date(quando).toLocaleString("pt-BR")}`, type: "text", text: { content: html, format: 1 }, sort: quando, flags: { [MODULO]: { mensagem } } }
	]);
	if (pagina && anexo) {
		if (anexo.qtd >= anexo.total) await origem.delete();
		else await origem.update({ "system.qtd": anexo.total - anexo.qtd });
	}
	return pagina ?? null;
}

/* O destinatário (ou o mestre) retira o item guardado na mensagem para a própria ficha. */
export async function receberItem(idDaNota, idDaMensagem) {
	const pagina = game.journal.get(idDaNota)?.pages.get(idDaMensagem);
	const item = pagina?.getFlag(MODULO, "mensagem")?.item;
	const actor = game.actors.get(item?.para);
	if (!item || item.recebido || !item.dados || !actor || !(game.user.isGM || actor.isOwner)) return;
	/* Marca como retirado antes de criar o item, para um clique duplo não entregar duas vezes. */
	const dados = foundry.utils.deepClone(item.dados);
	await pagina.update({ [`flags.${MODULO}.mensagem.item.recebido`]: true, [`flags.${MODULO}.mensagem.item.dados`]: null });
	await actor.createEmbeddedDocuments("Item", [dados]);
}

export async function editarMensagem(idDaNota, idDaMensagem, texto) {
	const pagina = game.journal.get(idDaNota)?.pages.get(idDaMensagem);
	const html = paraHtml(texto);
	if (!game.user.isGM || !pagina || html === pagina.text?.content) return;
	await pagina.update({ "text.content": html });
}

export async function alternarRevelacao(idDaNota, idDaMensagem) {
	const pagina = game.journal.get(idDaNota)?.pages.get(idDaMensagem);
	const mensagem = pagina?.getFlag(MODULO, "mensagem");
	if (!game.user.isGM || !mensagem) return;
	await pagina.update({ [`flags.${MODULO}.mensagem.revelada`]: !mensagem.revelada });
}

/* ---------------------------------------------------------------- */
/* Guardas: toda edição deixa histórico e só o mestre apaga          */
/* ---------------------------------------------------------------- */

export function registrarGuardas() {
	/* Vale para qualquer edição, inclusive as feitas direto na nota. */
	Hooks.on("preUpdateJournalEntryPage", (pagina, mudancas, opcoes, idDoUsuario) => {
		const mensagem = pagina.getFlag(MODULO, "mensagem");
		const novo = mudancas.text?.content;
		if (!mensagem || novo === undefined || novo === pagina.text?.content) return;
		const edicoes = [...(mensagem.edicoes ?? []), { texto: pagina.text?.content ?? "", quando: Date.now(), por: game.users.get(idDoUsuario)?.name ?? "?" }];
		foundry.utils.setProperty(mudancas, `flags.${MODULO}.mensagem.edicoes`, edicoes);
	});
	const soMestre = (eDoCorreio) => (documento) => {
		if (game.user.isGM || !eDoCorreio(documento)) return;
		ui.notifications.warn(game.i18n.localize("ACADEMIA.Aviso.CorreioSemApagar"));
		return false;
	};
	Hooks.on("preDeleteJournalEntryPage", soMestre((pagina) => !!pagina.getFlag(MODULO, "mensagem")));
	Hooks.on("preDeleteJournalEntry", soMestre(ehConversa));
}

/* ---------------------------------------------------------------- */
/* Migração do registro antigo (v1.5.0 guardava tudo numa configuração) */
/* ---------------------------------------------------------------- */

export async function migrarRegistroAntigo() {
	if (!game.users.activeGM?.isSelf) return;
	const antigas = Object.values(opcao("correio")?.conversas ?? {});
	if (!antigas.length) return;
	for (const antiga of antigas) {
		const nota = await criarNota({ grupo: !!antiga.grupo, nome: antiga.nome, participantes: antiga.participantes, criador: antiga.criador ?? antiga.participantes[0] });
		if (!nota) continue;
		const paginas = antiga.mensagens.map((m) => ({
			name: `${game.actors.get(m.de)?.name ?? "?"} · ${new Date(m.quando).toLocaleString("pt-BR")}`,
			type: "text",
			text: { content: paraHtml(m.texto), format: 1 },
			sort: m.quando,
			flags: {
				[MODULO]: {
					mensagem: {
						de: m.de,
						usuario: m.usuario,
						quando: m.quando,
						item: m.item ? { nome: m.item.nome, img: m.item.img, qtd: m.item.qtd, para: null, recebido: true, dados: null } : null,
						edicoes: (m.edicoes ?? []).map((e) => ({ ...e, texto: paraHtml(e.texto) })),
						revelada: !!m.revelada
					}
				}
			}
		}));
		if (paginas.length) await nota.createEmbeddedDocuments("JournalEntryPage", paginas);
	}
	await game.settings.set(MODULO, "correio", { conversas: {} });
}

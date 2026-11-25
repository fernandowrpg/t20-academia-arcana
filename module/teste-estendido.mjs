import { MODULO, opcao } from "./config.mjs";
import { planoAtual, textoEmItens, textoEmParagrafos } from "./planos.mjs";
import { PERICIAS_T20 } from "./data/disciplinas.mjs";

/*
 * Teste estendido (T20: "X sucessos antes de Y falhas"), no formato do template
 * "T20 - Teste Estendido" do Obsidian. Gravado na configuração de mundo "testeEstendido":
 * { visivel, atual: { titulo, contexto, cd, cdOculta, sucessosNecessarios, falhasLimite, intervalo,
 *   principais, alternativas, abordagens, regras, eventos, total, parcial, fracasso, segredo,
 *   tipo, rodadas, trilhas, marcadores },
 *   sucessos, falhas, rodada, contadores: { [nome]: valor }, salvos: [teste] }
 * Tipo "complexo" (perigo complexo): rodadas, trilhas com meta ("Nome | meta | dica" por linha) e
 * marcadores livres ("Nome | dica" por linha) no lugar das caixas de sucesso e falha.
 * O mestre edita, mostra/esconde e marca o progresso; os jogadores só veem.
 */

export const CAMPOS_TESTE = [
	"titulo",
	"contexto",
	"cd",
	"sucessosNecessarios",
	"falhasLimite",
	"intervalo",
	"principais",
	"alternativas",
	"abordagens",
	"regras",
	"eventos",
	"total",
	"parcial",
	"fracasso",
	"segredo",
	"tipo",
	"rodadas",
	"trilhas",
	"marcadores"
];

const NUMERICOS = ["cd", "sucessosNecessarios", "falhasLimite", "rodadas"];

const MAX_MARCAS = 10;

/* Texto curto em uma linha só (várias linhas viram quebras), com **negrito** e *itálico*. */
const emTexto = (texto) => textoEmItens(texto).join("<br>");

export function testeEmBranco() {
	return {
		titulo: "",
		contexto: "",
		cd: null,
		cdOculta: false,
		sucessosNecessarios: 4,
		falhasLimite: 3,
		intervalo: "1 rodada",
		principais: "",
		alternativas: "",
		abordagens: "Ajudar (qualquer perícia, justificada) | 10 | Dá +2 no próximo teste; não conta como sucesso.",
		regras: "",
		eventos: "",
		total: "",
		parcial: "",
		fracasso: "",
		segredo: "",
		tipo: "estendido",
		rodadas: 0,
		trilhas: "",
		marcadores: ""
	};
}

/* Um exemplo pronto, a Rua que Andou (Magika), para o mestre ver como o painel fica. */
export function testeDeExemplo() {
	return {
		...testeEmBranco(),
		titulo: "A Rua que Andou",
		contexto: "Chegar à Akademia antes que a Cidade de Magika mude de ideia sobre onde ela fica.",
		cd: 22,
		intervalo: "alguns minutos caminhando pela cidade",
		principais: "Misticismo, Percepção, Investigação",
		alternativas: "Conhecimento",
		abordagens: [
			"Misticismo | 22 | Ler o feitiço da rua.",
			"Percepção | 22 | Achar as placas que piscam.",
			"Investigação ou Conhecimento | 20 | Mapear o padrão dos bairros.",
			"Atletismo | 18 | Segurar a esquina: ancorar o caminho (1× na cena).",
			"Enganação | 18 | Enganar a rua, fingindo ir a outro lugar (1× na cena).",
			"Ajudar (qualquer perícia, justificada) | 10 | Dá +2 no próximo teste; não conta como sucesso."
		].join("\n"),
		regras: "A cada rodada um aluno faz o teste principal; os outros podem **ajudar** com perícias diferentes entre si.\n**Mesma perícia em duas rodadas seguidas:** +5 na CD (a rua \"aprende\" o truque).",
		eventos: [
			"**Bairro das Torres Tímidas:** quem fez o teste fica *desprevenido* na próxima cena de combate.",
			"**Mercado dos Desejos em Lâminas:** a turma vai direto ao mercado e depois volta ao teste.",
			"**Fracasso:** chegam atrasados; o primeiro aluno a falar com o examinador sofre –2."
		].join("\n"),
		total: "Chegam à Akademia com tempo de sobra e +2 no primeiro teste social da cena seguinte.",
		parcial: "Chegam a tempo, mas cansados e desarrumados.",
		fracasso: "Chegam atrasados; veja o terceiro evento."
	};
}

function inteiro(valor, padrao, min, max) {
	const n = Math.round(Number(valor));
	if (!Number.isFinite(n)) return padrao;
	return Math.max(min, Math.min(max, n));
}

function normalizarTeste(bruto = {}) {
	const base = testeEmBranco();
	const teste = { ...base };
	for (const campo of CAMPOS_TESTE) if (bruto[campo] !== undefined && bruto[campo] !== null) teste[campo] = bruto[campo];
	for (const campo of CAMPOS_TESTE) if (!NUMERICOS.includes(campo)) teste[campo] = String(teste[campo] ?? "");
	teste.tipo = teste.tipo === "complexo" ? "complexo" : "estendido";
	teste.rodadas = inteiro(bruto.rodadas, 0, 0, 20);
	const cd = String(bruto.cd ?? "").trim();
	teste.cd = cd === "" ? null : inteiro(cd, null, 0, 99);
	teste.cdOculta = bruto.cdOculta === true || bruto.cdOculta === "true";
	teste.sucessosNecessarios = inteiro(bruto.sucessosNecessarios, base.sucessosNecessarios, 1, MAX_MARCAS);
	teste.falhasLimite = inteiro(bruto.falhasLimite, base.falhasLimite, 1, MAX_MARCAS);
	return teste;
}

export function lerTeste() {
	const salvo = foundry.utils.deepClone(opcao("testeEstendido") ?? {});
	const atual = normalizarTeste(salvo.atual);
	return {
		visivel: !!salvo.visivel,
		atual,
		sucessos: inteiro(salvo.sucessos, 0, 0, atual.sucessosNecessarios),
		falhas: inteiro(salvo.falhas, 0, 0, atual.falhasLimite),
		rodada: inteiro(salvo.rodada, 1, 1, 99),
		contadores: Object.fromEntries(Object.entries(salvo.contadores ?? {}).map(([k, v]) => [k, inteiro(v, 0, 0, 99)])),
		salvos: Array.isArray(salvo.salvos) ? salvo.salvos.map(normalizarTeste) : []
	};
}

async function gravar(dados) {
	if (!game.user.isGM) return;
	return game.settings.set(MODULO, "testeEstendido", dados);
}

export function testeDefinido(dados = lerTeste()) {
	return !!dados.atual.titulo.trim() || !!dados.atual.abordagens.trim() || !!dados.atual.principais.trim();
}

/* CD do teste; sem CD anotada, a do plano atual (18 + nível), como pede o template da campanha. */
export function cdDoTeste(teste) {
	if (teste.cd !== null) return { valor: teste.cd, doPlano: false };
	const plano = planoAtual();
	return plano ? { valor: plano.cd, doPlano: true, plano: plano.nome } : { valor: null, doPlano: false };
}

/* andamento | sucesso | parcial | fracasso. "Parcial": venceu com a falha anterior ao limite (ex.: 2 de 3). */
export function situacaoDoTeste(dados = lerTeste()) {
	const { atual, sucessos, falhas } = dados;
	if (atual.tipo === "complexo") {
		if (trilhasEmLinhas(atual.trilhas).some((t) => (dados.contadores?.[t.nome] ?? 0) >= t.meta)) return "sucesso";
		if (atual.rodadas && dados.rodada > atual.rodadas) return "fim";
		return "andamento";
	}
	if (falhas >= atual.falhasLimite) return "fracasso";
	if (sucessos >= atual.sucessosNecessarios) return falhas > 0 && falhas === atual.falhasLimite - 1 ? "parcial" : "sucesso";
	return "andamento";
}

export const ROTULOS_SITUACAO = {
	andamento: "Em andamento",
	sucesso: "Sucesso total",
	parcial: "Sucesso parcial",
	fracasso: "Fracasso",
	fim: "Rodadas encerradas"
};

/* ---------- Perigo complexo: trilhas e marcadores ---------- */

function linhas(texto) {
	return String(texto ?? "")
		.split(/\r?\n/)
		.map((l) => l.trim().replace(/^[-•*]\s+/, ""))
		.filter(Boolean);
}

/* "Nome | meta | dica" por linha; meta padrão 3. */
export function trilhasEmLinhas(texto) {
	return linhas(texto).map((linha) => {
		const [nome = "", meta = "", ...dica] = linha.split("|").map((p) => p.trim());
		return { nome, meta: inteiro(meta, 3, 1, 20), dica: dica.join(" | ") };
	});
}

/* "Nome | dica" por linha. */
export function marcadoresEmLinhas(texto) {
	return linhas(texto).map((linha) => {
		const [nome = "", ...dica] = linha.split("|").map((p) => p.trim());
		return { nome, dica: dica.join(" | ") };
	});
}

export async function avancarRodada(delta) {
	const dados = lerTeste();
	dados.rodada = Math.max(1, dados.rodada + delta);
	return gravar(dados);
}

/* Trilhas e marcadores; avisa no chat quando uma trilha chega à meta. */
export async function ajustarContador(nome, delta) {
	const dados = lerTeste();
	const antes = situacaoDoTeste(dados);
	dados.contadores[nome] = Math.max(0, (dados.contadores[nome] ?? 0) + delta);
	await gravar(dados);
	const trilha = trilhasEmLinhas(dados.atual.trilhas).find((t) => t.nome === nome);
	if (delta > 0 && trilha && dados.contadores[nome] === trilha.meta && antes === "andamento") {
		await ChatMessage.create({
			speaker: { alias: dados.atual.titulo || "Perigo complexo" },
			content: `<div class="aa-teste-chat"><p><strong>${escapar(nome)}</strong> chegou a ${trilha.meta}!</p></div>`
		});
	}
}

/* ---------- Perícias: nome do T20 para chave e rolagem ---------- */

function normalizarNome(valor) {
	return String(valor ?? "")
		.replace(/<[^>]+>|\*+/g, "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.trim();
}

const POR_NOME = new Map(
	Object.entries(PERICIAS_T20).flatMap(([chave, nome]) => [
		[normalizarNome(nome), chave],
		[normalizarNome(nome.replace("Ofício: ", "")), chave],
		[chave, chave]
	])
);
const OFICIOS_LIVRES = { alquimia: "alqu", alquimista: "alqu", armeiro: "arme", artesao: "arte", artesanato: "arte", cozinheiro: "cozi", culinaria: "cozi", alfaiate: "alfa", engenhoqueiro: "enge", engenharia: "enge" };

export function chavePericia(nome) {
	const n = normalizarNome(nome);
	if (POR_NOME.has(n)) return POR_NOME.get(n);
	const oficio = n.match(/^oficio\s*[:(]?\s*([a-z]+)/);
	return oficio ? (OFICIOS_LIVRES[oficio[1]] ?? null) : null;
}

/* "Luta ou Atletismo", "Misticismo, Percepção" viram nomes separados. */
export function periciasDoTexto(texto) {
	return String(texto ?? "")
		.replace(/<[^>]+>|\*+/g, "")
		.split(/\s*(?:,|\/|\bou\b)\s*/i)
		.map((p) => p.trim())
		.filter(Boolean);
}

/* Rola com o token selecionado ou o personagem do usuário. */
export async function rolarPericia(nome, cd, event) {
	const actor = canvas?.tokens?.controlled[0]?.actor ?? game.user.character;
	if (!actor) return ui.notifications.warn("Selecione um token ou defina o seu personagem para rolar.");
	const chave = chavePericia(nome);
	const pericias = actor.system?.pericias ?? {};
	if (chave && typeof actor.rollPericia === "function" && pericias[chave]) return actor.rollPericia(chave, { event, message: true });
	const roll = await new Roll(`1d20 + ${Number(pericias[chave]?.value ?? 0)}`).evaluate();
	return roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: `${nome}${cd ? ` (CD ${cd})` : ""}` });
}

/* "Perícia | CD | descrição" por linha; CD e descrição são opcionais. */
export function abordagensEmLinhas(texto, cdPadrao) {
	return String(texto ?? "")
		.split(/\r?\n/)
		.map((l) => l.trim().replace(/^[-•*]\s+/, ""))
		.filter(Boolean)
		.map((linha) => {
			const [pericia = "", cd = "", ...resto] = linha.split("|").map((p) => p.trim());
			return {
				pericia: emTexto(pericia),
				cd: cd || (cdPadrao ?? "—"),
				descricao: emTexto(resto.join(" | "))
			};
		});
}

export async function salvarCamposDoTeste(campos) {
	const dados = lerTeste();
	dados.atual = normalizarTeste({ ...dados.atual, ...campos });
	return gravar(ajustarMarcas(dados));
}

function ajustarMarcas(dados) {
	dados.sucessos = Math.min(dados.sucessos, dados.atual.sucessosNecessarios);
	dados.falhas = Math.min(dados.falhas, dados.atual.falhasLimite);
	return dados;
}

/* tipo: "sucessos" ou "falhas"; delta +1/-1. Não marca mais nada depois de o teste terminar, exceto desfazer. */
export async function marcar(tipo, delta) {
	const dados = lerTeste();
	if (delta > 0 && situacaoDoTeste(dados) !== "andamento") return;
	const limite = tipo === "sucessos" ? dados.atual.sucessosNecessarios : dados.atual.falhasLimite;
	dados[tipo] = Math.max(0, Math.min(limite, dados[tipo] + delta));
	return gravar(dados);
}

/* Clicar numa caixa marca até ela; clicar na última marcada desmarca. */
export async function marcarAte(tipo, indice) {
	const dados = lerTeste();
	const limite = tipo === "sucessos" ? dados.atual.sucessosNecessarios : dados.atual.falhasLimite;
	const alvo = Math.max(0, Math.min(limite, indice + 1));
	dados[tipo] = dados[tipo] === alvo ? alvo - 1 : alvo;
	return gravar(dados);
}

/* Mostra ou esconde dos jogadores a CD do teste e a de cada abordagem. */
export async function definirCdOculta(oculta) {
	const dados = lerTeste();
	dados.atual.cdOculta = !!oculta;
	return gravar(dados);
}

export async function alternarCdOculta() {
	return definirCdOculta(!lerTeste().atual.cdOculta);
}

export async function zerarTeste() {
	const dados = lerTeste();
	dados.sucessos = 0;
	dados.falhas = 0;
	dados.rodada = 1;
	dados.contadores = {};
	return gravar(dados);
}

export async function definirVisibilidade(visivel) {
	const dados = lerTeste();
	dados.visivel = !!visivel;
	return gravar(dados);
}

export async function alternarVisibilidade() {
	return definirVisibilidade(!lerTeste().visivel);
}

/* Troca o teste atual (novo, exemplo ou guardado) e zera o contador. */
export async function substituirTeste(teste) {
	const dados = lerTeste();
	dados.atual = normalizarTeste(teste);
	dados.sucessos = 0;
	dados.falhas = 0;
	dados.rodada = 1;
	dados.contadores = {};
	return gravar(dados);
}

/* Guarda uma cópia do teste atual na lista (substitui a de mesmo título). */
export async function guardarTeste() {
	const dados = lerTeste();
	const titulo = dados.atual.titulo.trim();
	if (!titulo) return false;
	dados.salvos = dados.salvos.filter((t) => t.titulo.trim() !== titulo);
	dados.salvos.push(foundry.utils.deepClone(dados.atual));
	dados.salvos.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
	await gravar(dados);
	return true;
}

/* Testes vindos do Vault (macro ou nota): guarda cada um na lista (substitui o de mesmo título)
   e põe o último na tela, com o progresso da nota se houver. */
export async function importarTestes(itens, { mostrar = true } = {}) {
	if (!game.user.isGM || !itens.length) return [];
	const dados = lerTeste();
	const importados = itens.map(({ teste, progresso }) => ({ teste: normalizarTeste(teste), progresso }));
	for (const { teste } of importados) {
		const titulo = teste.titulo.trim();
		if (!titulo) continue;
		dados.salvos = dados.salvos.filter((t) => t.titulo.trim() !== titulo);
		dados.salvos.push(foundry.utils.deepClone(teste));
	}
	dados.salvos.sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
	const { teste, progresso } = importados.at(-1);
	dados.atual = teste;
	dados.sucessos = inteiro(progresso?.sucessos, 0, 0, teste.sucessosNecessarios);
	dados.falhas = inteiro(progresso?.falhas, 0, 0, teste.falhasLimite);
	dados.rodada = inteiro(progresso?.rodada, 1, 1, 99);
	dados.contadores = foundry.utils.deepClone(progresso?.contadores ?? {});
	if (mostrar) dados.visivel = true;
	await gravar(dados);
	return importados.map((i) => i.teste);
}

/* Progresso atual, para exportar junto com o teste. */
export function progressoAtual(dados = lerTeste()) {
	return { sucessos: dados.sucessos, falhas: dados.falhas, rodada: dados.rodada, contadores: dados.contadores };
}

export async function excluirGuardado(indice) {
	const dados = lerTeste();
	dados.salvos.splice(indice, 1);
	return gravar(dados);
}

/* Contexto pronto para o painel e para o editor. */
export function contextoDoTeste({ gm = game.user.isGM, dados = lerTeste() } = {}) {
	const { atual, sucessos, falhas } = dados;
	const cd = cdDoTeste(atual);
	/* CD oculta: o mestre continua vendo os números; os jogadores veem "?". */
	const mostrarCd = gm || !atual.cdOculta;
	const situacao = situacaoDoTeste(dados);
	const eventos = textoEmItens(atual.eventos);
	const caixas = (total, marcadas) => Array.from({ length: total }, (_, i) => ({ indice: i, marcada: i < marcadas }));
	const resultados = { sucesso: atual.total, parcial: atual.parcial, fracasso: atual.fracasso, fim: "" };
	return {
		gm,
		visivel: dados.visivel,
		definido: testeDefinido(dados),
		titulo: atual.titulo.trim() || "Teste estendido",
		contexto: emTexto(atual.contexto),
		cd: mostrarCd ? cd.valor : "?",
		cdOculta: atual.cdOculta,
		mostrarCd,
		cdDica: !mostrarCd
			? "O mestre não revelou a CD"
			: `${cd.doPlano ? `CD do plano atual (${cd.plano}: 18 + nível)` : "CD dos testes"}${gm ? (atual.cdOculta ? ". Escondida dos jogadores: clique para mostrar" : ". Clique para esconder dos jogadores") : ""}`,
		sucessosNecessarios: atual.sucessosNecessarios,
		falhasLimite: atual.falhasLimite,
		falhasParcial: Math.max(0, atual.falhasLimite - 1),
		intervalo: atual.intervalo.trim(),
		principais: emTexto(atual.principais),
		alternativas: emTexto(atual.alternativas),
		abordagens: abordagensEmLinhas(atual.abordagens, cd.valor).map((a) => {
			const rolaveis = periciasDoTexto(a.pericia).map((nome) => ({ nome, rolavel: !!chavePericia(nome), cd: mostrarCd ? a.cd : "" }));
			return { ...a, cd: mostrarCd ? a.cd : "?", rolaveis, temRolagem: rolaveis.some((r) => r.rolavel) };
		}),
		complexo: atual.tipo === "complexo",
		rodada: dados.rodada,
		rodadas: atual.rodadas,
		rodadaTexto: atual.rodadas ? `${Math.min(dados.rodada, atual.rodadas)}/${atual.rodadas}` : `${dados.rodada}`,
		trilhas: trilhasEmLinhas(atual.trilhas).map((t) => {
			const valor = dados.contadores?.[t.nome] ?? 0;
			return { ...t, valor, completa: valor >= t.meta, caixas: Array.from({ length: t.meta }, (_, i) => ({ marcada: i < valor })) };
		}),
		marcadores: marcadoresEmLinhas(atual.marcadores).map((m) => ({ ...m, valor: dados.contadores?.[m.nome] ?? 0 })),
		regras: textoEmItens(atual.regras),
		sucessos,
		falhas,
		caixasSucesso: caixas(atual.sucessosNecessarios, sucessos),
		caixasFalha: caixas(atual.falhasLimite, falhas),
		situacao,
		rotuloSituacao: ROTULOS_SITUACAO[situacao],
		terminado: situacao !== "andamento",
		/* Jogadores veem só os eventos das falhas que já aconteceram; o mestre vê todos, com os já ocorridos marcados. */
		eventos: eventos.map((texto, i) => ({ texto, numero: i + 1, ocorreu: i < falhas })).filter((e) => gm || e.ocorreu),
		resultado: situacao === "andamento" ? "" : emTexto(resultados[situacao]),
		resultadosMestre: gm
			? [
					{ rotulo: ROTULOS_SITUACAO.sucesso, texto: emTexto(atual.total), atual: situacao === "sucesso" },
					{ rotulo: `${ROTULOS_SITUACAO.parcial} (venceu com ${Math.max(0, atual.falhasLimite - 1)} falha(s))`, texto: emTexto(atual.parcial), atual: situacao === "parcial" },
					{ rotulo: ROTULOS_SITUACAO.fracasso, texto: emTexto(atual.fracasso), atual: situacao === "fracasso" }
				].filter((r) => r.texto)
			: [],
		segredo: gm ? textoEmParagrafos(atual.segredo) : []
	};
}

function escapar(texto) {
	return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* Cartão no chat com o teste e o progresso. */
export async function anunciarTeste() {
	if (!game.user.isGM) return;
	const c = contextoDoTeste({ gm: false });
	const marcas = (caixas, classe) => caixas.map((x) => `<i class="fa-${x.marcada ? "solid" : "regular"} fa-square${x.marcada ? "-check" : ""} ${classe}"></i>`).join(" ");
	const abordagens = c.abordagens.map((a) => `<li><strong>${a.pericia}</strong>${c.mostrarCd ? ` (CD ${escapar(a.cd)})` : ""}${a.descricao ? `: ${a.descricao}` : ""}</li>`).join("");
	const content = `<div class="aa-teste-chat">
	<header><i class="fa-solid fa-dice-d20"></i><div><strong>${escapar(c.titulo)}</strong><small>${c.complexo ? "Perigo complexo" : "Teste estendido"}${c.mostrarCd && c.cd !== null ? ` · CD ${c.cd}` : ""} · ${c.complexo ? (c.rodadas ? `${c.rodadas} rodadas` : "sem limite de rodadas") : `${c.sucessosNecessarios} sucessos antes de ${c.falhasLimite} falhas`}</small></div></header>
	${c.contexto ? `<p><em>${c.contexto}</em></p>` : ""}
	${abordagens ? `<ul>${abordagens}</ul>` : ""}
	${c.complexo
		? `<p class="aa-teste-chat-placar">Rodada ${c.rodadaTexto}${c.trilhas.map((t) => ` · ${escapar(t.nome)} ${t.valor}/${t.meta}`).join("")}${c.marcadores.map((m) => ` · ${escapar(m.nome)} ${m.valor}`).join("")}</p>`
		: `<p class="aa-teste-chat-placar">Sucessos ${marcas(c.caixasSucesso, "sucesso")} · Falhas ${marcas(c.caixasFalha, "falha")}</p>`}
	${c.terminado ? `<p class="aa-teste-chat-resultado ${c.situacao}"><strong>${c.rotuloSituacao}.</strong> ${c.resultado}</p>` : ""}
</div>`;
	await ChatMessage.create({ content, speaker: { alias: "Teste Estendido" } });
}

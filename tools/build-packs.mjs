import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { DISCIPLINAS, OFICIO_LIVRE } from "../module/data/disciplinas.mjs";
import { montarCatalogo, nomePericia, periciasDoCatalogo, preRequisitos } from "../module/logica.mjs";
import { markdownParaHtml } from "./markdown.mjs";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(RAIZ, "src");
const TMP = join(RAIZ, ".build");
const PACKS = join(RAIZ, "packs");
const STATS = { coreVersion: "13.351", systemId: "tormenta20", systemVersion: "1.5.015" };

const ALFABETO = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

function idEstavel(chave) {
	const hash = createHash("sha256").update(`t20-academia-arcana:${chave}`).digest();
	let id = "";
	for (let i = 0; i < 16; i++) id += ALFABETO[hash[i] % ALFABETO.length];
	return id;
}

function lerJson(caminho) {
	return JSON.parse(readFileSync(caminho, "utf8"));
}

function escapar(texto) {
	return String(texto).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function semTituloInicial(html) {
	return html.replace(/^\s*<h1>[\s\S]*?<\/h1>\s*/, "");
}

function paginaDisciplinas() {
	const catalogo = montarCatalogo();
	const partes = [
		"<p><em>Manual do Arcano, p. 100–102.</em></p>",
		"<p>Para progredir, o aluno monta o próprio currículo a cada semestre. A lista do livro é <strong>parcial</strong> ; aqui ela está agrupada pela perícia de Tormenta20 usada no teste de cada disciplina.</p>",
		"<h2>Regras de matrícula</h2>",
		"<ul>",
		"<li>O aluno deve cursar <strong>pelo menos três disciplinas</strong> por semestre.</li>",
		"<li>O teste do semestre usa a perícia da <strong>maioria</strong> das disciplinas cursadas; em caso de empate, o aluno testa todas as perícias empatadas.</li>",
		"<li>Não é possível cursar de novo uma disciplina já concluída com sucesso.</li>",
		"<li>Disciplinas numeradas exigem aprovação em todas as de mesmo nome e número menor (Alquimia III exige Alquimia I e II).</li>",
		"<li>Fora os magos, quase ninguém se forma usando só suas melhores perícias: escolher bem as disciplinas de cada semestre faz diferença.</li>",
		"</ul>",
		'<div class="aa-quadro"><p><strong>Adaptação para Tormenta20.</strong> As disciplinas estão agrupadas pela perícia de T20. Conhecimento (arcano) e Identificar Magia viraram Misticismo; Conhecimento (engenharia), Ofício: Engenhoqueiro; Conhecimento (natureza), Sobrevivência; Conhecimento (geografia, história e Tormenta), Conhecimento; Ofício (administração) e Ofício (metalurgia), <em>Ofício (à escolha)</em>. O mestre pode trocar a perícia de qualquer disciplina no catálogo. Professores indicados vêm das descrições do corpo docente; os demais ficam "a definir".</p></div>'
	];
	for (const chave of periciasDoCatalogo(catalogo)) {
		const lista = DISCIPLINAS.filter((d) => d.pericia === chave);
		if (!lista.length) continue;
		partes.push(`<h2>${escapar(nomePericia(chave))}</h2>`);
		if (chave === OFICIO_LIVRE) {
			partes.push("<p>O aluno escolhe, na matrícula, qual ofício usar em cada disciplina: Armeiro, Artesão, Alquimista, Cozinheiro, Alfaiate, Engenhoqueiro ou um ofício personalizado da ficha (como Escriba ou Ourives).</p>");
		}
		partes.push("<table><thead><tr><th>Disciplina</th><th>Pré-requisitos</th><th>Professor</th></tr></thead><tbody>");
		for (const d of lista) {
			const req = preRequisitos(catalogo.get(d.id), catalogo).map((id) => catalogo.get(id)?.nome ?? id);
			const especial = d.especial ? " <em>(especial, só em alguns semestres)</em>" : "";
			partes.push(`<tr><td>${escapar(d.nome)}${especial}</td><td>${escapar(req.join(", ") || "—")}</td><td>${escapar(d.professor || "a definir")}</td></tr>`);
		}
		partes.push("</tbody></table>");
	}
	partes.push("<h2>Observações</h2>");
	partes.push("<ul><li>A série <em>Prática Aventuresca</em> se espalha por várias perícias (I e II em Atletismo, IV em Furtividade, V em Iniciativa, VI em Percepção). O livro não lista a III; crie-a no catálogo se quiser.</li>");
	partes.push("<li><em>Engenhocas</em> I a III são de Ofício: Engenhoqueiro; IV e V, de Ladinagem.</li>");
	partes.push("<li>Todas as disciplinas de sobrevivência em ambientes específicos exigem <em>Introdução aos Ermos</em>.</li></ul>");
	return partes.join("\n");
}

function conteudoDaPagina(p) {
	if (p.gerado === "disciplinas") return paginaDisciplinas();
	if (p.markdown) return semTituloInicial(markdownParaHtml(readFileSync(join(RAIZ, p.markdown), "utf8")));
	const html = semTituloInicial(readFileSync(join(SRC, "compendio", p.arquivo), "utf8"));
	const dados = lerJson(join(SRC, "ambientes", "index.json"));
	return html.replace(/\{\{ambientes\}\}/g, `@UUID[Compendium.${MODULO}.ambientes.JournalEntry.${idsDosAmbientes(dados).jid}]{${dados.journal}}`);
}

function documentoJournal(journal, indiceJournal) {
	const jid = idEstavel(`journal:${journal.nome}`);
	const pages = journal.paginas.map((p, i) => documentoPagina(jid, idEstavel(`page:${journal.nome}:${p.titulo}`), p.titulo, conteudoDaPagina(p), i));
	return {
		_id: jid,
		_key: `!journal!${jid}`,
		name: journal.nome,
		pages,
		folder: null,
		categories: [],
		sort: (indiceJournal + 1) * 100000,
		ownership: { default: 0 },
		flags: {},
		_stats: STATS
	};
}

function documentoMacro(m, i) {
	const id = idEstavel(`macro:${m.nome}`);
	return {
		_id: id,
		_key: `!macros!${id}`,
		name: m.nome,
		type: "script",
		img: m.img,
		scope: "global",
		command: readFileSync(join(SRC, "macros", m.arquivo), "utf8").trim(),
		folder: null,
		sort: (i + 1) * 100000,
		ownership: { default: 0 },
		flags: {},
		_stats: STATS
	};
}

const MODULO = "t20-academia-arcana";
const OBSERVADOR = 2;

function idsDosAmbientes(dados) {
	const jid = idEstavel(`journal:${dados.journal}`);
	const paginas = new Map(dados.ambientes.map((a) => [a.chave, idEstavel(`page:${dados.journal}:${a.chave}`)]));
	return {
		jid,
		indice: idEstavel(`page:${dados.journal}:indice`),
		paginas,
		cena: idEstavel(`scene:${dados.cena.nome}`),
		aventura: idEstavel(`adventure:${dados.cena.nome}`),
		pastaJournal: idEstavel("folder:JournalEntry:Academia Arcana"),
		pastaCena: idEstavel("folder:Scene:Academia Arcana")
	};
}

// {{link:chave}} vira um link relativo para a página irmã, que funciona tanto no compêndio quanto no mundo.
function ligarAmbientes(html, dados, ids, chave) {
	return html
		.replace(/\{\{link:([a-z-]+)\}\}/g, (_, alvo) => {
			const ambiente = dados.ambientes.find((a) => a.chave === alvo);
			if (!ambiente) throw new Error(`Ambiente desconhecido em {{link:${alvo}}} (${chave}).`);
			return `@UUID[.${ids.paginas.get(alvo)}]{${ambiente.titulo}}`;
		})
		.replace(/\{\{segredo\}\}/g, () => `secret-${idEstavel(`segredo:${chave}`)}`);
}

function paginaIndiceAmbientes(dados, ids) {
	const itens = dados.ambientes.map((a) => `<li>@UUID[.${ids.paginas.get(a.chave)}]{${a.titulo}}</li>`).join("\n");
	return [
		"<p><em>Manual do Arcano, p. 91–95 (mapa na p. 93).</em></p>",
		"<p>Um guia dos lugares da Grande Academia Arcana, com o que há em cada um, como usar o lugar em jogo com as regras de Tormenta20 e ganchos de aventura. Clique em um nome para abrir a página.</p>",
		`<ul>\n${itens}\n</ul>`,
		"<h2>O mapa no Foundry</h2>",
		"<ul>",
		`<li>Importe a aventura <em>${escapar(dados.cena.nome)}</em> do compêndio <em>Academia Arcana: Mapa</em>. Ela cria a cena com o mapa e estas notas na pasta <em>Academia Arcana</em>, já ligadas entre si.</li>`,
		"<li>Cada ambiente tem um pino no mapa. Clique duas vezes no pino para abrir a página; o mestre arrasta o pino para mudá-lo de lugar ou abre a configuração dele para trocar o ícone e o texto.</li>",
		"<li>Depois de importadas, as páginas são suas: edite descrições, regras e notas à vontade. Para criar um ambiente novo, adicione uma página a esta nota e um pino na cena (camada de Notas), escolhendo a página nova.</li>",
		`<li>A imagem do mapa é a arte do livro e não acompanha o módulo: gere a sua com <code>tools/extrair-mapa.py</code> a partir do seu PDF e coloque em <code>${escapar(dados.cena.imagem)}</code>, ou troque o fundo da cena por outra imagem.</li>`,
		"</ul>",
		'<div class="aa-quadro"><p><strong>Regras.</strong> As regras de cada ambiente seguem o Tormenta20 Jogo do Ano. Onde o livro antigo não tem equivalente direto, a adaptação vem explicada na própria página.</p></div>'
	].join("\n");
}

function documentoPagina(jid, pid, nome, conteudo, i) {
	return {
		_id: pid,
		_key: `!journal.pages!${jid}.${pid}`,
		name: nome,
		type: "text",
		title: { show: true, level: 1 },
		text: { format: 1, content: conteudo },
		image: {},
		video: { controls: true, volume: 0.5 },
		src: null,
		system: {},
		sort: (i + 1) * 100000,
		ownership: { default: -1 },
		flags: {},
		_stats: STATS
	};
}

function journalAmbientes(dados, ids) {
	const pages = [documentoPagina(ids.jid, ids.indice, dados.indice, paginaIndiceAmbientes(dados, ids), 0)];
	dados.ambientes.forEach((a, i) => {
		const html = semTituloInicial(readFileSync(join(SRC, "ambientes", a.arquivo), "utf8"));
		pages.push(documentoPagina(ids.jid, ids.paginas.get(a.chave), a.titulo, ligarAmbientes(html, dados, ids, a.chave), i + 1));
	});
	return {
		_id: ids.jid,
		_key: `!journal!${ids.jid}`,
		name: dados.journal,
		pages,
		folder: null,
		categories: [],
		sort: 100000,
		ownership: { default: OBSERVADOR },
		flags: {},
		_stats: STATS
	};
}

function cenaDoMapa(dados, ids) {
	const { cena } = dados;
	const notes = dados.ambientes.map((a, i) => ({
		_id: idEstavel(`note:${cena.nome}:${a.chave}`),
		entryId: ids.jid,
		pageId: ids.paginas.get(a.chave),
		x: a.x,
		y: a.y,
		elevation: 0,
		sort: i,
		texture: { src: a.icone, tint: "#ffffff" },
		iconSize: cena.tamanhoPino,
		text: a.titulo,
		fontFamily: "Signika",
		fontSize: 24,
		textAnchor: 1,
		textColor: "#ffffff",
		global: true,
		flags: {}
	}));
	return {
		_id: ids.cena,
		name: cena.nome,
		active: false,
		navigation: false,
		navOrder: 0,
		navName: "",
		background: { src: cena.imagem, tint: "#ffffff" },
		foreground: null,
		thumb: null,
		width: cena.largura,
		height: cena.altura,
		padding: 0,
		initial: { x: cena.largura / 2, y: cena.altura / 2, scale: 0.6 },
		backgroundColor: "#0b0a12",
		grid: { type: 0, size: 100, distance: 5, units: "m" },
		tokenVision: false,
		fog: { exploration: false },
		journal: ids.jid,
		journalEntryPage: ids.indice,
		notes,
		drawings: [],
		tokens: [],
		lights: [],
		sounds: [],
		regions: [],
		templates: [],
		tiles: [],
		walls: [],
		playlist: null,
		playlistSound: null,
		weather: "",
		folder: ids.pastaCena,
		sort: 0,
		ownership: { default: 0 },
		flags: {},
		_stats: STATS
	};
}

function semChaves(doc) {
	const { _key, ...resto } = doc;
	if (Array.isArray(resto.pages)) resto.pages = resto.pages.map(semChaves);
	return resto;
}

function aventuraDoMapa(dados, ids, journal) {
	const pasta = (id, type) => ({ _id: id, name: "Academia Arcana", type, folder: null, sorting: "m", sort: 0, color: "#5b3a8c", description: "", flags: {} });
	return {
		_id: ids.aventura,
		_key: `!adventures!${ids.aventura}`,
		name: dados.cena.nome,
		img: dados.cena.imagem,
		caption: "O mapa do Manual do Arcano com um pino para cada ambiente, ligado às notas dos ambientes.",
		description: [
			"<p>Cria no mundo, na pasta <strong>Academia Arcana</strong>:</p>",
			`<ul><li>a cena <em>${escapar(dados.cena.nome)}</em>, com ${dados.ambientes.length} pinos clicáveis;</li>`,
			`<li>a nota <em>${escapar(dados.journal)}</em>, com uma página por ambiente.</li></ul>`,
			"<p>Tudo fica editável depois de importado. Importar de novo substitui a cena e a nota pelas versões do módulo.</p>",
			`<p>A imagem do mapa não acompanha o módulo: gere a sua com <code>tools/extrair-mapa.py</code> a partir do seu PDF do <em>Manual do Arcano</em>.</p>`
		].join(""),
		actors: [],
		combats: [],
		items: [],
		journal: [{ ...semChaves(journal), folder: ids.pastaJournal }],
		scenes: [cenaDoMapa(dados, ids)],
		tables: [],
		macros: [],
		cards: [],
		playlists: [],
		folders: [pasta(ids.pastaJournal, "JournalEntry"), pasta(ids.pastaCena, "Scene")],
		folder: null,
		sort: 100000,
		flags: {},
		_stats: STATS
	};
}

function prepararFonte(nome, docs) {
	const dir = join(TMP, nome);
	mkdirSync(dir, { recursive: true });
	for (const doc of docs) writeFileSync(join(dir, `${doc._id}.json`), JSON.stringify(doc, null, 2));
	return dir;
}

async function main() {
	rmSync(TMP, { recursive: true, force: true });
	const journals = lerJson(join(SRC, "compendio", "index.json")).journals.map(documentoJournal);
	const macros = lerJson(join(SRC, "macros", "index.json")).macros.map(documentoMacro);
	const dadosAmbientes = lerJson(join(SRC, "ambientes", "index.json"));
	const idsAmbientes = idsDosAmbientes(dadosAmbientes);
	const ambientes = journalAmbientes(dadosAmbientes, idsAmbientes);
	const aventura = aventuraDoMapa(dadosAmbientes, idsAmbientes, ambientes);
	const fontes = {
		compendio: prepararFonte("compendio", journals),
		macros: prepararFonte("macros", macros),
		ambientes: prepararFonte("ambientes", [ambientes]),
		mapa: prepararFonte("mapa", [aventura])
	};
	for (const [nome, fonte] of Object.entries(fontes)) {
		const destino = join(PACKS, nome);
		rmSync(destino, { recursive: true, force: true });
		await compilePack(fonte, destino, { log: true });
	}
	rmSync(TMP, { recursive: true, force: true });
	const paginas = journals.reduce((n, j) => n + j.pages.length, 0);
	console.log(`Packs compilados: ${journals.length} diário(s) com ${paginas} página(s), ${macros.length} macro(s), ${ambientes.pages.length} página(s) de ambientes e o mapa com ${aventura.scenes[0].notes.length} pino(s).`);
}

main().catch((erro) => {
	console.error(erro);
	process.exit(1);
});

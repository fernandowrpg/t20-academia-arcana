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
	return semTituloInicial(readFileSync(join(SRC, "compendio", p.arquivo), "utf8"));
}

function documentoJournal(journal, indiceJournal) {
	const jid = idEstavel(`journal:${journal.nome}`);
	const pages = journal.paginas.map((p, i) => {
		const pid = idEstavel(`page:${journal.nome}:${p.titulo}`);
		const conteudo = conteudoDaPagina(p);
		return {
			_id: pid,
			_key: `!journal.pages!${jid}.${pid}`,
			name: p.titulo,
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
	});
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
	const fontes = { compendio: prepararFonte("compendio", journals), macros: prepararFonte("macros", macros) };
	for (const [nome, fonte] of Object.entries(fontes)) {
		const destino = join(PACKS, nome);
		rmSync(destino, { recursive: true, force: true });
		await compilePack(fonte, destino, { log: true });
	}
	rmSync(TMP, { recursive: true, force: true });
	const paginas = journals.reduce((n, j) => n + j.pages.length, 0);
	console.log(`Packs compilados: ${journals.length} diário(s) com ${paginas} página(s), ${macros.length} macro(s).`);
}

main().catch((erro) => {
	console.error(erro);
	process.exit(1);
});

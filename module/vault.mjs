import { MODULO } from "./config.mjs";
import { abordagensEmLinhas, marcadoresEmLinhas, periciasDoTexto, testeEmBranco, trilhasEmLinhas } from "./teste-estendido.mjs";

/*
 * Ponte com o Vault do Obsidian para o teste estendido.
 * A nota guarda o teste num bloco ```js``` que é ao mesmo tempo uma macro do Foundry
 * (o Obsidian mostra o botão de copiar no canto do bloco) e o dado que o importador lê:
 *   game.modules.get("t20-academia-arcana")?.api.desafio({ "nome": ..., "tipo": ..., ... });
 * Notas sem o bloco, no formato do template "T20 - Teste Estendido", também são lidas.
 */

const CHAMADA = `game.modules.get("${MODULO}")?.api.desafio(`;

const texto = (v) => (v === undefined || v === null ? "" : String(v).trim());
const listaEmLinhas = (v) => (Array.isArray(v) ? v.map(texto).filter(Boolean).join("\n") : texto(v));

/* ---------- JSON da macro <-> campos do teste ---------- */

/* Aceita o JSON da macro (nome, acoes, trilhas...) ou os próprios campos do teste (titulo, abordagens...). */
export function desafioParaTeste(d = {}) {
	if (d.titulo !== undefined || typeof d.abordagens === "string") return { ...testeEmBranco(), ...d };
	const cd = d.cd === undefined || d.cd === null || d.cd === "" ? null : Number(d.cd);
	const abordagens = (d.acoes ?? [])
		.filter((a) => texto(a?.nome) || a?.pericias || a?.pericia)
		.map((a) => {
			const pericias = Array.isArray(a.pericias) ? a.pericias : periciasDoTexto(a.pericias ?? a.pericia);
			const descricao = [texto(a.nome), texto(a.nota)].filter(Boolean).join(": ");
			return `${pericias.join(" ou ") || "Qualquer perícia"} | ${a.cd ?? ""} | ${descricao}`;
		});
	const trilhas = (d.trilhas ?? []).map((t) => (typeof t === "string" ? { nome: t } : t)).filter((t) => texto(t?.nome));
	const marcadores = (d.marcadores ?? []).map((m) => (typeof m === "string" ? { nome: m } : m)).filter((m) => texto(m?.nome));
	const tipo = d.tipo === "complexo" || (!d.tipo && (d.rodadas || trilhas.length)) ? "complexo" : "estendido";
	return {
		...testeEmBranco(),
		titulo: texto(d.nome),
		contexto: texto(d.descricao),
		cd: Number.isFinite(cd) ? cd : null,
		cdOculta: d.cdOculta === true,
		sucessosNecessarios: Number(d.sucessos) || 4,
		falhasLimite: Number(d.falhas) || 3,
		intervalo: texto(d.intervalo) || (tipo === "complexo" ? "1 rodada" : testeEmBranco().intervalo),
		principais: listaEmLinhas(d.principais).replace(/\n/g, ", "),
		alternativas: listaEmLinhas(d.alternativas).replace(/\n/g, ", "),
		abordagens: abordagens.length ? abordagens.join("\n") : testeEmBranco().abordagens,
		regras: listaEmLinhas(d.regras),
		eventos: listaEmLinhas(d.eventos),
		total: texto(d.resultados?.total),
		parcial: texto(d.resultados?.parcial),
		fracasso: texto(d.resultados?.fracasso),
		segredo: texto(d.notas),
		tipo,
		rodadas: Number(d.rodadas) || 0,
		trilhas: trilhas.map((t) => [texto(t.nome), t.meta ?? 3, texto(t.dica)].filter((x, i) => i < 2 || x).join(" | ")).join("\n"),
		marcadores: marcadores.map((m) => [texto(m.nome), texto(m.dica)].filter(Boolean).join(" | ")).join("\n")
	};
}

const semMarcacao = (v) => texto(v).replace(/<br>/g, " ");

export function testeParaDesafio(t, progresso = null) {
	const d = { nome: t.titulo.trim(), tipo: t.tipo };
	if (t.cd !== null) d.cd = t.cd;
	if (t.cdOculta) d.cdOculta = true;
	if (t.tipo === "estendido") Object.assign(d, { sucessos: t.sucessosNecessarios, falhas: t.falhasLimite });
	if (t.tipo === "complexo" && t.rodadas) d.rodadas = t.rodadas;
	if (t.intervalo.trim()) d.intervalo = t.intervalo.trim();
	if (t.contexto.trim()) d.descricao = t.contexto.trim();
	if (t.principais.trim()) d.principais = t.principais.trim();
	if (t.alternativas.trim()) d.alternativas = t.alternativas.trim();
	const acoes = String(t.abordagens ?? "")
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean)
		.map((linha) => {
			const [pericia = "", cd = "", ...resto] = linha.split("|").map((p) => p.trim());
			const acao = { nome: resto.join(" | ") || pericia, pericias: periciasDoTexto(pericia) };
			if (cd !== "" && Number.isFinite(Number(cd))) acao.cd = Number(cd);
			return acao;
		});
	if (acoes.length) d.acoes = acoes;
	if (t.tipo === "complexo") {
		const trilhas = trilhasEmLinhas(t.trilhas).map((x) => (x.dica ? x : { nome: x.nome, meta: x.meta }));
		const marcadores = marcadoresEmLinhas(t.marcadores).map((x) => (x.dica ? x : x.nome));
		if (trilhas.length) d.trilhas = trilhas;
		if (marcadores.length) d.marcadores = marcadores;
	}
	const linhas = (v) => String(v ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
	if (linhas(t.regras).length) d.regras = linhas(t.regras);
	if (linhas(t.eventos).length) d.eventos = linhas(t.eventos);
	const resultados = Object.fromEntries(["total", "parcial", "fracasso"].filter((k) => t[k].trim()).map((k) => [k, t[k].trim()]));
	if (Object.keys(resultados).length) d.resultados = resultados;
	if (t.segredo.trim()) d.notas = t.segredo.trim();
	if (progresso) d.progresso = progresso;
	return d;
}

/* ---------- Macro ---------- */

/* JSON com uma chave por linha e cada item de lista de objetos numa linha só: fácil de editar no Obsidian. */
function jsonLegivel(obj) {
	const linhas = Object.entries(obj).map(([chave, valor]) => {
		if (Array.isArray(valor) && valor.length) {
			return `\t${JSON.stringify(chave)}: [\n${valor.map((v) => `\t\t${JSON.stringify(v)}`).join(",\n")}\n\t]`;
		}
		return `\t${JSON.stringify(chave)}: ${JSON.stringify(valor)}`;
	});
	return `{\n${linhas.join(",\n")}\n}`;
}

/* Código da macro (sem as cercas do Markdown). */
export function macroDoTeste(teste, progresso = null) {
	return [
		"// Macro do Foundry (módulo Academia Arcana): cola numa macro do tipo Script e executa.",
		"// Cria ou atualiza o teste estendido (pelo nome), guarda na lista e mostra o painel a todos.",
		`${CHAMADA}${jsonLegivel(testeParaDesafio(teste, progresso))});`
	].join("\n");
}

/* ---------- Leitura ---------- */

function jsonDaMacro(bloco) {
	const inicio = bloco.indexOf("api.desafio(");
	if (inicio < 0) return null;
	const abre = bloco.indexOf("{", inicio);
	const fecha = bloco.lastIndexOf("}");
	return abre >= 0 && fecha > abre ? bloco.slice(abre, fecha + 1) : null;
}

const ehModelo = (v) => !v || /\{\{|^X$|^Perícia [A-C]$/i.test(v.trim());

/* Nota no formato do template "T20 - Teste Estendido", sem o bloco da macro. */
export function lerNotaDoTemplate(conteudo) {
	const md = String(conteudo ?? "").replace(/\r\n/g, "\n");
	const fm = md.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
	const campo = (nome) => fm.match(new RegExp(`^${nome}:[ \\t]*"?([^"\\n]*)"?[ \\t]*$`, "m"))?.[1]?.trim() ?? "";
	if (!/tipo_nota:\s*(teste-estendido|perigo-complexo)/.test(fm)) return null;
	const titulo = md.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "";
	const secao = (nome) => md.match(new RegExp(`^##\\s+${nome}[^\\n]*\\n([\\s\\S]*?)(?=^##\\s|(?![\\s\\S]))`, "m"))?.[1] ?? "";
	const linhaDo = (rotulo) => md.match(new RegExp(`\\*\\*${rotulo}[^*]*:\\*\\*[ \\t]*([^\\n]+)`, "i"))?.[1]?.trim() ?? "";
	const contexto = md.match(/^\*([^*\n][^\n]*?)\*\s*$/m)?.[1]?.trim() ?? "";

	const abordagens = secao("Abordagens")
		.split("\n")
		.filter((l) => /^\|/.test(l) && !/^\|\s*-+/.test(l) && !/^\|\s*Perícia\s*\|/i.test(l))
		.map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
		.filter(([pericia]) => !ehModelo(pericia))
		.map(([pericia, cd, desc]) => `${pericia} | ${ehModelo(cd) ? "" : cd} | ${desc ?? ""}`.replace(/\s+\|\s*$/, ""));

	const eventos = secao("Eventos por falha")
		.split("\n")
		.map((l) => l.match(/^\d+\.\s*(?:[^:]+:)?\s*(.*)$/)?.[1]?.trim())
		.filter(Boolean);

	const resultado = secao("Resultado");
	const res = (rotulo) => resultado.match(new RegExp(`\\*\\*${rotulo}[^*]*:\\*\\*[ \\t]*([^\\n]*)`, "i"))?.[1]?.trim() ?? "";

	const cd = Number(campo("cd"));
	const principais = linhaDo("Perícias principais");
	const alternativas = linhaDo("Perícias alternativas");
	return {
		...testeEmBranco(),
		titulo: ehModelo(titulo) ? "" : titulo,
		contexto: contexto.startsWith("O que está em jogo") ? "" : contexto,
		cd: campo("cd") !== "" && Number.isFinite(cd) ? cd : null,
		sucessosNecessarios: Number(campo("sucessos_necessarios")) || 4,
		falhasLimite: Number(campo("falhas_limite")) || 3,
		intervalo: campo("intervalo") || testeEmBranco().intervalo,
		principais: ehModelo(principais) || /Perícia A/.test(principais) ? "" : principais,
		alternativas: ehModelo(alternativas) || /Perícia C/.test(alternativas) ? "" : alternativas,
		abordagens: abordagens.length ? abordagens.join("\n") : testeEmBranco().abordagens,
		eventos: eventos.join("\n"),
		total: res("Sucesso total"),
		parcial: res("Sucesso parcial"),
		fracasso: res("Fracasso")
	};
}

/* Lê os testes de uma nota do Obsidian (blocos de macro), de um JSON puro ou de uma nota do template. */
export function lerDoVault(conteudo, origem = "") {
	const bruto = String(conteudo ?? "");
	const blocos = [];
	for (const m of bruto.matchAll(/```(?:js|javascript)[^\n]*\n([\s\S]*?)```/g)) {
		const json = jsonDaMacro(m[1]);
		if (json) blocos.push(json);
	}
	if (!blocos.length) {
		const solto = jsonDaMacro(bruto) ?? (bruto.trim().startsWith("{") ? bruto : null);
		if (solto) blocos.push(solto);
	}
	const titulo = bruto.match(/^#\s+(.+)$/m)?.[1]?.trim();
	const testes = [];
	const erros = [];
	for (const bloco of blocos) {
		try {
			const dados = JSON.parse(bloco);
			for (const d of Array.isArray(dados) ? dados : [dados]) {
				const teste = desafioParaTeste({ ...d, nome: d.nome || d.titulo || titulo });
				testes.push({ teste, progresso: d.progresso ?? null });
			}
		} catch (erro) {
			erros.push(`${origem || "texto colado"}: ${erro.message}`);
		}
	}
	if (!blocos.length) {
		const doTemplate = lerNotaDoTemplate(bruto);
		if (doTemplate) testes.push({ teste: doTemplate, progresso: null });
	}
	return { testes, erros };
}

/* ---------- Exportação: nota completa no formato do template ---------- */

export function exportarNota(teste, progresso = null) {
	const complexo = teste.tipo === "complexo";
	const meta = complexo ? (teste.rodadas ? `**${teste.rodadas} rodadas**` : "**sem limite de rodadas**") : `**${teste.sucessosNecessarios} sucessos antes de ${teste.falhasLimite} falhas**`;
	const linhas = [
		"---",
		"cssclasses:",
		"  - t20-livro",
		`tipo_nota: ${complexo ? "perigo-complexo" : "teste-estendido"}`,
		"sistema: Tormenta20",
		`cd: ${teste.cd ?? ""}`,
		`sucessos_necessarios: ${teste.sucessosNecessarios}`,
		`falhas_limite: ${teste.falhasLimite}`,
		`intervalo: "${teste.intervalo.replace(/"/g, "'")}"`,
		"tags:",
		`  - t20/${complexo ? "perigo/complexo" : "teste-estendido"}`,
		"---",
		`# ${teste.titulo || "Teste estendido"}`,
		"",
		`> [!t20-teste] ${complexo ? "Perigo complexo" : "Teste Estendido"} — CD ${teste.cd ?? "do plano"} · ${meta}`
	];
	if (teste.principais.trim()) linhas.push(`> **Perícias principais:** ${teste.principais.trim()}`);
	if (teste.alternativas.trim()) linhas.push(`> **Perícias alternativas (CD +5):** ${teste.alternativas.trim()}`);
	if (teste.intervalo.trim()) linhas.push(`> **Cada teste representa:** ${teste.intervalo.trim()}`);
	linhas.push("");
	if (teste.contexto.trim()) linhas.push(`*${teste.contexto.trim()}*`, "");
	const abordagens = abordagensEmLinhas(teste.abordagens, teste.cd ?? "");
	if (abordagens.length) {
		linhas.push("## Abordagens", "", "| Perícia | CD | Descrição da abordagem |", "| --- | --- | --- |");
		for (const linha of String(teste.abordagens).split(/\r?\n/).filter((l) => l.trim())) {
			const [pericia = "", cd = "", ...resto] = linha.split("|").map((p) => p.trim());
			linhas.push(`| ${pericia} | ${cd || (teste.cd ?? "")} | ${resto.join(" | ")} |`);
		}
		linhas.push("");
	}
	if (teste.regras.trim()) linhas.push("## Regras especiais", "", ...teste.regras.split(/\r?\n/).filter((l) => l.trim()).map((l) => `- ${l.trim()}`), "");
	if (complexo && (teste.trilhas.trim() || teste.marcadores.trim())) {
		linhas.push("## Trilhas e marcadores", "");
		for (const t of trilhasEmLinhas(teste.trilhas)) linhas.push(`- **${t.nome}:** meta ${t.meta}${t.dica ? `. ${t.dica}` : ""}`);
		for (const m of marcadoresEmLinhas(teste.marcadores)) linhas.push(`- **${m.nome}** (marcador)${m.dica ? `: ${m.dica}` : ""}`);
		linhas.push("");
	}
	if (!complexo) {
		linhas.push("## Progresso", "", "| Sucessos | Falhas |", "| --- | --- |", `| ${"☐ ".repeat(teste.sucessosNecessarios).trim()} | ${"☐ ".repeat(teste.falhasLimite).trim()} |`, "");
	}
	const eventos = teste.eventos.split(/\r?\n/).filter((l) => l.trim());
	if (eventos.length) linhas.push("## Eventos por falha", "", ...eventos.map((e, i) => `${i + 1}. ${e.trim()}`), "");
	if (teste.total.trim() || teste.parcial.trim() || teste.fracasso.trim()) {
		linhas.push("## Resultado", "", `- **Sucesso total:** ${teste.total.trim()}`, `- **Sucesso parcial (venceu com ${Math.max(0, teste.falhasLimite - 1)} falhas):** ${teste.parcial.trim()}`, `- **Fracasso:** ${teste.fracasso.trim()}`, "");
	}
	if (teste.segredo.trim()) linhas.push("## Notas do mestre", "", teste.segredo.trim(), "");
	linhas.push(
		"## Macro do Foundry",
		"",
		"Copie o bloco abaixo pelo botão no canto (modo de leitura), cole numa macro do tipo **Script** e execute. Ou importe esta nota pelo editor do teste estendido do módulo *Academia Arcana*.",
		"",
		"```js",
		macroDoTeste(teste, progresso),
		"```",
		""
	);
	return linhas.join("\n");
}

export function nomeDeArquivo(teste) {
	return `${(teste.titulo || "Teste estendido").replace(/[\\/:*?"<>|]/g, "").trim()}.md`;
}

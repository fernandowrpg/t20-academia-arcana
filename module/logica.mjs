import { DISCIPLINAS, OFICIO_LIVRE, OFICIOS_T20, PERICIAS_T20, ROMANOS, SITUACOES, slug } from "./data/disciplinas.mjs";

const REGEX_SERIE = new RegExp(`^(.*\\S)\\s+(${ROMANOS.slice(1).reverse().join("|")})$`);

export function configPadrao() {
	return { ocultas: [], ofertas: [], pericias: {}, professores: {}, personalizadas: [] };
}

export function novoAluno() {
	return {
		versao: 1,
		gremio: "",
		ingresso: "",
		bolsista: false,
		situacaoCurso: "ativo",
		semestres: [],
		quatroElementos: { vento: false, agua: false, terra: false, fogo: false },
		anotacoes: "",
		confirmaLeitura: true,
		vantagens: [],
		recompensas: [],
		npc: null
	};
}

export function novoSemestre(numero) {
	return { numero, ano: "", status: "matricula", disciplinas: [], observacoes: "" };
}

export function identificarSerie(nome) {
	const m = REGEX_SERIE.exec(String(nome).trim());
	if (!m) return { serie: null, nivel: null };
	return { serie: slug(m[1]), nivel: ROMANOS.indexOf(m[2]) };
}

export function normalizarPersonalizada(d) {
	const nome = String(d.nome ?? "").trim();
	const prereqs = Array.isArray(d.prereqs)
		? d.prereqs
		: String(d.prereqs ?? "")
				.split(",")
				.map((p) => slug(p))
				.filter(Boolean);
	return {
		id: d.id || slug(nome),
		nome,
		pericia: PERICIAS_T20[d.pericia] ? d.pericia : "conh",
		prereqs,
		professor: String(d.professor ?? "").trim(),
		especial: !!d.especial
	};
}

export function montarCatalogo(config = configPadrao()) {
	const ocultas = new Set(config.ocultas ?? []);
	const mapa = new Map();
	const base = DISCIPLINAS.map((d) => ({ ...d, personalizada: false }));
	const extras = (config.personalizadas ?? [])
		.map(normalizarPersonalizada)
		.filter((d) => d.nome)
		.map((d) => ({ ...d, personalizada: true }));
	for (const d of [...base, ...extras]) {
		if (ocultas.has(d.id)) continue;
		const pericia = PERICIAS_T20[config.pericias?.[d.id]] ? config.pericias[d.id] : d.pericia;
		/* O professor de uma disciplina do livro pode ser trocado pelo mestre; as da mesa guardam o próprio. */
		const trocado = config.professores?.[d.id];
		const professor = !d.personalizada && typeof trocado === "string" ? trocado : d.professor;
		mapa.set(d.id, { ...d, pericia, professor, ...identificarSerie(d.nome) });
	}
	return mapa;
}

export function nomePericia(chave, rotulos = {}) {
	return rotulos[chave] ?? PERICIAS_T20[chave] ?? chave;
}

export function ordenarPericias(chaves, rotulos = {}) {
	return [...new Set(chaves)].sort((a, b) => nomePericia(a, rotulos).localeCompare(nomePericia(b, rotulos), "pt-BR"));
}

export function periciasDoCatalogo(catalogo) {
	return ordenarPericias([...catalogo.values()].map((d) => d.pericia));
}

export function periciaEfetiva(entrada) {
	if (entrada.pericia === OFICIO_LIVRE) return entrada.oficio || OFICIO_LIVRE;
	return entrada.pericia;
}

export function oficiosDisponiveis(periciasDoAtor = {}) {
	const rotulos = {};
	const chaves = [...OFICIOS_T20];
	for (const [chave, dados] of Object.entries(periciasDoAtor)) {
		if (/^ofi[1-9]$/.test(chave)) {
			chaves.push(chave);
			rotulos[chave] = dados?.label || chave;
		}
	}
	return { chaves: ordenarPericias(chaves, rotulos), rotulos };
}

export function preRequisitos(disc, catalogo) {
	const ids = new Set((disc.prereqs ?? []).filter((id) => catalogo.has(id)));
	if (disc.serie && disc.nivel) {
		for (const d of catalogo.values()) {
			if (d.serie === disc.serie && d.nivel && d.nivel < disc.nivel) ids.add(d.id);
		}
	}
	ids.delete(disc.id);
	return [...ids];
}

export function aprovadas(aluno, ateIndice = Infinity) {
	const ids = new Set();
	aluno.semestres.forEach((s, i) => {
		if (i >= ateIndice) return;
		for (const d of s.disciplinas) if (d.situacao === "aprovado") ids.add(d.id);
	});
	return ids;
}

export function avaliarDisciplina(disc, aluno, indice, catalogo, ofertas = new Set()) {
	const semestre = aluno.semestres[indice];
	const jaAprovadas = aprovadas(aluno, indice);
	if (jaAprovadas.has(disc.id)) return { estado: "aprovada", motivo: "Já aprovada em semestre anterior" };
	if (semestre?.disciplinas.some((d) => d.id === disc.id)) return { estado: "matriculada", motivo: "Matriculada neste semestre" };
	if (disc.especial && !ofertas.has(disc.id)) return { estado: "bloqueada", motivo: "Disciplina especial: não ofertada neste semestre" };
	const faltando = preRequisitos(disc, catalogo).filter((id) => !jaAprovadas.has(id));
	if (faltando.length) {
		const nomes = faltando.map((id) => catalogo.get(id)?.nome ?? id);
		return { estado: "bloqueada", motivo: `Requer: ${nomes.join(", ")}`, faltando };
	}
	return { estado: "disponivel", motivo: "Disponível para matrícula" };
}

export function periciasPredominantes(semestre) {
	if (!semestre?.disciplinas.length) return [];
	const contagem = new Map();
	for (const d of semestre.disciplinas) {
		if (d.situacao === "trancado") continue;
		const chave = periciaEfetiva(d);
		contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
	}
	const max = Math.max(0, ...contagem.values());
	if (!max) return [];
	return [...contagem.entries()].filter(([, n]) => n === max).map(([chave]) => chave);
}

/* Nota que vale para a média: a lançada mais o ponto extra de atividade extracurricular, até 10. */
export function notaFinal(d) {
	if (typeof d?.nota !== "number" || !Number.isFinite(d.nota)) return null;
	return Math.min(10, d.nota + (Number(d.extra) || 0));
}

function notasValidas(disciplinas) {
	return disciplinas.map(notaFinal).filter((n) => n !== null);
}

export function media(disciplinas) {
	const notas = notasValidas(disciplinas);
	if (!notas.length) return null;
	return Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 100) / 100;
}

export function estatisticas(aluno) {
	const todas = aluno.semestres.flatMap((s) => s.disciplinas);
	const encerradas = aluno.semestres.filter((s) => s.status === "encerrado").flatMap((s) => s.disciplinas);
	const contar = (sit) => todas.filter((d) => d.situacao === sit).length;
	return {
		semestresCursados: aluno.semestres.filter((s) => s.status !== "matricula").length,
		aprovadas: contar("aprovado"),
		reprovadas: contar("reprovado"),
		trancadas: contar("trancado"),
		cursando: contar("cursando") + contar("recuperacao"),
		coeficiente: media(encerradas)
	};
}

export function aprovadasPorPericia(aluno) {
	const contagem = new Map();
	for (const s of aluno.semestres) {
		for (const d of s.disciplinas) {
			if (d.situacao !== "aprovado") continue;
			const chave = periciaEfetiva(d);
			contagem.set(chave, (contagem.get(chave) ?? 0) + 1);
		}
	}
	return [...contagem.entries()].map(([chave, quantidade]) => ({ chave, quantidade }));
}

export function pendenciasParaEncerrar(semestre) {
	return semestre.disciplinas.filter((d) => d.situacao === "cursando" || d.situacao === "recuperacao");
}

export function rotuloSituacao(situacao) {
	return SITUACOES[situacao] ?? situacao;
}

export function formatarNota(n) {
	return n === null || n === undefined ? "—" : Number(n).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function semestreComNotas(aluno) {
	for (let i = aluno.semestres.length - 1; i >= 0; i--) {
		const s = aluno.semestres[i];
		if (s.status !== "matricula" && s.disciplinas.length) return s;
	}
	return null;
}

export function resumoNotas(aluno) {
	const semestre = semestreComNotas(aluno);
	if (!semestre) return null;
	const contar = (...situacoes) => semestre.disciplinas.filter((d) => situacoes.includes(d.situacao)).length;
	return {
		numero: semestre.numero,
		status: semestre.status,
		media: media(semestre.disciplinas),
		aprovadas: contar("aprovado"),
		reprovadas: contar("reprovado"),
		pendentes: contar("cursando", "recuperacao"),
		disciplinas: semestre.disciplinas.map((d) => ({ id: d.id, nome: d.nome, nota: notaFinal(d), situacao: d.situacao }))
	};
}

export function faixaRecurso(valor, max) {
	if (valor <= 0) return "caido";
	if (max <= 0 || valor >= max) return "ileso";
	const fracao = valor / max;
	if (fracao <= 0.25) return "critico";
	if (fracao <= 0.5) return "ferido";
	return "leve";
}

export function recurso(dados) {
	if (!dados || typeof dados !== "object") return null;
	const valor = Number(dados.value) || 0;
	const max = Number(dados.max) || 0;
	const temp = Number(dados.temp) || 0;
	const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((valor / max) * 100))) : 0;
	return { valor, max, temp, pct, faixa: faixaRecurso(valor, max) };
}

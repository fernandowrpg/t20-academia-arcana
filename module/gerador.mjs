import { ATRIBUTOS, CLASSES, DISTRIBUICOES, NIVEL_MAXIMO, NOMES, RACAS } from "./data/alunos.mjs";
import { GREMIOS, OFICIO_LIVRE, OFICIOS_T20 } from "./data/disciplinas.mjs";
import { avaliarDisciplina, novoAluno, novoSemestre, pendenciasParaEncerrar, periciaEfetiva, preRequisitos } from "./logica.mjs";

const NOTA_MINIMA = 6;
const SITUACOES_ESTUDADAS = new Set(["aprovado", "cursando", "recuperacao"]);

export function sortear(lista, rng = Math.random) {
	return lista[Math.floor(rng() * lista.length)];
}

export function sortearPorPeso(itens, peso, rng = Math.random) {
	const total = itens.reduce((soma, item) => soma + peso(item), 0);
	let alvo = rng() * total;
	for (const item of itens) {
		alvo -= peso(item);
		if (alvo < 0) return item;
	}
	return itens.at(-1);
}

export function gerarNome(raca, usados = new Set(), rng = Math.random) {
	const tabela = NOMES[sortear(RACAS[raca]?.nomes ?? ["humano"], rng)];
	const livres = tabela.filter((n) => !usados.has(n));
	if (livres.length) return sortear(livres, rng);
	for (let i = 0; i < 60; i++) {
		const nome = `${sortear(tabela, rng)} ${sortear(tabela, rng)}`;
		if (!usados.has(nome)) return nome;
	}
	let n = 2;
	const base = sortear(tabela, rng);
	while (usados.has(`${base} ${n}`)) n++;
	return `${base} ${n}`;
}

export function descricaoNpc(npc) {
	if (!npc) return "";
	return `${RACAS[npc.raca]?.nome ?? npc.raca} · ${CLASSES[npc.classe]?.nome ?? npc.classe} ${npc.nivel}`;
}

/* O atributo de foco da classe recebe o valor mais alto; os demais são embaralhados. */
export function sortearAtributos(classe, rng = Math.random) {
	const [maior, ...resto] = sortear(DISTRIBUICOES, rng);
	const foco = CLASSES[classe]?.foco ?? "int";
	const atributos = {};
	for (const chave of Object.keys(ATRIBUTOS)) {
		atributos[chave] = chave === foco ? maior : resto.splice(Math.floor(rng() * resto.length), 1)[0];
	}
	return atributos;
}

/* Cada nível rende ao menos 1 PV, como no sistema. */
export function pontosDaClasse(classe, nivel, con = 0) {
	const dados = CLASSES[classe];
	if (!dados) return { pv: 0, pm: 0 };
	const primeiro = Math.max(dados.pv[0] + con, 1);
	const demais = Math.max(dados.pv[1] + con, 1) * (nivel - 1);
	return { pv: primeiro + demais, pm: dados.pm * nivel };
}

function focosDeEstudo(classe, pericias, rng) {
	const focos = new Set(CLASSES[classe]?.arcana ? ["mist"] : []);
	const quantidade = 2 + Math.floor(rng() * 2);
	const opcoes = pericias.filter((p) => !focos.has(p));
	while (focos.size < quantidade && opcoes.length) focos.add(opcoes.splice(Math.floor(rng() * opcoes.length), 1)[0]);
	return [...focos];
}

export function matricularAleatorio(aluno, { catalogo, ofertas = new Set(), preferidas = new Set(), min = 3, max = 6, rng = Math.random } = {}) {
	const indice = aluno.semestres.length - 1;
	const semestre = aluno.semestres[indice];
	if (!semestre) return [];
	const focos = new Set(aluno.npc?.focos ?? []);
	let quantidade = (min || 3) + Math.floor(rng() * 3);
	if (max > 0) quantidade = Math.min(quantidade, max);
	while (semestre.disciplinas.length < quantidade) {
		const disponiveis = [...catalogo.values()].filter((d) => avaliarDisciplina(d, aluno, indice, catalogo, ofertas).estado === "disponivel");
		if (!disponiveis.length) break;
		const disc = sortearPorPeso(disponiveis, (d) => (focos.has(d.pericia) ? 5 : 1) * (d.nivel > 1 ? 2 : 1) * (preferidas.has(d.id) ? 8 : 1), rng);
		semestre.disciplinas.push({
			id: disc.id,
			nome: disc.nome,
			pericia: disc.pericia,
			oficio: disc.pericia === OFICIO_LIVRE ? sortear(OFICIOS_T20, rng) : null,
			nota: null,
			situacao: "cursando"
		});
	}
	return semestre.disciplinas;
}

export function concluirAleatorio(aluno, semestre, rng = Math.random) {
	const aptidao = aluno.npc?.aptidao ?? 7;
	for (const d of pendenciasParaEncerrar(semestre)) {
		const nota = Math.max(0, Math.min(10, Math.round((aptidao + (rng() * 5 - 2.5)) * 2) / 2));
		d.nota = nota;
		d.situacao = nota >= NOTA_MINIMA ? "aprovado" : "reprovado";
	}
}

export function periciasEstudadas(aluno) {
	const chaves = new Set();
	for (const s of aluno.semestres) {
		for (const d of s.disciplinas) {
			if (!SITUACOES_ESTUDADAS.has(d.situacao)) continue;
			const chave = periciaEfetiva(d);
			if (chave !== OFICIO_LIVRE) chaves.add(chave);
		}
	}
	return [...chaves];
}

export function gerarAluno({
	nivel = 1,
	raca = null,
	classe = null,
	periodo = null,
	usados = new Set(),
	catalogo,
	ofertas = new Set(),
	preferidas = new Set(),
	min = 3,
	max = 6,
	semestresRegulares = 8,
	rng = Math.random
} = {}) {
	nivel = Math.max(1, Math.min(NIVEL_MAXIMO, Math.round(Number(nivel)) || 1));
	if (!RACAS[raca]) raca = sortearPorPeso(Object.keys(RACAS), (r) => RACAS[r].peso, rng);
	if (!CLASSES[classe]) classe = sortearPorPeso(Object.keys(CLASSES), (c) => CLASSES[c].peso, rng);
	periodo = Math.round(Number(periodo));
	if (!(periodo >= 1 && periodo <= semestresRegulares)) periodo = 1 + Math.floor(rng() * semestresRegulares);

	const nome = gerarNome(raca, usados, rng);
	const atributos = sortearAtributos(classe, rng);
	const pericias = [...new Set([...catalogo.values()].map((d) => d.pericia))];
	const aluno = novoAluno();
	aluno.gremio = sortear(Object.keys(GREMIOS), rng);
	aluno.bolsista = rng() < 0.2;
	aluno.npc = {
		raca,
		classe,
		nivel,
		focos: focosDeEstudo(classe, pericias, rng),
		aptidao: Math.round((5.5 + rng() * 3) * 10) / 10
	};
	/* Nos semestres já cursados, o NPC tende a fazer os pré-requisitos das disciplinas atuais dos personagens. */
	const caminho = new Set([...preferidas].flatMap((id) => (catalogo.has(id) ? preRequisitos(catalogo.get(id), catalogo) : [])));
	for (let numero = 1; numero <= periodo; numero++) {
		const semestre = novoSemestre(numero);
		aluno.semestres.push(semestre);
		matricularAleatorio(aluno, { catalogo, ofertas, preferidas: numero === periodo ? preferidas : caminho, min, max, rng });
		if (numero < periodo) {
			concluirAleatorio(aluno, semestre, rng);
			semestre.status = "encerrado";
		} else {
			semestre.status = "cursando";
		}
	}
	return { nome, raca, classe, nivel, periodo, atributos, ...pontosDaClasse(classe, nivel, atributos.con), aluno, pericias: periciasEstudadas(aluno) };
}

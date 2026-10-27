import { ATRIBUTOS, CLASSES, DISTRIBUICOES, GRAUS_PARCEIRO, NIVEL_MAXIMO, NOMES, PARCEIROS, RACAS } from "./data/alunos.mjs";
import { GREMIOS, OFICIO_LIVRE, OFICIOS_T20 } from "./data/disciplinas.mjs";
import { avaliarDisciplina, nomePericia, novoAluno, novoSemestre, pendenciasParaEncerrar, periciaEfetiva, preRequisitos } from "./logica.mjs";

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

/* Compra aleatória com o maior valor no atributo de foco da classe; depois, +2 no foco e +1 em outros dois. */
export function sortearAtributos(classe, rng = Math.random) {
	const [maior, ...resto] = sortear(DISTRIBUICOES, rng);
	const foco = CLASSES[classe]?.foco ?? "int";
	const chaves = Object.keys(ATRIBUTOS);
	const base = {};
	for (const chave of chaves) base[chave] = chave === foco ? maior : resto.splice(Math.floor(rng() * resto.length), 1)[0];
	const outros = chaves.filter((chave) => chave !== foco);
	const premiados = [outros.splice(Math.floor(rng() * outros.length), 1)[0], outros.splice(Math.floor(rng() * outros.length), 1)[0]];
	const bonus = Object.fromEntries(chaves.map((chave) => [chave, chave === foco ? 2 : premiados.includes(chave) ? 1 : 0]));
	const total = Object.fromEntries(chaves.map((chave) => [chave, base[chave] + bonus[chave]]));
	return { base, bonus, total };
}

/* O grau do parceiro acompanha o patamar do aluno: até o 4º nível, do 5º ao 10º e do 11º em diante. */
export function grauParceiro(nivel) {
	return nivel >= 11 ? 2 : nivel >= 5 ? 1 : 0;
}

export function descricaoParceiro(npc) {
	const tipo = PARCEIROS[npc?.parceiro];
	if (!tipo) return null;
	const grau = grauParceiro(npc.nivel);
	return { tipo: tipo.nome, grau: GRAUS_PARCEIRO[grau], beneficio: tipo.graus[grau], rotulo: `${tipo.nome} ${GRAUS_PARCEIRO[grau]}` };
}

/* O NPC gerado sobe um nível a cada novo semestre. */
export function subirNivel(aluno) {
	if (aluno.npc) aluno.npc.nivel = Math.min(NIVEL_MAXIMO, (Number(aluno.npc.nivel) || 0) + 1);
}

const RESUMO_ABRE = '<section class="aa-resumo-npc">';
const RESUMO_FECHA = "</section>";

export function resumoNpc(aluno) {
	const npc = aluno.npc;
	if (!npc) return "";
	const atual = aluno.semestres.at(-1);
	const pericias = periciasEstudadas(aluno).map((p) => nomePericia(p)).sort((a, b) => a.localeCompare(b, "pt-BR"));
	const parceiro = descricaoParceiro(npc);
	return [
		RESUMO_ABRE,
		`<p><strong>Aluno da Academia Arcana.</strong> ${RACAS[npc.raca]?.nome ?? npc.raca}, ${CLASSES[npc.classe]?.nome ?? npc.classe} de ${npc.nivel}º nível${CLASSES[npc.classe] ? ` (${CLASSES[npc.classe].livro})` : ""}.</p>`,
		`<p><strong>Período:</strong> ${atual?.numero ?? "—"}º semestre · <strong>Grêmio:</strong> ${GREMIOS[aluno.gremio]?.nome ?? "—"}${aluno.bolsista ? " · bolsista" : ""}</p>`,
		parceiro ? `<p><strong>Como parceiro:</strong> ${parceiro.rotulo} (${parceiro.beneficio}).</p>` : "",
		`<p><strong>Perícias estudadas:</strong> ${pericias.join(", ") || "—"}</p>`,
		`<p><strong>Disciplinas do semestre:</strong> ${atual?.disciplinas.map((d) => d.nome).join(", ") || "—"}</p>`,
		RESUMO_FECHA
	].join("");
}

/* Troca só o bloco gerado pelo módulo, preservando o que o mestre escreveu na biografia. */
export function atualizarResumoNpc(biografia, aluno) {
	const texto = String(biografia ?? "");
	const inicio = texto.indexOf(RESUMO_ABRE);
	const fim = inicio < 0 ? -1 : texto.indexOf(RESUMO_FECHA, inicio);
	if (fim < 0) return null;
	return texto.slice(0, inicio) + resumoNpc(aluno) + texto.slice(fim + RESUMO_FECHA.length);
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

/* Perícias que ficam treinadas na ficha do NPC: as de todas as matrículas, passadas e atuais, mas só depois que o aluno já avançou algum semestre. */
export function periciasTreinadas(aluno) {
	if ((aluno?.semestres?.length ?? 0) < 2) return [];
	const chaves = new Set();
	for (const s of aluno.semestres) {
		for (const d of s.disciplinas) {
			if (d.situacao === "trancado") continue;
			const chave = periciaEfetiva(d);
			if (chave !== OFICIO_LIVRE) chaves.add(chave);
		}
	}
	return [...chaves];
}

export function gerarAluno({
	nivel = null,
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
	if (!RACAS[raca]) raca = sortearPorPeso(Object.keys(RACAS), (r) => RACAS[r].peso, rng);
	if (!CLASSES[classe]) classe = sortearPorPeso(Object.keys(CLASSES), (c) => CLASSES[c].peso, rng);
	/* Nível e período andam juntos: o que não for informado é deduzido do outro. */
	nivel = Math.round(Number(nivel));
	periodo = Math.round(Number(periodo));
	const temNivel = nivel >= 1;
	if (temNivel) nivel = Math.min(NIVEL_MAXIMO, nivel);
	if (!(periodo >= 1 && periodo <= semestresRegulares)) periodo = temNivel ? Math.min(nivel, semestresRegulares) : 1 + Math.floor(rng() * semestresRegulares);
	if (!temNivel) nivel = periodo;

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
		parceiro: sortear(CLASSES[classe].parceiros, rng),
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
	return { nome, raca, classe, nivel, periodo, atributos, ...pontosDaClasse(classe, nivel, atributos.total.con), aluno, pericias: periciasEstudadas(aluno) };
}

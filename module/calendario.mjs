import { DIAS_DE_FOLGA, DIAS_LETIVOS, TURNOS } from "./data/alunos.mjs";
import { periciaEfetiva } from "./logica.mjs";

/* ---------------------------------------------------------------- */
/* Calendário de Arton                                               */
/* ---------------------------------------------------------------- */

export const DIAS_DA_SEMANA = [...DIAS_LETIVOS, ...DIAS_DE_FOLGA];

export const DEUSES_DOS_DIAS = {
	Valk: "Valkaria, a Deusa da Humanidade",
	Hedryl: "antigo nome de Khalmyr",
	Luna: "antigo nome de Lena",
	Astar: "o nome feérico de Azgher",
	Dallia: "o nome élfico de Wynna",
	Haya: "Marah para as fadas · dia de festas e diversão",
	Leen: "antiga faceta de Ragnar · o \u201cdescanso dos mortos\u201d"
};

/* Os doze meses, de Caravana (início da primavera) a Pyra (fim do inverno e do ano). */
export const MESES = [
	{ nome: "Caravana", estacao: "Primavera", sobre: "Em homenagem aos refugiados de Lamnor. Muitas caravanas partem em suas rotas." },
	{ nome: "Pomo", estacao: "Primavera", sobre: "As plantações começam a crescer." },
	{ nome: "Keenvia", estacao: "Primavera", sobre: "Em honra a Keenn, antigo Deus da Guerra. Exércitos partem para suas marchas e batalhas." },
	{ nome: "Sirravia", estacao: "Verão", sobre: "Homenagem a Sirrannamena, a Rainha Barda, primeira grande monarca da humanidade." },
	{ nome: "Vigília", estacao: "Verão", sobre: "Azgher, o Deus-Sol, fica alto no céu, observando tudo." },
	{ nome: "Prussvia", estacao: "Verão", sobre: "Encerra a estação mais quente. Menção a Roramar Pruss, fundador do Reinado, e à família real." },
	{ nome: "Ceifa", estacao: "Outono", sobre: "Início da colheita, época de muito trabalho nos campos." },
	{ nome: "Contenda", estacao: "Outono", sobre: "Antes dedicado a duelos; hoje recebe importantes julgamentos em castelos e tribunais." },
	{ nome: "Clausura", estacao: "Outono", sobre: "Os camponeses se preparam para o inverno, recolhendo comida e lenha." },
	{ nome: "Pharstyth", estacao: "Inverno", sobre: "Os ventos frios começam a soprar. Alude à mítica arquimaga do estreito entre os continentes." },
	{ nome: "Véu", estacao: "Inverno", sobre: "Noites longas; homenagem a Tenebra, mais poderosa nesta época." },
	{ nome: "Pyra", estacao: "Inverno", sobre: "Alusão a Thyatis, Deus das Segundas Chances. Queimam-se coisas antigas e fazem-se profecias em piras divinatórias." }
];

/* Cada mês tem quatro semanas completas, então sempre começa em Valk. */
export const SEMANAS_POR_MES = 4;
export const DIAS_POR_MES = SEMANAS_POR_MES * DIAS_DA_SEMANA.length;
export const DATA_INICIAL = { ano: 1420, mes: 0, dia: 1 };

export function normalizarData(data) {
	const ano = Number.isInteger(Number(data?.ano)) ? Number(data.ano) : DATA_INICIAL.ano;
	const mes = Math.min(MESES.length - 1, Math.max(0, Math.trunc(Number(data?.mes)) || 0));
	const dia = Math.min(DIAS_POR_MES, Math.max(1, Math.trunc(Number(data?.dia)) || 1));
	return { ano, mes, dia };
}

/* Soma (ou subtrai) dias, virando meses e anos. */
export function somarDias(data, dias) {
	const d = normalizarData(data);
	const porAno = DIAS_POR_MES * MESES.length;
	let total = d.ano * porAno + d.mes * DIAS_POR_MES + (d.dia - 1) + Math.trunc(dias);
	const ano = Math.floor(total / porAno);
	total -= ano * porAno;
	return { ano, mes: Math.floor(total / DIAS_POR_MES), dia: (total % DIAS_POR_MES) + 1 };
}

export function diaDaSemana(data) {
	return (normalizarData(data).dia - 1) % DIAS_DA_SEMANA.length;
}

export function rotuloData(data, { semana = true } = {}) {
	const d = normalizarData(data);
	const texto = `${d.dia} de ${MESES[d.mes].nome} de ${d.ano}`;
	return semana ? `${DIAS_DA_SEMANA[diaDaSemana(d)]}, ${texto}` : texto;
}

/* As sete datas da semana que contém a data, de Valk a Leen. */
export function semanaDe(data) {
	const inicio = somarDias(data, -diaDaSemana(data));
	return DIAS_DA_SEMANA.map((nome, i) => ({ nome, data: somarDias(inicio, i) }));
}

export const TOTAL_HORARIOS = DIAS_LETIVOS.length * TURNOS.length;

export function rotuloHorario(horario) {
	return `${DIAS_LETIVOS[Math.floor(horario / TURNOS.length)]} · ${TURNOS[horario % TURNOS.length]}`;
}

export function semestreVigente(aluno) {
	if (aluno.situacaoCurso !== "ativo") return null;
	const atual = aluno.semestres.at(-1);
	return atual && atual.status !== "encerrado" ? atual : null;
}

/* participantes: [{ id, nome, pc, aluno }]. Devolve as turmas do período, uma por disciplina. */
export function montarTurmas(participantes) {
	const turmas = new Map();
	for (const p of participantes) {
		const semestre = semestreVigente(p.aluno);
		if (!semestre) continue;
		for (const d of semestre.disciplinas) {
			if (d.situacao === "trancado") continue;
			if (!turmas.has(d.id)) turmas.set(d.id, { id: d.id, nome: d.nome, pericia: periciaEfetiva(d), alunos: [] });
			turmas.get(d.id).alunos.push(p);
		}
	}
	return [...turmas.values()].sort((a, b) => b.alunos.length - a.alunos.length || a.id.localeCompare(b.id));
}

/* Mantém os horários salvos e encaixa as demais turmas onde há menos choque de alunos. */
export function distribuirHorarios(turmas, salvos = {}) {
	const horarios = {};
	const ocupados = new Map();
	const carga = new Array(TOTAL_HORARIOS).fill(0);
	const reservar = (turma, horario) => {
		horarios[turma.id] = horario;
		carga[horario]++;
		for (const a of turma.alunos) {
			if (!ocupados.has(a.id)) ocupados.set(a.id, new Set());
			ocupados.get(a.id).add(horario);
		}
	};
	const pendentes = [];
	for (const turma of turmas) {
		const salvo = salvos?.[turma.id];
		if (Number.isInteger(salvo) && salvo >= 0 && salvo < TOTAL_HORARIOS) reservar(turma, salvo);
		else pendentes.push(turma);
	}
	for (const turma of pendentes) {
		let melhor = 0;
		let menor = Infinity;
		for (let h = 0; h < TOTAL_HORARIOS; h++) {
			const choques = turma.alunos.filter((a) => ocupados.get(a.id)?.has(h)).length;
			const custo = choques * 1000 + carga[h];
			if (custo < menor) {
				menor = custo;
				melhor = h;
			}
		}
		reservar(turma, melhor);
	}
	return horarios;
}

/* Alunos com mais de uma aula no mesmo horário. Devolve Map de id da turma para os nomes em choque. */
export function choquesDeHorario(turmas, horarios) {
	const porAluno = new Map();
	for (const turma of turmas) {
		for (const a of turma.alunos) {
			const chave = `${a.id}|${horarios[turma.id]}`;
			if (!porAluno.has(chave)) porAluno.set(chave, []);
			porAluno.get(chave).push({ turma, aluno: a });
		}
	}
	const choques = new Map();
	for (const lista of porAluno.values()) {
		if (lista.length < 2) continue;
		for (const { turma, aluno } of lista) {
			if (!choques.has(turma.id)) choques.set(turma.id, []);
			choques.get(turma.id).push(aluno.nome);
		}
	}
	return choques;
}

/* NPCs que dividem turma com personagens de jogadores, do mais presente para o menos. */
export function colegasDeTurma(turmas) {
	const colegas = new Map();
	for (const turma of turmas) {
		const pcs = turma.alunos.filter((a) => a.pc);
		if (!pcs.length) continue;
		for (const npc of turma.alunos.filter((a) => !a.pc)) {
			if (!colegas.has(npc.id)) colegas.set(npc.id, { ...npc, aulas: [] });
			colegas.get(npc.id).aulas.push({ id: turma.id, nome: turma.nome, pcs: pcs.map((p) => p.nome) });
		}
	}
	return [...colegas.values()].sort((a, b) => b.aulas.length - a.aulas.length || a.nome.localeCompare(b.nome, "pt-BR"));
}

/*
 * Resumo do mestre: as aulas da semana, em ordem de horário, em que os personagens se encontram.
 * alvo: "juntos" (dois ou mais personagens), "aluno:<id>" (um NPC aluno) ou "prof:<nome>" (um professor).
 * professoresDe(idDaTurma) devolve os nomes dos professores da turma.
 */
export function encontrosDaSemana(turmas, horarios, alvo, professoresDe = () => []) {
	const [tipo, chave] = alvo.split(/:(.*)/s);
	return turmas
		.filter((t) => {
			const pcs = t.alunos.filter((a) => a.pc).length;
			if (tipo === "aluno") return pcs > 0 && t.alunos.some((a) => a.id === chave);
			if (tipo === "prof") return pcs > 0 && professoresDe(t.id).includes(chave);
			return pcs > 1;
		})
		.map((t) => ({ turma: t, horario: horarios[t.id] }))
		.sort((a, b) => a.horario - b.horario || a.turma.nome.localeCompare(b.turma.nome, "pt-BR"));
}

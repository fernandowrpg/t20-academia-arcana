import { DIAS_LETIVOS, TURNOS } from "./data/alunos.mjs";
import { periciaEfetiva } from "./logica.mjs";

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

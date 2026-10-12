import { MODULO, corpoDocente, ehAluno, lerAluno, opcao, salvarAluno } from "./config.mjs";
import { enviar } from "./correio.mjs";

/* Vantagens que uma atividade extracurricular concluída pode render. Valem para uma disciplina do professor que deu a missão. */
export const VANTAGENS = {
	bonus: { nome: "Preparo", resumo: "+2 no teste de uma prova", porte: "missão simples" },
	segunda: { nome: "Segunda chamada", resumo: "refaz uma prova e fica com o melhor resultado", porte: "missão média" },
	ponto: { nome: "Ponto extra", resumo: "+1 na nota final (máximo 10)", porte: "missão difícil" }
};

export const SITUACOES_ATIVIDADE = {
	andamento: "Em andamento",
	concluida: "Concluída",
	fracasso: "Fracassou"
};

const PONTO_EXTRA = 1;

export function lerAtividades() {
	const lista = foundry.utils.deepClone(opcao("atividades") ?? []);
	return Array.isArray(lista) ? lista : [];
}

function gravar(lista) {
	return game.settings.set(MODULO, "atividades", lista);
}

/* Nomes das disciplinas lecionadas por uma ficha de professor. Vazio: a vantagem vale para qualquer disciplina. */
export function disciplinasDoProfessor(idDaFicha) {
	if (!idDaFicha) return [];
	return [...new Set(corpoDocente().filter((p) => p.actor?.id === idDaFicha).flatMap((p) => p.disciplinas))];
}

/* Vantagens ainda não usadas que servem para uma disciplina do boletim. */
export function vantagensAplicaveis(aluno, entrada) {
	if (!entrada || entrada.vantagem) return [];
	return (aluno.vantagens ?? []).filter((v) => {
		if (v.usada) return false;
		const leciona = disciplinasDoProfessor(v.professor);
		return !leciona.length || leciona.includes(entrada.nome);
	});
}

export async function criarAtividade({ titulo, descricao = "", professor = "", vantagem, alunos = [] }) {
	if (!game.user.isGM) return null;
	const nome = String(titulo ?? "").trim();
	const ids = [...new Set(alunos)].filter((id) => ehAluno(game.actors.get(id)));
	if (!nome || !VANTAGENS[vantagem] || !ids.length) return null;
	const ficha = game.actors.get(professor);
	const atividade = {
		id: foundry.utils.randomID(),
		titulo: nome,
		descricao: String(descricao ?? "").trim(),
		professor: ficha?.id ?? "",
		vantagem,
		criada: Date.now(),
		alunos: Object.fromEntries(ids.map((id) => [id, "andamento"]))
	};
	await gravar([...lerAtividades(), atividade]);
	/* O professor com ficha avisa cada aluno pelo correio. */
	if (ficha) {
		const texto = `Atividade extracurricular: ${nome}.${atividade.descricao ? `\n${atividade.descricao}` : ""}\nVantagem ao concluir: ${VANTAGENS[vantagem].nome} (${VANTAGENS[vantagem].resumo}).`;
		for (const id of ids) await enviar({ de: ficha.id, para: id, texto });
	}
	return atividade;
}

/* Ao concluir, o aluno ganha a vantagem; se a conclusão for desfeita antes do uso, ele a perde. */
export async function definirSituacao(idDaAtividade, idDoAluno, situacao) {
	if (!game.user.isGM || !SITUACOES_ATIVIDADE[situacao]) return;
	const lista = lerAtividades();
	const atividade = lista.find((a) => a.id === idDaAtividade);
	const actor = game.actors.get(idDoAluno);
	const aluno = lerAluno(actor);
	if (!atividade || !(idDoAluno in atividade.alunos) || !aluno) return;
	atividade.alunos[idDoAluno] = situacao;
	await gravar(lista);

	const vantagens = aluno.vantagens ?? [];
	const atual = vantagens.find((v) => v.atividade === atividade.id);
	if (situacao === "concluida" && !atual) {
		vantagens.push({ id: foundry.utils.randomID(), atividade: atividade.id, titulo: atividade.titulo, professor: atividade.professor, tipo: atividade.vantagem, usada: null });
	} else if (situacao !== "concluida" && atual && !atual.usada) {
		vantagens.splice(vantagens.indexOf(atual), 1);
	} else {
		return;
	}
	aluno.vantagens = vantagens;
	await salvarAluno(actor, aluno);
}

export async function excluirAtividade(idDaAtividade) {
	if (!game.user.isGM) return;
	await gravar(lerAtividades().filter((a) => a.id !== idDaAtividade));
}

/* Usa uma vantagem numa disciplina: uma por disciplina, e só de professor que a leciona. */
export async function aplicarVantagem(actor, indiceDoSemestre, indiceDaDisciplina, idDaVantagem) {
	if (!game.user.isGM) return;
	const aluno = lerAluno(actor);
	const semestre = aluno?.semestres[indiceDoSemestre];
	const entrada = semestre?.disciplinas[indiceDaDisciplina];
	const vantagem = vantagensAplicaveis(aluno ?? {}, entrada).find((v) => v.id === idDaVantagem);
	if (!vantagem) return;
	vantagem.usada = { disciplina: entrada.nome, semestre: semestre.numero };
	entrada.vantagem = { id: vantagem.id, tipo: vantagem.tipo };
	if (vantagem.tipo === "ponto") entrada.extra = PONTO_EXTRA;
	await salvarAluno(actor, aluno);
}

export async function retirarVantagem(actor, indiceDoSemestre, indiceDaDisciplina) {
	if (!game.user.isGM) return;
	const aluno = lerAluno(actor);
	const entrada = aluno?.semestres[indiceDoSemestre]?.disciplinas[indiceDaDisciplina];
	if (!entrada?.vantagem) return;
	const vantagem = (aluno.vantagens ?? []).find((v) => v.id === entrada.vantagem.id);
	if (vantagem) vantagem.usada = null;
	delete entrada.vantagem;
	delete entrada.extra;
	await salvarAluno(actor, aluno);
}

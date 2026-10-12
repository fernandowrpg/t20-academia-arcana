import { MODULO, corpoDocente, ehAluno, lerAluno, opcao, salvarAluno } from "./config.mjs";
import { enviar } from "./correio.mjs";
import { PERICIAS_T20 } from "./data/disciplinas.mjs";

/* Vantagens que uma atividade extracurricular concluída pode render. Valem para uma disciplina do professor que deu a missão. */
export const VANTAGENS = {
	bonus: { nome: "Preparo", resumo: "+2 no teste de uma prova", porte: "missão simples" },
	segunda: { nome: "Segunda chamada", resumo: "refaz uma prova e fica com o melhor resultado", porte: "missão média" },
	ponto: { nome: "Ponto extra", resumo: "+1 na nota final (máximo 10)", porte: "missão difícil" }
};

/* Recompensa extra, definida pelo mestre em cada atividade. Vale por uma cena, uma única vez. */
export const RECOMPENSAS = {
	pericia: "Perícia por uma cena",
	poder: "Poder por uma cena",
	livre: "Outra vantagem por uma cena"
};

const LIMITE_RECOMPENSA = 200;

function normalizarRecompensa(extra) {
	if (!RECOMPENSAS[extra?.tipo]) return null;
	const texto = String(extra.texto ?? "").trim().slice(0, LIMITE_RECOMPENSA);
	if (extra.tipo === "pericia") return PERICIAS_T20[extra.pericia] && extra.pericia !== "oficio" ? { tipo: "pericia", pericia: extra.pericia, texto } : null;
	return texto ? { tipo: extra.tipo, texto } : null;
}

/* Para perícia, o efeito depende da ficha: treina por uma cena quem não é treinado, e dá +2 a quem já é. */
export function descreverRecompensa(recompensa, actor = null) {
	if (!recompensa) return "";
	if (recompensa.tipo === "pericia") {
		const nome = PERICIAS_T20[recompensa.pericia] ?? recompensa.pericia;
		const treinado = actor?.system?.pericias?.[recompensa.pericia]?.treinado;
		const efeito = treinado === true ? `+2 em ${nome} por uma cena (já é treinado)` : treinado === false ? `Treinado em ${nome} por uma cena` : `Treinado em ${nome} por uma cena, ou +2 se já for treinado`;
		return recompensa.texto ? `${efeito}. ${recompensa.texto}` : efeito;
	}
	if (recompensa.tipo === "poder") return `Poder por uma cena: ${recompensa.texto}`;
	return `Por uma cena: ${recompensa.texto}`;
}

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

export async function criarAtividade({ titulo, descricao = "", professor = "", vantagem, extra = null, alunos = [] }) {
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
		extra: normalizarRecompensa(extra),
		criada: Date.now(),
		alunos: Object.fromEntries(ids.map((id) => [id, "andamento"]))
	};
	await gravar([...lerAtividades(), atividade]);
	/* O professor com ficha avisa cada aluno pelo correio. */
	if (ficha) {
		const texto = `Atividade extracurricular: ${nome}.${atividade.descricao ? `\n${atividade.descricao}` : ""}\nVantagem ao concluir: ${VANTAGENS[vantagem].nome} (${VANTAGENS[vantagem].resumo}).${atividade.extra ? `\nRecompensa extra: ${descreverRecompensa(atividade.extra)}.` : ""}`;
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

	/* Vantagem de avaliação e recompensa extra seguem a mesma regra: entram ao concluir e saem se a conclusão for desfeita sem uso. */
	const ajustar = (lista, novo) => {
		const atual = lista.find((x) => x.atividade === atividade.id);
		if (situacao === "concluida" && !atual && novo) lista.push({ id: foundry.utils.randomID(), atividade: atividade.id, titulo: atividade.titulo, professor: atividade.professor, ...novo, usada: null });
		else if (situacao !== "concluida" && atual && !atual.usada) lista.splice(lista.indexOf(atual), 1);
		else return false;
		return true;
	};
	aluno.vantagens ??= [];
	aluno.recompensas ??= [];
	const mudouVantagem = ajustar(aluno.vantagens, { tipo: atividade.vantagem });
	const mudouRecompensa = ajustar(aluno.recompensas, atividade.extra);
	if (mudouVantagem || mudouRecompensa) await salvarAluno(actor, aluno);
}

/* O dono do personagem (ou o mestre) gasta a recompensa numa cena; o uso é anunciado no chat. */
export async function usarRecompensa(actor, idDaRecompensa) {
	if (!actor || !(game.user.isGM || actor.isOwner)) return;
	const aluno = lerAluno(actor);
	const recompensa = (aluno?.recompensas ?? []).find((r) => r.id === idDaRecompensa);
	if (!recompensa || recompensa.usada) return;
	const efeito = descreverRecompensa(recompensa, actor);
	recompensa.usada = Date.now();
	await salvarAluno(actor, aluno);
	const seguro = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	await ChatMessage.create({
		speaker: ChatMessage.getSpeaker({ actor }),
		content: `<p><strong>Recompensa de atividade extracurricular</strong> (${seguro(recompensa.titulo)})</p><p>${seguro(efeito)}.</p>`
	});
}

export async function devolverRecompensa(actor, idDaRecompensa) {
	if (!game.user.isGM) return;
	const aluno = lerAluno(actor);
	const recompensa = (aluno?.recompensas ?? []).find((r) => r.id === idDaRecompensa);
	if (!recompensa?.usada) return;
	recompensa.usada = null;
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

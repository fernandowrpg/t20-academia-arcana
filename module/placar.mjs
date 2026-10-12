import { GREMIOS } from "./data/disciplinas.mjs";
import { estatisticas } from "./logica.mjs";
import { MODULO, ehAluno, lerAluno, opcao } from "./config.mjs";

/* O placar conta as aprovações e as atividades extracurriculares concluídas desde o último fechamento.
   "base" guarda quanto cada aluno já tinha quando o placar foi fechado; só o que veio depois pontua. */

export function lerPlacar() {
	const dados = foundry.utils.deepClone(opcao("placar") ?? {});
	dados.base ??= {};
	dados.ajustes ??= {};
	dados.historico ??= [];
	return dados;
}

function contagem(aluno) {
	return { aprovacoes: estatisticas(aluno).aprovadas, atividades: (aluno.vantagens ?? []).length };
}

function alunosComGremio({ todos = false } = {}) {
	const comNpcs = todos || opcao("placarNpcs");
	return game.actors
		.filter((a) => ehAluno(a))
		.map((actor) => ({ actor, aluno: lerAluno(actor) }))
		.filter(({ aluno }) => todos || (GREMIOS[aluno.gremio] && (comNpcs || !aluno.npc)));
}

export function pontuacao(placar = lerPlacar()) {
	const porAprovacao = opcao("pontosAprovacao");
	const porAtividade = opcao("pontosAtividade");
	const gremios = Object.fromEntries(Object.entries(GREMIOS).map(([id, g]) => [id, { id, ...g, alunos: 0, aprovacoes: 0, atividades: 0, avulsos: Number(placar.ajustes[id]) || 0 }]));
	for (const { actor, aluno } of alunosComGremio()) {
		const agora = contagem(aluno);
		const antes = placar.base[actor.id] ?? {};
		const g = gremios[aluno.gremio];
		g.alunos++;
		g.aprovacoes += Math.max(0, agora.aprovacoes - (Number(antes.aprovacoes) || 0));
		g.atividades += Math.max(0, agora.atividades - (Number(antes.atividades) || 0));
	}
	const lista = Object.values(gremios);
	for (const g of lista) g.pontos = Math.max(0, g.aprovacoes * porAprovacao + g.atividades * porAtividade + g.avulsos);
	const max = Math.max(0, ...lista.map((g) => g.pontos));
	return { gremios: lista, max, lideres: max > 0 ? lista.filter((g) => g.pontos === max).map((g) => g.id) : [] };
}

/* Pontos avulsos do mestre: torneios entre grêmios, façanhas, punições. */
export async function definirAvulsos(gremio, valor) {
	if (!game.user.isGM || !GREMIOS[gremio]) return;
	const placar = lerPlacar();
	placar.ajustes[gremio] = Math.round(Number(valor)) || 0;
	await game.settings.set(MODULO, "placar", placar);
}

/* Fecha o semestre: registra os pontos e os campeões, zera os avulsos e recomeça a contagem. */
export async function encerrarPlacar(rotulo) {
	if (!game.user.isGM) return null;
	const placar = lerPlacar();
	const { gremios, lideres } = pontuacao(placar);
	const registro = {
		rotulo: String(rotulo ?? "").trim().slice(0, 60) || `Semestre ${placar.historico.length + 1}`,
		quando: Date.now(),
		pontos: Object.fromEntries(gremios.map((g) => [g.id, g.pontos])),
		campeoes: lideres
	};
	placar.historico.push(registro);
	placar.ajustes = {};
	placar.base = Object.fromEntries(alunosComGremio({ todos: true }).map(({ actor, aluno }) => [actor.id, contagem(aluno)]));
	await game.settings.set(MODULO, "placar", placar);

	const nomes = lideres.map((id) => GREMIOS[id].nome);
	const resultado = !nomes.length ? "Nenhum grêmio pontuou." : nomes.length === 1 ? `<strong>${nomes[0]}</strong> é o campeão!` : `Empate entre <strong>${nomes.join("</strong> e <strong>")}</strong>!`;
	const linhas = gremios
		.slice()
		.sort((a, b) => b.pontos - a.pontos)
		.map((g) => `<li>${g.nome}: ${g.pontos}</li>`)
		.join("");
	await ChatMessage.create({ content: `<h3>Placar dos Grêmios: ${registro.rotulo.replace(/</g, "&lt;")}</h3><p>${resultado}</p><ul>${linhas}</ul>` });
	return registro;
}

export function nomesDosCampeoes(registro) {
	return (registro?.campeoes ?? []).map((id) => GREMIOS[id]?.nome ?? id);
}

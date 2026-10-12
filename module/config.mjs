import { configPadrao, montarCatalogo, novoAluno, periciasDoCatalogo } from "./logica.mjs";
import { atualizarResumoNpc, periciasEstudadas } from "./gerador.mjs";

export const MODULO = "t20-academia-arcana";
export const FLAG = "aluno";

const ouvintes = new Set();

export function aoMudarConfiguracao(fn) {
	ouvintes.add(fn);
}

function notificar() {
	for (const fn of ouvintes) fn();
}

export function registrarConfiguracoes(CatalogoApp) {
	const numero = (chave, padrao, min, max) =>
		game.settings.register(MODULO, chave, {
			name: `ACADEMIA.Config.${chave}.Nome`,
			hint: `ACADEMIA.Config.${chave}.Dica`,
			scope: "world",
			config: true,
			type: new foundry.data.fields.NumberField({ min, max, step: 1, integer: true, nullable: false, initial: padrao }),
			default: padrao,
			onChange: notificar
		});

	numero("minDisciplinas", 3, 0, 20);
	numero("maxDisciplinas", 6, 0, 30);
	numero("semestresRegulares", 8, 1, 20);
	numero("maxSemestres", 10, 1, 30);

	game.settings.register(MODULO, "jogadoresMatriculam", {
		name: "ACADEMIA.Config.jogadoresMatriculam.Nome",
		hint: "ACADEMIA.Config.jogadoresMatriculam.Dica",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		onChange: notificar
	});

	game.settings.register(MODULO, "usarNotas", {
		name: "ACADEMIA.Config.usarNotas.Nome",
		hint: "ACADEMIA.Config.usarNotas.Dica",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		onChange: notificar
	});

	const painel = (chave) =>
		game.settings.register(MODULO, chave, {
			name: `ACADEMIA.Config.${chave}.Nome`,
			hint: `ACADEMIA.Config.${chave}.Dica`,
			scope: "client",
			config: true,
			type: Boolean,
			default: true,
			onChange: notificar
		});

	painel("painelAlunos");
	painel("painelAmeacas");

	game.settings.register(MODULO, "ameacasJogadores", {
		name: "ACADEMIA.Config.ameacasJogadores.Nome",
		hint: "ACADEMIA.Config.ameacasJogadores.Dica",
		scope: "world",
		config: true,
		type: String,
		choices: {
			nenhum: "ACADEMIA.Config.ameacasJogadores.Nenhum",
			estado: "ACADEMIA.Config.ameacasJogadores.Estado",
			valores: "ACADEMIA.Config.ameacasJogadores.Valores"
		},
		default: "nenhum",
		onChange: notificar
	});

	game.settings.register(MODULO, "calendarioJogadores", {
		name: "ACADEMIA.Config.calendarioJogadores.Nome",
		hint: "ACADEMIA.Config.calendarioJogadores.Dica",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		onChange: notificar
	});

	game.settings.register(MODULO, "horarios", {
		scope: "world",
		config: false,
		type: Object,
		default: {},
		onChange: notificar
	});

	game.settings.register(MODULO, "correioJogadores", {
		name: "ACADEMIA.Config.correioJogadores.Nome",
		hint: "ACADEMIA.Config.correioJogadores.Dica",
		scope: "world",
		config: true,
		type: Boolean,
		default: true,
		onChange: notificar
	});

	game.settings.register(MODULO, "correio", {
		scope: "world",
		config: false,
		type: Object,
		default: { conversas: {} },
		onChange: notificar
	});

	game.settings.register(MODULO, "correioLido", {
		scope: "client",
		config: false,
		type: Object,
		default: {},
		onChange: notificar
	});

	game.settings.register(MODULO, "atividades", {
		scope: "world",
		config: false,
		type: Array,
		default: [],
		onChange: notificar
	});

	game.settings.register(MODULO, "professores", {
		scope: "world",
		config: false,
		type: Object,
		default: {},
		onChange: notificar
	});

	game.settings.register(MODULO, "paineis", {
		scope: "client",
		config: false,
		type: Object,
		default: {}
	});

	game.settings.register(MODULO, "catalogo", {
		scope: "world",
		config: false,
		type: Object,
		default: configPadrao(),
		onChange: notificar
	});

	game.settings.registerMenu(MODULO, "catalogoMenu", {
		name: "ACADEMIA.Config.catalogoMenu.Nome",
		label: "ACADEMIA.Config.catalogoMenu.Rotulo",
		hint: "ACADEMIA.Config.catalogoMenu.Dica",
		icon: "fa-solid fa-book-open",
		type: CatalogoApp,
		restricted: true
	});
}

export function opcao(chave) {
	return game.settings.get(MODULO, chave);
}

export function estadoPainel(chave) {
	return opcao("paineis")?.[chave] ?? {};
}

export async function salvarEstadoPainel(chave, dados) {
	const todos = foundry.utils.deepClone(opcao("paineis") ?? {});
	todos[chave] = { ...todos[chave], ...dados };
	return game.settings.set(MODULO, "paineis", todos);
}

export function lerConfigCatalogo() {
	return foundry.utils.mergeObject(configPadrao(), foundry.utils.deepClone(opcao("catalogo") ?? {}), { inplace: false });
}

export function contextoCatalogo() {
	const config = lerConfigCatalogo();
	const catalogo = montarCatalogo(config);
	return {
		config,
		catalogo,
		pericias: periciasDoCatalogo(catalogo),
		ofertas: new Set(config.ofertas)
	};
}

export function lerAluno(actor) {
	const dados = actor?.getFlag(MODULO, FLAG);
	if (!dados) return null;
	return foundry.utils.mergeObject(novoAluno(), foundry.utils.deepClone(dados), { inplace: false });
}

export function ehAluno(actor) {
	return !!actor?.getFlag(MODULO, FLAG);
}

export async function salvarAluno(actor, aluno) {
	return actor.update({ [`flags.${MODULO}.${FLAG}`]: aluno });
}

export async function removerAluno(actor) {
	return actor.unsetFlag(MODULO, FLAG);
}

/* O catálogo pode trazer dois professores na mesma disciplina, separados por barra. */
export function nomesDeProfessor(texto) {
	return String(texto ?? "")
		.split("/")
		.map((n) => n.trim())
		.filter(Boolean);
}

/* Nome do professor no catálogo -> id da ficha vinculada pelo mestre na Secretaria. */
export function vinculosDeProfessores() {
	return opcao("professores") ?? {};
}

export function ehProfessor(actor) {
	return !!actor && Object.values(vinculosDeProfessores()).includes(actor.id);
}

export function fichasDoProfessor(texto) {
	const vinculos = vinculosDeProfessores();
	return nomesDeProfessor(texto)
		.map((n) => game.actors.get(vinculos[n]))
		.filter(Boolean);
}

/* Todos os professores citados no catálogo, com as disciplinas e a ficha vinculada (se houver). */
export function corpoDocente() {
	const vinculos = vinculosDeProfessores();
	const porNome = new Map();
	for (const d of contextoCatalogo().catalogo.values()) {
		for (const nome of nomesDeProfessor(d.professor)) {
			if (!porNome.has(nome)) porNome.set(nome, []);
			porNome.get(nome).push(d.nome);
		}
	}
	return [...porNome.entries()]
		.map(([nome, disciplinas]) => ({ nome, disciplinas, actor: game.actors.get(vinculos[nome]) ?? null }))
		.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export function ehNpcGerado(actor) {
	return !!actor?.getFlag(MODULO, FLAG)?.npc;
}

/* Marca como treinadas, na ficha do NPC, as perícias das disciplinas aprovadas ou em curso. */
export async function sincronizarPericias(actor, aluno) {
	const pericias = actor.system?.pericias ?? {};
	const mudancas = {};
	for (const chave of periciasEstudadas(aluno)) {
		if (pericias[chave] && !pericias[chave].treinado) mudancas[`system.pericias.${chave}.treinado`] = true;
	}
	if (Object.keys(mudancas).length) await actor.update(mudancas);
}

/* Leva para a ficha do NPC gerado o que mudou no registro: perícias, nível da classe e o resumo na biografia. */
export async function sincronizarFicha(actor, aluno) {
	await sincronizarPericias(actor, aluno);
	if (!aluno.npc) return;
	const classe = actor.items?.find((i) => i.type === "classe");
	const subiu = !!classe && classe.system?.niveis !== aluno.npc.nivel;
	if (subiu) await classe.update({ "system.niveis": aluno.npc.nivel });
	const mudancas = {};
	const biografia = atualizarResumoNpc(actor.system?.detalhes?.biography?.value, aluno);
	if (biografia !== null) mudancas["system.detalhes.biography.value"] = biografia;
	if (subiu) {
		mudancas["system.attributes.pv.value"] = actor.system.attributes.pv.max;
		mudancas["system.attributes.pm.value"] = actor.system.attributes.pm.max;
	}
	if (Object.keys(mudancas).length) await actor.update(mudancas);
}

/* Disciplinas do período vigente dos personagens; os NPCs gerados tendem a escolhê-las para dividir turma. */
export function disciplinasDosPersonagens() {
	const ids = new Set();
	for (const actor of game.actors) {
		const aluno = lerAluno(actor);
		if (!aluno || aluno.npc) continue;
		const atual = aluno.semestres.at(-1);
		if (atual && atual.status !== "encerrado") for (const d of atual.disciplinas) ids.add(d.id);
	}
	return ids;
}

export function podeMatricular(actor) {
	return game.user.isGM || (actor.isOwner && opcao("jogadoresMatriculam"));
}

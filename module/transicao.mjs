import { MODULO, opcao } from "./config.mjs";
import { PLANOS } from "./data/planos.mjs";
import { dadosDaAcademia, dadosDoPlano, lerExpedicao } from "./planos.mjs";

/*
 * Transição entre planos: um cartão no centro da tela, nas cores do plano, com o ato e a parada,
 * o nome do plano, o deus e a regra planar. Aparece sozinho quando o mestre troca de plano
 * e pode ser mostrado a todos a qualquer momento pelo painel do plano. Some sozinho ou com um clique.
 */

const ID = "aa-transicao-plano";
const EVENTO = `module.${MODULO}`;
const DURACAO = 7000;

let temporizador = null;

function remover() {
	clearTimeout(temporizador);
	temporizador = null;
	const cartao = document.getElementById(ID);
	if (!cartao) return;
	cartao.classList.add("saindo");
	setTimeout(() => cartao.remove(), 400);
}

function elemento(tag, classe, texto) {
	const el = document.createElement(tag);
	if (classe) el.className = classe;
	if (texto !== undefined) el.textContent = texto;
	return el;
}

/* O que o cartão mostra para um plano ou para a Academia. */
function conteudo(id) {
	if (!id || id === "academia") {
		const academia = dadosDaAcademia();
		return {
			id: "academia",
			icone: academia.icone,
			chamada: "De volta à",
			titulo: academia.titulo || "Grande Academia Arcana",
			subtitulo: academia.titulo ? academia.nome : "Fim da viagem, por enquanto",
			regra: ""
		};
	}
	const plano = dadosDoPlano(id);
	if (!plano) return null;
	return {
		id: plano.id,
		icone: plano.icone,
		chamada: `${plano.rotuloAto.split(":")[0]} · Parada ${plano.ordem} de ${PLANOS.length}`,
		titulo: plano.nome,
		subtitulo: `Mundo de ${plano.deus} · ${plano.portfolio}`,
		regra: plano.regraTitulo,
		dados: `Nível ${plano.nivel} · CD ${plano.cd} · Perigo ${plano.perigo}`
	};
}

/* Mostra o cartão neste navegador. */
export function mostrarTransicao(id = lerExpedicao().atual) {
	const c = conteudo(id);
	if (!c) return;
	remover();
	document.getElementById(ID)?.remove();

	const cartao = elemento("div", "aa-transicao");
	cartao.id = ID;
	cartao.dataset.aaPlano = c.id;
	cartao.setAttribute("role", "status");
	cartao.setAttribute("aria-live", "polite");
	cartao.dataset.tooltip = "Clique para fechar";

	const emblema = elemento("i", `aa-transicao-emblema ${c.icone}`);
	emblema.setAttribute("aria-hidden", "true");
	cartao.append(emblema, elemento("span", "aa-transicao-chamada", c.chamada), elemento("span", "aa-transicao-titulo", c.titulo));
	cartao.append(elemento("span", "aa-transicao-subtitulo", c.subtitulo));
	if (c.regra) {
		const regra = elemento("span", "aa-transicao-regra");
		regra.append(elemento("i", "fa-solid fa-scroll"), ` Regra planar: ${c.regra}`);
		cartao.append(regra);
	}
	if (c.dados) cartao.append(elemento("span", "aa-transicao-dados", c.dados));
	cartao.append(elemento("span", "aa-transicao-tempo"));
	cartao.style.setProperty("--aa-transicao-duracao", `${DURACAO}ms`);

	cartao.addEventListener("click", remover);
	/* Passar o mouse segura o cartão na tela; sair dele volta a contar. */
	cartao.addEventListener("pointerenter", () => {
		clearTimeout(temporizador);
		cartao.classList.add("parado");
	});
	cartao.addEventListener("pointerleave", () => {
		cartao.classList.remove("parado");
		clearTimeout(temporizador);
		temporizador = setTimeout(remover, 2500);
	});
	document.body.append(cartao);
	temporizador = setTimeout(remover, DURACAO);
}

/* O mestre mostra o cartão a todos os conectados (ele incluído). */
export function mostrarTransicaoATodos(id = lerExpedicao().atual) {
	if (!game.user.isGM) return;
	game.socket.emit(EVENTO, { acao: "transicaoPlano", plano: id || "academia" });
	mostrarTransicao(id);
}

/* Troca de plano feita pelo mestre: mostra o cartão a quem vê o painel do plano, se a opção estiver ligada. */
export function transicaoAutomatica(id) {
	if (!opcao("transicaoPlano")) return;
	if (!game.user.isGM && !opcao("planoJogadores")) return;
	mostrarTransicao(id);
}

export function registrarSocketTransicao() {
	game.socket.on(EVENTO, (dados) => {
		if (dados?.acao !== "transicaoPlano") return;
		mostrarTransicao(dados.plano);
	});
}

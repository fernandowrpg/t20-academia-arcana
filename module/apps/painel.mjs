import { estadoPainel, salvarEstadoPainel } from "../config.mjs";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const ROTULOS_FAIXA = {
	ileso: "Ileso",
	leve: "Ferido leve",
	ferido: "Ferido",
	critico: "Estado grave",
	caido: "Caído"
};

const PCT_FAIXA = { ileso: 100, leve: 75, ferido: 50, critico: 25, caido: 0 };

export function barra(tipo, rotulo, rec, { numeros = true } = {}) {
	if (!rec) return null;
	const temp = rec.temp > 0 ? ` +${rec.temp}` : "";
	return {
		tipo,
		rotulo,
		pct: numeros ? rec.pct : PCT_FAIXA[rec.faixa],
		faixa: rec.faixa,
		texto: numeros ? `${rec.valor}/${rec.max}${temp}` : ROTULOS_FAIXA[rec.faixa],
		dica: numeros ? `${rotulo}: ${rec.valor} de ${rec.max}${rec.temp > 0 ? ` (+${rec.temp} temporários)` : ""}` : ROTULOS_FAIXA[rec.faixa]
	};
}

/* Ordem fixa dos painéis para empilhar os ícones presos no mesmo canto. */
const ORDEM_ICONES = ["alunos", "ameacas", "placar", "plano"];
const TAMANHO_ICONE = 44;
const MARGEM_ICONE = 8;
/* Soltar o ícone a esta distância de duas bordas prende-o no canto. */
const IMA_CANTO = 64;

export class PainelFlutuante extends HandlebarsApplicationMixin(ApplicationV2) {
	static CHAVE = "";

	static instancia = null;

	/* Painéis abertos, para reposicionar os ícones que dividem um canto. */
	static abertos = new Set();

	static deveExibir() {
		return false;
	}

	static sincronizar() {
		if (!game.ready) return;
		if (!this.deveExibir()) {
			const app = this.instancia;
			this.instancia = null;
			app?.close();
			return;
		}
		this.instancia ??= new this();
		this.instancia.render({ force: true });
	}

	static reposicionarIcones() {
		for (const app of PainelFlutuante.abertos) if (app.minimizado) app.#posicionar();
	}

	static DEFAULT_OPTIONS = {
		classes: ["academia-arcana", "aa-painel"],
		window: { frame: false, positioned: false },
		actions: {
			recolher: PainelFlutuante.#recolher,
			minimizar: PainelFlutuante.#minimizar
		}
	};

	#aoRedimensionar = () => this.#posicionar();

	get recolhido() {
		return !!estadoPainel(this.constructor.CHAVE).recolhido;
	}

	/* Minimizado, o painel vira um ícone redondo flutuante. Fica salvo por usuário. */
	get minimizado() {
		return !!estadoPainel(this.constructor.CHAVE).minimizado;
	}

	posicaoPadrao() {
		return { left: 120, top: 90 };
	}

	async close(options = {}) {
		if (options.closeKey) return this;
		return super.close(options);
	}

	async _onFirstRender(context, options) {
		await super._onFirstRender(context, options);
		window.addEventListener("resize", this.#aoRedimensionar);
		PainelFlutuante.abertos.add(this);
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		const minimizado = this.minimizado;
		this.element.classList.toggle("recolhido", this.recolhido);
		this.element.classList.toggle("minimizado", minimizado);
		const topo = this.element.querySelector(".aa-painel-topo");
		if (topo) {
			topo.dataset.tooltip = minimizado
				? `${topo.querySelector("strong")?.textContent.trim() ?? ""}: clique para abrir; arraste para mover ou prender num canto`
				: "Arraste para mover; clique duplo para voltar à posição padrão";
			if (minimizado) topo.dataset.tooltipDirection = "LEFT";
			else delete topo.dataset.tooltipDirection;
			/* O contador do topo (cartas novas, por exemplo) vira um selo no ícone. */
			const contador = minimizado && topo.querySelector(".aa-painel-acoes sup")?.textContent.trim();
			if (contador) {
				const selo = document.createElement("span");
				selo.className = "aa-icone-selo";
				selo.textContent = contador;
				topo.append(selo);
			}
		}
		topo?.addEventListener("pointerdown", (ev) => this.#arrastar(ev));
		topo?.addEventListener("dblclick", (ev) => this.#restaurarPosicao(ev));
		this.#posicionar();
		PainelFlutuante.reposicionarIcones();
	}

	async _onClose(options) {
		await super._onClose(options);
		window.removeEventListener("resize", this.#aoRedimensionar);
		PainelFlutuante.abertos.delete(this);
		if (this.constructor.instancia === this) this.constructor.instancia = null;
		PainelFlutuante.reposicionarIcones();
	}

	#limitar(left, top) {
		const el = this.element;
		return {
			left: Math.max(0, Math.min(left, window.innerWidth - el.offsetWidth)),
			top: Math.max(0, Math.min(top, window.innerHeight - el.offsetHeight))
		};
	}

	/* Posição do ícone preso num canto: os ícones do mesmo canto ficam em fila, afastando-se da borda de cima ou de baixo. */
	#posicaoNoCanto(canto) {
		const vizinhos = [...PainelFlutuante.abertos]
			.filter((app) => app.minimizado && estadoPainel(app.constructor.CHAVE).canto === canto)
			.map((app) => app.constructor.CHAVE)
			.sort((a, b) => ORDEM_ICONES.indexOf(a) - ORDEM_ICONES.indexOf(b));
		const indice = Math.max(0, vizinhos.indexOf(this.constructor.CHAVE));
		const passo = indice * (TAMANHO_ICONE + MARGEM_ICONE);
		const left = canto.endsWith("w") ? MARGEM_ICONE : window.innerWidth - TAMANHO_ICONE - MARGEM_ICONE;
		const top = canto.startsWith("n") ? MARGEM_ICONE + passo : window.innerHeight - TAMANHO_ICONE - MARGEM_ICONE - passo;
		return { left, top };
	}

	#posicionar() {
		const el = this.element;
		if (!el) return;
		const salvo = estadoPainel(this.constructor.CHAVE);
		const padrao = this.posicaoPadrao();
		let alvo;
		if (this.minimizado) {
			/* Sem lugar salvo, o ícone aparece onde estava o canto do painel. */
			alvo = salvo.canto ? this.#posicaoNoCanto(salvo.canto) : { left: salvo.iconeLeft ?? salvo.left ?? padrao.left, top: salvo.iconeTop ?? salvo.top ?? padrao.top };
		} else {
			alvo = { left: salvo.left ?? padrao.left, top: salvo.top ?? padrao.top };
		}
		const { left, top } = this.#limitar(alvo.left, alvo.top);
		el.style.left = `${left}px`;
		el.style.top = `${top}px`;
	}

	/* Canto mais próximo, se o ponto estiver perto de duas bordas. */
	#cantoProximo(left, top) {
		const cx = left + TAMANHO_ICONE / 2;
		const cy = top + TAMANHO_ICONE / 2;
		const oeste = cx < IMA_CANTO;
		const leste = cx > window.innerWidth - IMA_CANTO;
		const norte = cy < IMA_CANTO;
		const sul = cy > window.innerHeight - IMA_CANTO;
		if (!(oeste || leste) || !(norte || sul)) return null;
		return `${norte ? "n" : "s"}${oeste ? "w" : "e"}`;
	}

	#arrastar(ev) {
		if (ev.button !== 0 || ev.target.closest("a, button")) return;
		ev.preventDefault();
		const el = this.element;
		const minimizado = this.minimizado;
		const caixa = el.getBoundingClientRect();
		const dx = ev.clientX - caixa.left;
		const dy = ev.clientY - caixa.top;
		const x0 = ev.clientX;
		const y0 = ev.clientY;
		let movido = false;
		const mover = (e) => {
			/* Uns pixels de tolerância: um clique trêmulo no ícone ainda abre o painel. */
			if (!movido && Math.hypot(e.clientX - x0, e.clientY - y0) < 4) return;
			movido = true;
			const { left, top } = this.#limitar(e.clientX - dx, e.clientY - dy);
			el.style.left = `${left}px`;
			el.style.top = `${top}px`;
			if (minimizado) el.classList.toggle("ima", !!this.#cantoProximo(left, top));
		};
		const soltar = async () => {
			window.removeEventListener("pointermove", mover);
			el.classList.remove("arrastando", "ima");
			const left = parseInt(el.style.left);
			const top = parseInt(el.style.top);
			if (!minimizado) {
				if (movido) await salvarEstadoPainel(this.constructor.CHAVE, { left, top });
				return;
			}
			if (!movido) {
				await salvarEstadoPainel(this.constructor.CHAVE, { minimizado: false });
				this.render();
				return;
			}
			const canto = this.#cantoProximo(left, top);
			await salvarEstadoPainel(this.constructor.CHAVE, { canto, iconeLeft: left, iconeTop: top });
			this.#posicionar();
			PainelFlutuante.reposicionarIcones();
		};
		el.classList.add("arrastando");
		window.addEventListener("pointermove", mover);
		window.addEventListener("pointerup", soltar, { once: true });
	}

	async #restaurarPosicao(ev) {
		if (this.minimizado || ev.target.closest("a, button")) return;
		await salvarEstadoPainel(this.constructor.CHAVE, { left: null, top: null });
		this.#posicionar();
	}

	static async #recolher() {
		await salvarEstadoPainel(this.constructor.CHAVE, { recolhido: !this.recolhido });
		this.render();
	}

	static async #minimizar() {
		await salvarEstadoPainel(this.constructor.CHAVE, { minimizado: !this.minimizado });
		this.render();
	}
}

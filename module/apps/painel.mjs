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

export class PainelFlutuante extends HandlebarsApplicationMixin(ApplicationV2) {
	static CHAVE = "";

	static instancia = null;

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

	static DEFAULT_OPTIONS = {
		classes: ["academia-arcana", "aa-painel"],
		window: { frame: false, positioned: false },
		actions: {
			recolher: PainelFlutuante.#recolher
		}
	};

	#aoRedimensionar = () => this.#posicionar();

	get recolhido() {
		return !!estadoPainel(this.constructor.CHAVE).recolhido;
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
	}

	async _onRender(context, options) {
		await super._onRender(context, options);
		this.element.classList.toggle("recolhido", this.recolhido);
		const topo = this.element.querySelector(".aa-painel-topo");
		topo?.addEventListener("pointerdown", (ev) => this.#arrastar(ev));
		topo?.addEventListener("dblclick", (ev) => this.#restaurarPosicao(ev));
		this.#posicionar();
	}

	async _onClose(options) {
		await super._onClose(options);
		window.removeEventListener("resize", this.#aoRedimensionar);
		if (this.constructor.instancia === this) this.constructor.instancia = null;
	}

	#limitar(left, top) {
		const el = this.element;
		return {
			left: Math.max(0, Math.min(left, window.innerWidth - el.offsetWidth)),
			top: Math.max(0, Math.min(top, window.innerHeight - el.offsetHeight))
		};
	}

	#posicionar() {
		const el = this.element;
		if (!el) return;
		const salvo = estadoPainel(this.constructor.CHAVE);
		const padrao = this.posicaoPadrao();
		const { left, top } = this.#limitar(salvo.left ?? padrao.left, salvo.top ?? padrao.top);
		el.style.left = `${left}px`;
		el.style.top = `${top}px`;
	}

	#arrastar(ev) {
		if (ev.button !== 0 || ev.target.closest("a, button")) return;
		ev.preventDefault();
		const el = this.element;
		const caixa = el.getBoundingClientRect();
		const dx = ev.clientX - caixa.left;
		const dy = ev.clientY - caixa.top;
		let movido = false;
		const mover = (e) => {
			movido = true;
			const { left, top } = this.#limitar(e.clientX - dx, e.clientY - dy);
			el.style.left = `${left}px`;
			el.style.top = `${top}px`;
		};
		const soltar = () => {
			window.removeEventListener("pointermove", mover);
			el.classList.remove("arrastando");
			if (movido) salvarEstadoPainel(this.constructor.CHAVE, { left: parseInt(el.style.left), top: parseInt(el.style.top) });
		};
		el.classList.add("arrastando");
		window.addEventListener("pointermove", mover);
		window.addEventListener("pointerup", soltar, { once: true });
	}

	async #restaurarPosicao(ev) {
		if (ev.target.closest("a, button")) return;
		await salvarEstadoPainel(this.constructor.CHAVE, { left: null, top: null });
		this.#posicionar();
	}

	static async #recolher() {
		await salvarEstadoPainel(this.constructor.CHAVE, { recolhido: !this.recolhido });
		this.render();
	}
}

/* Conversor mínimo de Markdown para HTML, só com o que os documentos em docs/ usam:
   títulos, parágrafos, listas, tabelas, citações, negrito, itálico e código. */

function escapar(texto) {
	return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function emLinha(texto) {
	return escapar(texto)
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
		.replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function celulas(linha) {
	return linha.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
}

function item(texto) {
	return emLinha(texto.replace(/^\[ \]\s*/, "☐ ").replace(/^\[x\]\s*/i, "☑ "));
}

export function markdownParaHtml(markdown) {
	const linhas = markdown.replace(/\r\n/g, "\n").split("\n");
	const html = [];
	let i = 0;
	const enquanto = (teste) => {
		const bloco = [];
		while (i < linhas.length && teste(linhas[i])) bloco.push(linhas[i++]);
		return bloco;
	};
	while (i < linhas.length) {
		const linha = linhas[i];
		if (!linha.trim()) {
			i++;
		} else if (/^#{1,6}\s/.test(linha)) {
			const nivel = linha.match(/^#+/)[0].length;
			html.push(`<h${nivel}>${emLinha(linha.replace(/^#+\s*/, ""))}</h${nivel}>`);
			i++;
		} else if (/^\|/.test(linha)) {
			const [cabecalho, , ...corpo] = enquanto((l) => /^\|/.test(l));
			html.push(`<table><thead><tr>${celulas(cabecalho).map((c) => `<th>${emLinha(c)}</th>`).join("")}</tr></thead><tbody>`);
			for (const l of corpo) html.push(`<tr>${celulas(l).map((c) => `<td>${emLinha(c)}</td>`).join("")}</tr>`);
			html.push("</tbody></table>");
		} else if (/^>/.test(linha)) {
			const bloco = enquanto((l) => /^>/.test(l)).map((l) => l.replace(/^>\s?/, ""));
			html.push(`<div class="aa-quadro">${markdownParaHtml(bloco.join("\n"))}</div>`);
		} else if (/^[-*]\s/.test(linha)) {
			const bloco = enquanto((l) => /^[-*]\s/.test(l));
			html.push(`<ul>${bloco.map((l) => `<li>${item(l.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`);
		} else if (/^\d+\.\s/.test(linha)) {
			const bloco = enquanto((l) => /^\d+\.\s/.test(l));
			html.push(`<ol>${bloco.map((l) => `<li>${emLinha(l.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`);
		} else {
			const bloco = enquanto((l) => l.trim() && !/^(#{1,6}\s|\||>|[-*]\s|\d+\.\s)/.test(l));
			html.push(`<p>${emLinha(bloco.join(" "))}</p>`);
		}
	}
	return html.join("\n");
}

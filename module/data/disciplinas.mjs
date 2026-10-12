export const ROMANOS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export const OFICIO_LIVRE = "oficio";

export const OFICIOS_T20 = ["alfa", "alqu", "arme", "arte", "cozi", "enge"];

export const PERICIAS_T20 = {
	acro: "Acrobacia",
	ades: "Adestramento",
	atle: "Atletismo",
	atua: "Atuação",
	cava: "Cavalgar",
	conh: "Conhecimento",
	cura: "Cura",
	dipl: "Diplomacia",
	enga: "Enganação",
	fort: "Fortitude",
	furt: "Furtividade",
	guer: "Guerra",
	inic: "Iniciativa",
	inti: "Intimidação",
	intu: "Intuição",
	inve: "Investigação",
	joga: "Jogatina",
	ladi: "Ladinagem",
	luta: "Luta",
	mist: "Misticismo",
	nobr: "Nobreza",
	perc: "Percepção",
	pilo: "Pilotagem",
	pont: "Pontaria",
	refl: "Reflexos",
	reli: "Religião",
	sobr: "Sobrevivência",
	vont: "Vontade",
	alfa: "Ofício: Alfaiate",
	alqu: "Ofício: Alquimista",
	arme: "Ofício: Armeiro",
	arte: "Ofício: Artesão",
	cozi: "Ofício: Cozinheiro",
	enge: "Ofício: Engenhoqueiro",
	oficio: "Ofício (à escolha)"
};

export function slug(texto) {
	return String(texto)
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

function unica(pericia, nome, extra = {}) {
	return { id: slug(nome), nome, pericia, prereqs: [], professor: "", especial: false, ...extra };
}

function serie(pericia, base, niveis, extra = {}) {
	return niveis.map((nivel) => unica(pericia, `${base} ${ROMANOS[nivel]}`, extra));
}

function comPrereq(lista, prereqs) {
	return lista.map((d) => ({ ...d, prereqs: [...d.prereqs, ...prereqs] }));
}

const NEVUUS = "Nevuus Benignus";
const TAANDUS = "Taandus, o Magnífico";
const ZEPHYRO = "Zéphyro";
const BLAVATSKY = "Madame Blavatsky";
const THANATUS = "Thanatus";
const ESPLENDA = "Lady Esplenda";
const GEOFILUS = "Geófilus";
const IGNATUS = "Ignatus";
const NEREUS = "Nereus";
const DORE = "Jungle Dore";
const GRATIVO = "Grativo";
const VANDRAGO = "Vandrago";
const GENNA = "Genna Carallan";
const ILLIETH = "Illieth";
const CORINA = "Irmã Corina";
const SEBERRAK = "Seberrak";
const REYNARD = "Reynard (convidado)";
const ROTATIVO = "Professores rotativos";

export const DISCIPLINAS = [
	...serie("ades", "Criaturas de Arton", [1, 2, 3], { professor: NEVUUS }),
	...serie("ades", "Cuidado de Criaturas Invocadas", [1, 2], { professor: NEVUUS }),
	unica("ades", "Introdução aos Familiares", { professor: NEVUUS }),
	...serie("ades", "Invocação", [1, 2, 3, 4], { professor: NEVUUS }),

	unica("atle", "Esportes Mágicos"),
	...serie("atle", "Prática Aventuresca", [1, 2], { professor: `${VANDRAGO} / ${DORE}` }),

	...serie("atua", "Artes Ilusórias", [1, 2], { professor: TAANDUS }),
	...serie("atua", "Ilusão", [1, 2, 3, 4], { professor: TAANDUS }),
	unica("atua", "Magia de Palco e Ilusionismo", { professor: TAANDUS }),
	unica("atua", "Moda Arcana"),
	...serie("atua", "Música de Bardo", [1, 2, 3]),

	...comPrereq(serie("mist", "Artefatos", [1, 2]), ["teoria-e-pratica-dos-itens-magicos-ii"]),
	...serie("mist", "Teoria e Prática dos Itens Mágicos", [1, 2, 3, 4]),
	...serie("mist", "Teoria da Magia", [1, 2, 3, 4], { professor: ZEPHYRO }),
	...serie("mist", "Teoria dos Planos", [1, 2]),

	...serie("enge", "Engenhocas", [1, 2, 3], { professor: GENNA }),
	unica("enge", "Introdução às Masmorras"),
	unica("enge", "Muralhas de Energia e Estruturas Arcanas"),

	...serie("conh", "Cartografia", [1, 2]),
	unica("conh", "Civilizações Perdidas e Locais Inexplorados"),
	...serie("conh", "Geopolítica do Reinado", [1, 2]),
	unica("conh", "Lugares Místicos de Arton e Além"),

	...serie("conh", "História de Arton", [1, 2, 3, 4]),
	...serie("conh", "História da Magia", [1, 2, 3]),
	unica("conh", "Lendas Artonianas", { professor: BLAVATSKY }),
	unica("conh", "Prevenção contra Lordes Conquistadores"),

	...serie("sobr", "Ecologia dos Animais Mágicos", [1, 2, 3]),
	...serie("sobr", "Ecologia das Plantas Mágicas", [1, 2, 3]),
	unica("sobr", "Familiares: Cuidados Avançados", { prereqs: ["introducao-aos-familiares"], professor: NEVUUS }),
	unica("sobr", "Ingredientes Mágicos na Natureza: do Acônito ao Visgo"),
	unica("sobr", "Introdução aos Ermos", { professor: DORE }),

	unica("nobr", "Boas Maneiras na Corte", { prereqs: ["boas-maneiras-e-etiqueta"], professor: ESPLENDA }),
	unica("nobr", "Cargos e Títulos de Nobreza no Reinado e no Império de Tauron", { professor: SEBERRAK }),
	unica("nobr", "Grandes Monarcas e seus Feitos"),
	...serie("nobr", "Linhagens Nobres do Reinado", [1, 2], { professor: SEBERRAK }),

	unica("reli", "Almas e Vida após a Morte", { professor: THANATUS }),
	...serie("reli", "Os Deuses e seus Portfólios", [1, 2, 3, 4], { professor: CORINA }),
	unica("reli", "Estudos Avançados sobre Wynna", { prereqs: ["os-deuses-e-seus-portfolios-ii"] }),
	...serie("reli", "Metafísica dos Reinos Divinos", [1, 2]),

	unica("conh", "Estudo dos Lefeu", { professor: REYNARD, especial: true }),

	unica("cura", "Ervas e seu Poder Curativo", { professor: CORINA }),
	...serie("cura", "Poções e Venenos", [1, 2, 3, 4], { professor: GRATIVO }),
	...serie("cura", "Prevenção e Atendimento de Acidentes Mágicos", [1, 2]),
	unica("cura", "Primeiros Socorros"),

	unica("dipl", "Boas Maneiras e Etiqueta", { professor: ESPLENDA }),
	...serie("dipl", "Direito Mágico", [1, 2], { professor: ESPLENDA }),
	...serie("dipl", "Encantamentos", [1, 2, 3, 4], { professor: ESPLENDA }),

	...serie("furt", "Prática Aventuresca", [4], { professor: `${VANDRAGO} / ${DORE}` }),

	...serie("mist", "Abjuração", [1, 2, 3, 4], { professor: GEOFILUS }),
	...serie("mist", "Cronomancia", [1, 2, 3, 4], { professor: ROTATIVO }),
	...serie("mist", "Evocação", [1, 2, 3, 4], { professor: IGNATUS }),
	...serie("mist", "Necromancia", [1, 2, 3, 4], { professor: THANATUS }),

	...serie("inic", "Combate contra Humanoides", [1, 2], { professor: VANDRAGO }),
	...serie("inic", "Combate contra Monstros", [1, 2], { professor: VANDRAGO }),
	...serie("inic", "Prática Aventuresca", [5], { professor: `${VANDRAGO} / ${DORE}` }),

	...serie("intu", "Adivinhação", [1, 2, 3, 4], { professor: BLAVATSKY }),
	unica("intu", "Prevenção contra Ilusões"),

	...serie("ladi", "Engenhocas", [4, 5], { professor: GENNA }),
	...serie("ladi", "Uso de Instrumentos Mágicos", [1, 2, 3]),

	...serie("oficio", "Biblioteconomia", [1, 2, 3], { professor: ILLIETH }),
	...serie("oficio", "Manutenção de Torres e Laboratórios", [1, 2], { professor: ILLIETH }),

	...serie("alqu", "Ácidos e Corrosivos", [1, 2]),
	...serie("alqu", "Alquimia", [1, 2, 3, 4], { professor: GRATIVO }),
	...serie("alqu", "Granadas e Explosivos", [1, 2], { professor: IGNATUS }),
	...serie("alqu", "Transmutação", [1, 2, 3, 4], { professor: NEREUS }),

	unica("oficio", "Metais Mágicos e Materiais Especiais"),
	...comPrereq(serie("oficio", "Transmutação dos Metais", [1, 2]), ["transmutacao-iii"]),

	...serie("perc", "Prática Aventuresca", [6], { professor: `${VANDRAGO} / ${DORE}` }),
	unica("perc", "Raios e Pontaria Mágica"),

	...comPrereq(serie("sobr", "Sobrevivência em Desertos", [1, 2], { professor: DORE }), ["introducao-aos-ermos"]),
	...comPrereq(serie("sobr", "Sobrevivência em Florestas", [1, 2], { professor: DORE }), ["introducao-aos-ermos"]),
	...comPrereq(serie("sobr", "Sobrevivência no Gelo", [1, 2], { professor: DORE }), ["introducao-aos-ermos"]),
	...comPrereq(serie("sobr", "Sobrevivência no Mar", [1, 2], { professor: NEREUS }), ["introducao-aos-ermos"]),
	...comPrereq(serie("sobr", "Sobrevivência em Montanhas", [1, 2], { professor: DORE }), ["introducao-aos-ermos"])
];

export const GREMIOS = {
	leao: { nome: "Grêmio do Leão", apelido: "Justiceiros", tendencias: "LB, LN, NB", icone: "fa-solid fa-shield-halved", cor: "#d4a017" },
	dragao: { nome: "Grêmio do Dragão", apelido: "Tiranos", tendencias: "LM, LN, NM", icone: "fa-solid fa-dragon", cor: "#b22222" },
	falcao: { nome: "Grêmio do Falcão", apelido: "Espíritos Livres", tendencias: "CB, CN, NB", icone: "fa-solid fa-feather-pointed", cor: "#2e8b57" },
	serpente: { nome: "Grêmio da Serpente", apelido: "Monstros", tendencias: "CM, CN, NM", icone: "fa-solid fa-staff-snake", cor: "#6a0dad" }
};

export const QUATRO_ELEMENTOS = {
	vento: { nome: "Teste do Vento", nd: 1, premio: "amuleto do conhecimento arcano", icone: "fa-solid fa-wind" },
	agua: { nome: "Teste da Água", nd: 2, premio: "anel da graça das águas", icone: "fa-solid fa-water" },
	terra: { nome: "Teste da Terra", nd: 3, premio: "manto dos dao", icone: "fa-solid fa-mountain" },
	fogo: { nome: "Teste do Fogo", nd: 4, premio: "bastão do favor de Wynna", icone: "fa-solid fa-fire" }
};

export const SITUACOES = {
	cursando: "Cursando",
	aprovado: "Aprovado",
	recuperacao: "Recuperação",
	reprovado: "Reprovado",
	trancado: "Trancado"
};

export const STATUS_SEMESTRE = {
	matricula: "Matrícula aberta",
	cursando: "Em curso",
	encerrado: "Encerrado"
};

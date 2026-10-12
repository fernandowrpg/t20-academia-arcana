/* Nomes: Heróis de Arton, Tabela 1-24 (Nomes de Personagens). */
export const NOMES = {
	humano: ["Hekker", "Dinlana", "Mouvo", "Khalmyrian", "Pidder", "Baziare", "Vikkander", "Andara", "Darezio", "Natuwa", "Orsen", "Kevan", "Tariana", "Valk", "Ergol", "Rilena", "Neria", "Vosser", "Zilth", "Xandara", "Belazio", "Egriana", "Molden", "Nilga", "Phadra", "Riales", "Portina", "Holdavir", "Yohll", "Astri", "Merthik", "Zasdre", "Agnigg", "Shivar"],
	anao: ["Bobrum", "Arthoram", "Dharumm", "Dharva", "Khodharann", "Thyrmah", "Movadhimm", "Kharadhan", "Vosthanum", "Dhenomm", "Khetradann", "Vorthrerem", "Theratra", "Mondhom", "Dhozardhum", "Hiradramm", "Ghoridri", "Mondharum", "Dhervadhara", "Heredrimatrim", "Dhorelonn", "Khedrurenn", "Thovattor", "Mortherimm", "Vothramin", "Gaudrimm", "Darandor", "Vormmir", "Dondarann", "Thammira", "Gadhara", "Rhommar", "Drovathir", "Bovidharimm"],
	dahllan: ["Calixta", "Tulipa", "Briara", "Nalia", "Íris", "Lily", "Suyane", "Rennia", "Asteria", "Dahl", "Ione", "Estrelícia", "Fresia", "Ianth", "Gardenia", "Ninfania", "Zandedia", "Dianthia", "Calen", "Neruma", "Flora", "Gerbera", "Hortensia", "Ixare", "Choe", "Trelitzia", "Echaea", "Alpinia", "Limeria", "Crisântemo", "Ergilla", "Hedera", "Ocarya", "Lisana"],
	elfo: ["Assalan", "Dandalla", "Thissalorian", "Yollaria", "Mivandre", "Aerillodala", "Phasdalian", "Govandar", "Morvalane", "Cissalia", "Erhamadoren", "Tallamasser", "Nielerendalan", "Yavallan", "Manalliare", "Ellanva", "Gillianare", "Narallandan", "Ansalloron", "Ollarandhan", "Gandolarane", "Glorillaniavar", "Nidallarian", "Denore", "Allava", "Ceris", "Mantalla", "Dallantalla", "Talleslena", "Allarandre", "Vallissaris", "Nillandra", "Missariel", "Yanara"],
	goblin: ["Molon", "Kralik", "Tarak", "Blakon", "Xismo", "Zakor", "Takor", "Tuzu", "Tapak", "Kinika", "Tavog", "Golak", "Bogg", "Zitt", "Vulma", "Karcar", "Gogola", "Gork", "Pakkug", "Dondon", "Raska", "Digg", "Pottak", "Kazunk", "Bink", "Fahuk", "Matran", "Xesto", "Kovvo", "Badum", "Geria", "Kekke", "Orgg", "Nithuk"],
	hynne: ["Dulla", "Donatto", "Minna", "Colita", "Melano", "Ortho", "Guévio", "Lelia", "Diggo", "Bolim", "Everla", "Nando", "Moringa", "Basil", "Tenga", "Malvio", "Tom", "Dida", "Gelisa", "Binoto", "Tutu", "Lanito", "Aggario", "Prilla", "Poltan", "Bilda", "Moira", "Vanne", "Gombo", "Erdesta", "Lazzo", "Pimb", "Orrs", "Ollir"],
	minotauro: ["Caius", "Lorcus", "Crassis", "Tissius", "Mantorio", "Astilus", "Khoskar", "Blarandus", "Taelio", "Cradus", "Zhabur", "Halssinos", "Ianaris", "Iosalis", "Tarkan", "Erius", "Eradorio", "Ocretio", "Maxandus", "Issius", "Lekariu", "Pallis", "Ghandor", "Quindalio", "Spurtius", "Pondus", "Sarius", "Tenalidis", "Lortamus", "Gaellio", "Daxidus", "Flanattus", "Maxxius", "Avenius"],
	qareen: ["Narav", "Quedan", "Sarid", "Ahtan", "Alzon", "Maquet", "Arid", "Bihalla", "Tahid", "Ubb", "Rahllira", "Jehel", "Murad", "Zilla", "Hesan", "Pharid", "Narud", "Suhed", "Dazalid", "Zorima", "Quotora", "Ynari", "Jolid", "Tazif", "Palan", "Zaldonay", "Alnari", "Jeddar", "Ishazar", "Belnira", "Haddan", "Olara", "Persite", "Razzi"]
};

const TODAS_AS_TABELAS = Object.keys(NOMES);

/* Raças de Tormenta20 e Heróis de Arton. As que não têm tabela própria de nomes usam a de outra raça. */
export const RACAS = {
	humano: { nome: "Humano", nomes: ["humano"], peso: 12 },
	anao: { nome: "Anão", nomes: ["anao"], peso: 4 },
	dahllan: { nome: "Dahllan", nomes: ["dahllan"], peso: 3 },
	elfo: { nome: "Elfo", nomes: ["elfo"], peso: 5 },
	goblin: { nome: "Goblin", nomes: ["goblin"], peso: 4 },
	lefou: { nome: "Lefou", nomes: TODAS_AS_TABELAS, peso: 3 },
	minotauro: { nome: "Minotauro", nomes: ["minotauro"], peso: 2 },
	qareen: { nome: "Qareen", nomes: ["qareen"], peso: 5 },
	golem: { nome: "Golem", nomes: ["humano"], peso: 1 },
	hynne: { nome: "Hynne", nomes: ["hynne"], peso: 4 },
	kliren: { nome: "Kliren", nomes: ["humano"], peso: 2 },
	medusa: { nome: "Medusa", nomes: ["humano"], peso: 1 },
	osteon: { nome: "Osteon", nomes: ["humano"], peso: 1 },
	sereia: { nome: "Sereia/Tritão", nomes: ["humano"], peso: 1 },
	silfide: { nome: "Sílfide", nomes: ["humano"], peso: 2 },
	suraggel: { nome: "Suraggel", nomes: ["humano"], peso: 2 },
	trog: { nome: "Trog", nomes: ["humano"], peso: 1 },
	duende: { nome: "Duende", nomes: ["humano"], peso: 1 },
	eiradaan: { nome: "Eiradaan", nomes: ["elfo"], peso: 1 },
	galokk: { nome: "Galokk", nomes: ["humano"], peso: 1 },
	"meio-elfo": { nome: "Meio-Elfo", nomes: ["humano", "elfo"], peso: 3 },
	satiro: { nome: "Sátiro", nomes: ["humano"], peso: 1 }
};

const T20 = "Tormenta20";
const HEROIS = "Heróis de Arton";
const DEUSES = "Deuses de Arton";

/* foco: atributo principal da classe; pv: [inicial, por nível]; pm: por nível. Classes variantes herdam os valores da classe básica quando o livro manda. */
export const CLASSES = {
	arcanista: { nome: "Arcanista", foco: "int", pv: [8, 2], pm: 6, peso: 30, arcana: true, livro: T20 },
	barbaro: { nome: "Bárbaro", foco: "for", pv: [24, 6], pm: 3, peso: 1, livro: T20 },
	bardo: { nome: "Bardo", foco: "car", pv: [12, 3], pm: 4, peso: 6, arcana: true, livro: T20 },
	bucaneiro: { nome: "Bucaneiro", foco: "des", pv: [16, 4], pm: 3, peso: 3, livro: T20 },
	cacador: { nome: "Caçador", foco: "des", pv: [16, 4], pm: 4, peso: 3, livro: T20 },
	cavaleiro: { nome: "Cavaleiro", foco: "for", pv: [20, 5], pm: 3, peso: 2, livro: T20 },
	clerigo: { nome: "Clérigo", foco: "sab", pv: [16, 4], pm: 5, peso: 5, livro: T20 },
	druida: { nome: "Druida", foco: "sab", pv: [16, 4], pm: 4, peso: 3, livro: T20 },
	guerreiro: { nome: "Guerreiro", foco: "for", pv: [20, 5], pm: 3, peso: 3, livro: T20 },
	inventor: { nome: "Inventor", foco: "int", pv: [12, 3], pm: 4, peso: 5, livro: T20 },
	ladino: { nome: "Ladino", foco: "des", pv: [12, 3], pm: 4, peso: 3, livro: T20 },
	lutador: { nome: "Lutador", foco: "for", pv: [20, 5], pm: 3, peso: 2, livro: T20 },
	nobre: { nome: "Nobre", foco: "car", pv: [16, 4], pm: 4, peso: 4, livro: T20 },
	paladino: { nome: "Paladino", foco: "car", pv: [20, 5], pm: 3, peso: 2, livro: T20 },
	treinador: { nome: "Treinador", foco: "car", pv: [12, 3], pm: 4, peso: 2, livro: HEROIS },
	alquimista: { nome: "Alquimista", foco: "int", pv: [12, 3], pm: 4, peso: 4, livro: HEROIS },
	atleta: { nome: "Atleta", foco: "for", pv: [20, 5], pm: 3, peso: 1, livro: HEROIS },
	burgues: { nome: "Burguês", foco: "car", pv: [12, 3], pm: 4, peso: 2, livro: HEROIS },
	duelista: { nome: "Duelista", foco: "des", pv: [16, 4], pm: 3, peso: 2, livro: HEROIS },
	ermitao: { nome: "Ermitão", foco: "sab", pv: [12, 3], pm: 4, peso: 1, livro: HEROIS },
	inovador: { nome: "Inovador", foco: "int", pv: [20, 5], pm: 3, peso: 1, livro: HEROIS },
	"machado-de-pedra": { nome: "Machado de Pedra", foco: "for", pv: [24, 6], pm: 3, peso: 1, livro: HEROIS },
	magimarcialista: { nome: "Magimarcialista", foco: "int", pv: [16, 4], pm: 4, peso: 4, arcana: true, livro: HEROIS },
	necromante: { nome: "Necromante", foco: "int", pv: [8, 2], pm: 6, peso: 4, arcana: true, livro: HEROIS },
	santo: { nome: "Santo", foco: "car", pv: [20, 5], pm: 4, peso: 1, livro: HEROIS },
	seteiro: { nome: "Seteiro", foco: "des", pv: [16, 4], pm: 4, peso: 1, livro: HEROIS },
	usurpador: { nome: "Usurpador", foco: "car", pv: [16, 4], pm: 5, peso: 1, livro: HEROIS },
	vassalo: { nome: "Vassalo", foco: "for", pv: [20, 5], pm: 3, peso: 1, livro: HEROIS },
	ventanista: { nome: "Ventanista", foco: "des", pv: [12, 3], pm: 4, peso: 2, livro: HEROIS },
	frade: { nome: "Frade", foco: "sab", pv: [12, 3], pm: 6, peso: 3, livro: DEUSES }
};

export const ATRIBUTOS = { for: "Força", des: "Destreza", con: "Constituição", int: "Inteligência", sab: "Sabedoria", car: "Carisma" };

/* Distribuições de 10 pontos (compra de atributos de Tormenta20) com um único valor mais alto. */
export const DISTRIBUICOES = [
	[4, 2, 1, 1, 0, -1],
	[4, 2, 1, 0, 0, 0],
	[4, 2, 2, 0, 0, -1],
	[4, 1, 1, 1, 0, 0],
	[3, 2, 2, 1, 1, 0],
	[3, 2, 2, 2, 0, 0]
];

export const NIVEL_MAXIMO = 20;

export const DIAS_LETIVOS = ["1º dia", "2º dia", "3º dia", "4º dia", "5º dia"];

export const TURNOS = ["Manhã", "Começo da tarde", "Fim da tarde"];

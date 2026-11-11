/*
 * Os 20 mundos dos deuses na ordem do Roteiro da Expedição (cronologia da Criação).
 * Texto próprio, resumido da Wiki Divina da campanha. As regras são o ponto de partida:
 * o mestre edita tudo pelo editor de planos, e o que ele grava substitui o texto daqui.
 * Uma regra por linha; **negrito** e *itálico* funcionam.
 * As cores e o desenho de cada plano ficam em styles/planos.css, pelo atributo data-aa-plano.
 */

export const ATOS = {
	1: "Ato I: Os Conceitos",
	2: "Ato II: O Nascimento da Vida",
	3: "Ato III: Povos e Virtudes",
	4: "Ato IV: A Revolta dos Três",
	5: "Ato V: A Era dos Ascendidos"
};

const NOTION = "https://app.notion.com/p/";

export const PLANOS = [
	{
		id: "magika",
		nome: "Magika",
		deus: "Wynna",
		portfolio: "Magia",
		ato: 1,
		nivel: 2,
		sobe: true,
		perigo: "Médio",
		icone: "fa-solid fa-wand-sparkles",
		wiki: `${NOTION}4136758b4ce08151b981d37d47b203af`,
		regraTitulo: "Feitiço Inacabado",
		regras: [
			"**Magias arcanas: –1 PM** (mínimo 1). O limite de PM para magias arcanas conta como +1.",
			"**Magia Vazia:** lançar a mesma magia duas vezes na mesma cena exige Vontade (CD 12 + custo em PM). Falha: a magia falha e os PM são perdidos.",
			"**Engenhocas e itens tecnológicos:** 50% de chance de falhar a cada uso.",
			"**Pensamento é matéria:** quem ficar abalado vê o medo ganhar forma; a ilusão causa 1 de dano psíquico por rodada até ser desacreditada (Vontade CD 12)."
		]
	},
	{
		id: "ordine",
		nome: "Ordine",
		deus: "Khalmyr",
		portfolio: "Justiça",
		ato: 1,
		nivel: 3,
		sobe: false,
		perigo: "Baixo",
		icone: "fa-solid fa-scale-balanced",
		wiki: `${NOTION}4136758b4ce081f88008e7876c10e274`,
		regraTitulo: "Lei do Mais Provável",
		regras: [
			"**Todo d20 é tratado como 10.** Não há críticos nem falhas automáticas; rerrolagens e poderes de sorte não funcionam.",
			"**Desafiar a Ordem:** gastar 1 PM permite rolar normalmente. O personagem fica marcado pelos anjos até o fim da cena (–2 em Diplomacia com celestiais).",
			"**Abjuração e Adivinhação: –1 PM.** Ilusão e Encantamento: +1 PM, e o alvo recebe +5 no teste de resistência.",
			"No Tribunal, Enganação falha automaticamente."
		]
	},
	{
		id: "al-gazara",
		nome: "Al-Gazara",
		deus: "Nimb",
		portfolio: "Caos e Sorte",
		ato: 1,
		nivel: 3,
		sobe: true,
		perigo: "Imprevisível",
		icone: "fa-solid fa-dice",
		wiki: `${NOTION}4136758b4ce0816babc5f85b4224bf0a`,
		regraTitulo: "Dados da Casa",
		regras: [
			"**Ao lançar uma magia, role 1d6:** 1 = custa o dobro de PM; 6 = não custa PM; 2–5 = normal.",
			"**Poderes de destino:** cada um pode ser usado 1/cena sem custo de PM.",
			"**1 natural em d20:** role na Tabela do Caos (d6): 1 gravidade invertida por 1 rodada; 2 troca de lugar com o aliado mais distante; 3 invisível até agir; 4 recupera 1d4 PM; 5 surge um duende que exige uma aposta; 6 fala só em rimas pela cena (–2 em magias verbais).",
			"**Inflação instantânea:** todo pagamento exige Jogatina CD 18, ou o preço dobra."
		]
	},
	{
		id: "solaris",
		nome: "Solaris",
		deus: "Azgher",
		portfolio: "Sol",
		ato: 1,
		nivel: 4,
		sobe: true,
		perigo: "Alto",
		icone: "fa-solid fa-sun",
		wiki: `${NOTION}4136758b4ce081fd8176fa23caf33cf2`,
		regraTitulo: "Sem Sombra",
		regras: [
			"**Magias de fogo ou luz: –1 PM e +1 na CD.** Ilusão e magias de trevas: +2 PM.",
			"**Furtividade –5**, exceto em movimento contínuo.",
			"**A Mentira Queima:** cada mentira com Enganação causa 1d4 de dano de fogo ao mentiroso.",
			"**Canalizar energia positiva:** +1 dado.",
			"**Calor:** a cada 2 horas no deserto, Fortitude CD 12 (+1 por teste anterior), ou fatigado.",
			"*Ovo de fênix:* aquece demais; quem o carrega faz Fortitude CD 12 por dia para mantê-lo calmo."
		]
	},
	{
		id: "sombria",
		nome: "Sombria",
		deus: "Tenebra",
		portfolio: "Trevas",
		ato: 1,
		nivel: 5,
		sobe: false,
		perigo: "Alto",
		icone: "fa-solid fa-moon",
		wiki: `${NOTION}4136758b4ce081f1b7bff2e3f809299e`,
		regraTitulo: "Noite Eterna",
		regras: [
			"**Necromancia e Ilusão: –1 PM.** Magias de luz: +2 PM e alcance reduzido em uma categoria.",
			"**Canalizar energia negativa:** +1 dado. Magias de cura curam 1 PV a menos por dado (mínimo 1 por dado).",
			"**Luz atrai:** cada cena com luz mágica acesa dá 1 em 1d6 de encontro aleatório.",
			"**Mortos-vivos e criaturas com visão no escuro:** +2 em testes.",
			"*Ovo de fênix:* esfria; exige calor mágico ou 1 PM por dia para não perder vitalidade."
		]
	},
	{
		id: "vitalia",
		nome: "Vitalia",
		deus: "Lena",
		portfolio: "Vida",
		ato: 2,
		nivel: 5,
		sobe: true,
		perigo: "Baixo (emocional)",
		icone: "fa-solid fa-seedling",
		wiki: `${NOTION}4136758b4ce08166b18ed512bce51175`,
		regraTitulo: "Vida Transbordante",
		regras: [
			"**Curas:** +1 PV por dado. Descanso recupera o dobro de PV.",
			"**Necromancia que causa dano: +2 PM.**",
			"**Vitalia Sente:** causar dano letal a uma criatura viva exige Vontade CD 15, ou o agressor fica abalado pela cena.",
			"**Excesso de Vida:** cura acima do máximo vira PV temporários, mas exige Fortitude CD 15; falha: brotos na pele e –1 em Destreza até o próximo descanso.",
			"*Ovo de fênix:* pulsa forte; pela primeira vez, algo se mexe lá dentro."
		]
	},
	{
		id: "pelagia",
		nome: "Pelágia",
		deus: "Oceano",
		portfolio: "Mares (desaparecido)",
		ato: 2,
		nivel: 6,
		sobe: true,
		perigo: "Alto",
		icone: "fa-solid fa-water",
		wiki: `${NOTION}4136758b4ce0812a882cd2de6106fb1b`,
		regraTitulo: "Sob as Ondas",
		regras: [
			"**Magias de fogo submersas: +2 PM** e metade do dano.",
			"**Magias de água, frio e eletricidade: –1 PM.** Forma Selvagem aquática e poderes de Oceano: –1 PM.",
			"**Ira contra Covardes:** quem se recusar a mergulhar sofre –2 em testes de resistência até mergulhar.",
			"**Pressão:** abaixo de 50 m, Fortitude CD 15 (+2 a cada 50 m) por hora, ou perde 1d6 PV e fica fatigado.",
			"**Desde o sumiço do deus:** role 1d6 por dia; com 1, surge uma tempestade descontrolada.",
			"*Ovo de fênix:* esfria; precisa ser protegido do frio da água."
		]
	},
	{
		id: "arboria",
		nome: "Arbória",
		deus: "Allihanna",
		portfolio: "Natureza",
		ato: 2,
		nivel: 7,
		sobe: true,
		perigo: "Alto",
		icone: "fa-solid fa-tree",
		wiki: `${NOTION}4136758b4ce081c7a551c851eaa2d7a6`,
		regraTitulo: "O Grande Ciclo",
		regras: [
			"**Convocação de animais ou plantas e magias de druida: –1 PM.**",
			"**Companheiros animais e parceiros feras:** +2 em testes.",
			"**Devotos de Allihanna** ignoram terreno difícil natural.",
			"**Caça por esporte:** matar um animal que não ameaçava o grupo atrai a *Marca do Caçador Ingrato* e um Animal Renascido.",
			"**Abater espiões de Megalokk:** +1d4 PM temporários por dia durante a estadia."
		]
	},
	{
		id: "chacina",
		nome: "Chacina",
		deus: "Megalokk",
		portfolio: "Monstros",
		ato: 2,
		nivel: 8,
		sobe: false,
		perigo: "Extremo",
		icone: "fa-solid fa-paw",
		wiki: `${NOTION}4136758b4ce0814da7aadbe26c68e8fc`,
		regraTitulo: "A Bênção de Megalokk",
		regras: [
			"**Fúria e poderes brutais (bárbaro e lutador): –1 PM.** A Fúria causa +2 de dano.",
			"**Transmutação em si mesmo: –1 PM.** Encantamento: +2 PM, e criaturas ferais recebem +5 para resistir.",
			"**Cura mágica: +1 PM.**",
			"**Relógio da Bênção:** a cada dia, Fortitude ou Vontade CD 15 (+2 por dia). Cada falha dá um traço (chifres, escamas ou presas) e –2 em Diplomacia por traço. Com 4 falhas, a transformação é permanente."
		]
	},
	{
		id: "terapolis",
		nome: "Terápolis",
		deus: "Tanna-Toh",
		portfolio: "Conhecimento",
		ato: 3,
		nivel: 8,
		sobe: true,
		perigo: "Baixo/Médio",
		icone: "fa-solid fa-book-open",
		wiki: `${NOTION}4136758b4ce0815eaea6cc20b479cc59`,
		regraTitulo: "Juramento da Verdade",
		regras: [
			"**Adivinhação: –1 PM.** Ilusão: +2 PM.",
			"**Conhecimento, Investigação e Misticismo:** +2 e podem ser usadas sem treinamento.",
			"**Mentir na Biblioteca dos Planos:** Vontade CD 20, ou o mentiroso é expulso para uma Selva de Pedra aleatória.",
			"**Bardos:** Inspiração custa –1 PM quando narra um fato verdadeiro.",
			"**Monstros de livro:** *Fraqueza Literária* (vulneráveis a fogo; citar o final certo da história causa +2d6 de dano)."
		]
	},
	{
		id: "sora",
		nome: "Sora",
		deus: "Lin-Wu",
		portfolio: "Honra",
		ato: 3,
		nivel: 9,
		sobe: true,
		perigo: "Médio",
		icone: "fa-solid fa-torii-gate",
		wiki: `${NOTION}4136758b4ce081ea8a1ce912215f0f42`,
		regraTitulo: "O Caminho da Honra",
		regras: [
			"**Desafio declarado:** poderes de combate e habilidades com custo em PM custam –1 PM contra um alvo desafiado abertamente antes do combate.",
			"**Ataque furtivo, fintas e emboscadas:** metade do dano extra, e –2 em Diplomacia em Sora pelo resto da estadia.",
			"**Encantamento contra quem nunca quebrou sua palavra: +2 PM.**",
			"**Perfume das Cerejeiras:** descanso longo nos jardins recupera PM extras iguais a metade do nível.",
			"**Olhar do Dragão:** em Takayama, Enganação falha automaticamente."
		]
	},
	{
		id: "serena",
		nome: "Serena",
		deus: "Marah",
		portfolio: "Paz e Amor",
		ato: 3,
		nivel: 10,
		sobe: false,
		perigo: "Baixo (insidioso)",
		icone: "fa-solid fa-dove",
		wiki: `${NOTION}4136758b4ce0819eb819f2f7a8405222`,
		regraTitulo: "A Paz Imposta",
		regras: [
			"**Magias que causam dano: +2 PM.** Encantamento e Cura: –1 PM.",
			"**Inspiração (bardo) e poderes de Atuação: –1 PM.**",
			"**Fúria:** ativá-la exige Vontade CD 20.",
			"**Ataques letais:** cada ataque exige Vontade CD 15; falha perde a ação.",
			"**Relógio da Rendição:** a cada dia, Vontade CD 15 (+2 por dia). Cada falha marca 1 de 4 pontos de Identidade; ao zerar, o aluno não quer mais partir."
		]
	},
	{
		id: "odisseia",
		nome: "Odisseia",
		deus: "Valkaria",
		portfolio: "Aventura e Humanidade",
		ato: 4,
		nivel: 10,
		sobe: true,
		perigo: "Médio/Alto",
		icone: "fa-solid fa-compass",
		wiki: `${NOTION}4136758b4ce081678bb5e95c2249b390`,
		regraTitulo: "Sem Estagnação",
		regras: [
			"**Descanso longo só em Thellas.** Em qualquer outro lugar, um encontro interrompe o descanso.",
			"**Vitória é combustível:** vencer um encontro de ND igual ou maior que o nível do grupo recupera 1d4 PM e 2d6 PV de cada participante.",
			"**Poderes de destino e de combate: –1 PM.**",
			"**Fugir é caro:** magias usadas para evitar conflito custam +2 PM.",
			"**Recompensas generosas:** todo tesouro encontrado vale o dobro em T$."
		]
	},
	{
		id: "drashantyr",
		nome: "Drashantyr",
		deus: "Kallyadranoch",
		portfolio: "Dragões e Poder",
		ato: 4,
		nivel: 11,
		sobe: true,
		perigo: "Extremo",
		icone: "fa-solid fa-dragon",
		wiki: `${NOTION}4136758b4ce081c6b9cff22d2da8ff89`,
		regraTitulo: "Tributo ao Poder",
		regras: [
			"**Aprimoramentos de magias arcanas: –1 PM** no total por magia.",
			"**Magias divinas de outros deuses: +1 PM.** Devotos de Wynna pagam +2 PM.",
			"**Encantamento contra dragões** falha automaticamente.",
			"**Cobiça:** ao ver um tesouro de covil, Vontade CD 20; falha obriga a pegar algo (e o dragão dono sente o ladrão).",
			"**Elementos:** magias de fogo, frio, eletricidade, ácido, trevas ou luz recebem +1 na CD."
		]
	},
	{
		id: "venomia",
		nome: "Venomia",
		deus: "Sszzaas",
		portfolio: "Traição",
		ato: 4,
		nivel: 12,
		sobe: true,
		perigo: "Letal",
		icone: "fa-solid fa-staff-snake",
		wiki: `${NOTION}4136758b4ce081d094f7ca1e0514c894`,
		regraTitulo: "Ar Envenenado",
		regras: [
			"**Necromancia e magias de veneno: –1 PM.** Venenos em geral: +2 na CD.",
			"**Cura e remoção de condições: +1 PM.**",
			"**Adivinhação** sempre revela também uma mentira plausível, e o mestre não diz qual é qual.",
			"**Névoa:** a cada hora, Fortitude CD 20; falha: 1d6 (1 perde 2d6 PV; 2 fraco; 3 lento; 4 confuso 1 rodada; 5 alucinação, –5 em Percepção; 6 nada).",
			"**Comida** apodrece em 1 dia. Fogueiras de madeira local exigem Vontade CD 20 de quem estiver ao redor."
		]
	},
	{
		id: "ramknal",
		nome: "Ramknal",
		deus: "Hyninn",
		portfolio: "Trapaça",
		ato: 4,
		nivel: 13,
		sobe: true,
		perigo: "Alto",
		icone: "fa-solid fa-mask",
		wiki: `${NOTION}4136758b4ce081c98509d8014d91e04b`,
		regraTitulo: "Espaço de Masmorra",
		regras: [
			"**Teletransporte e visão no escuro** não funcionam para invasores.",
			"**Ilusão: –1 PM.** Magias de localização falham.",
			"**Ataque furtivo: +1d6.**",
			"**Tudo se paga com apostas:** comprar, dormir ou curar exige Jogatina ou Enganação CD 28.",
			"**A porta óbvia é a errada:** caminhos que parecem seguros têm armadilhas (+5 na CD de Percepção para notar)."
		]
	},
	{
		id: "thworakkar",
		nome: "Thworakkar",
		deus: "Thwor",
		portfolio: "Goblinoides",
		ato: 5,
		nivel: 14,
		sobe: true,
		perigo: "Alto",
		icone: "fa-solid fa-gears",
		wiki: `${NOTION}4136758b4ce08159a8e1c1536cef9f22`,
		regraTitulo: "O Akzath",
		regras: [
			"**Engenhocas e itens tecnológicos funcionam sem falha.** Itens superiores ganham +1 melhoria temporária no plano.",
			"**Magias arcanas: +1 PM** (Wynna não tem alcance aqui).",
			"**Akzath:** 1/sessão, ao cair a 0 PV, role 1d20; com 11 ou mais, o personagem fica com 1 PV.",
			"**Ofício (engenhoqueiro, armeiro):** +5, e fabricar leva metade do tempo.",
			"**Ruído:** –5 em Percepção auditiva.",
			"*Ovo de fênix:* brilha aqui, onde se cumpriu a última grande profecia de Thyatis."
		]
	},
	{
		id: "werra",
		nome: "Werra",
		deus: "Arsenal",
		portfolio: "Guerra",
		ato: 5,
		nivel: 15,
		sobe: true,
		perigo: "Extremo",
		icone: "fa-solid fa-shield-halved",
		wiki: `${NOTION}4136758b4ce0817eacd9ea5d3d7e810d`,
		regraTitulo: "Disciplina de Guerra",
		regras: [
			"**Poderes de combate e habilidades marciais com custo em PM: –1 PM.**",
			"**Encantamento de paz** (acalmar, enfeitiçar): +2 PM.",
			"**Arma batizada:** uma arma que ainda não venceu um combate em Werra sofre –2 em ataques até o batismo.",
			"**Comando:** ação de movimento para dar ordens; aliados que ouvirem recebem +2 no próximo ataque (1/rodada).",
			"**Sem salvo-conduto,** o grupo é recrutado à força."
		]
	},
	{
		id: "shandkrar",
		nome: "Shand'krar",
		deus: "Aharadak",
		portfolio: "Tormenta",
		ato: 5,
		nivel: 16,
		sobe: true,
		perigo: "Extremo",
		icone: "fa-solid fa-bolt",
		wiki: `${NOTION}4136758b4ce081f7a30dff1c618f1247`,
		regraTitulo: "Tudo É Lefeu",
		regras: [
			"**Insanidade da Tormenta** ao entrar e a cada 8 horas (Vontade CD 25).",
			"**Poderes da Tormenta: –1 PM**, mas cada uso exige Vontade CD 25; falha concede mais um poder da Tormenta, involuntário.",
			"**Magias divinas de Allihanna, Oceano, Khalmyr, Azgher, Thyatis e Lena: +2 PM.**",
			"**Matar, sem saber, um ser vivo do plano** deixa simbiontes reanimá-lo na rodada seguinte.",
			"**Aço-rubi** ignora a redução de dano dos lefeu daqui.",
			"*Ovo de fênix:* retrai-se e esfria. Algo no Olho de Aharadak quer o ovo."
		]
	},
	{
		id: "pyra",
		nome: "Pyra",
		deus: "Thyatis",
		portfolio: "Ressurreição e Profecia",
		ato: 5,
		nivel: 17,
		sobe: false,
		perigo: "Alto",
		icone: "fa-solid fa-fire",
		wiki: `${NOTION}4136758b4ce081a1b98cdf6c3bcff885`,
		regraTitulo: "Segunda Chance",
		regras: [
			"**Magias de fogo, de cura e de Adivinhação: –1 PM.**",
			"**Calor fulminante:** Fortitude CD 25 por hora sem proteção contra fogo.",
			"**Regra de Triunphus:** quem morrer aqui volta à vida, mas não pode sair até completar um feito épico que agrade a Thyatis. Sair sem isso é morte permanente.",
			"**Redenção ativa:** quem reconhecer publicamente um erro do passado recebe +2 em todos os testes da cena seguinte.",
			"*Ovo de fênix:* perto da Montanha de Fogo, concede a quem o carrega resistência a fogo 10 e +1 PM por rodada (máximo +5)."
		]
	}
];

export const PLANOS_POR_ID = new Map(PLANOS.map((p, i) => [p.id, { ...p, ordem: i + 1 }]));

/* CD de testes estendidos e desafios de perícia do Roteiro: 18 + nível do plano. */
export function cdDoPlano(plano) {
	return 18 + (plano?.nivel ?? 0);
}

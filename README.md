# Academia Arcana

Módulo para **Foundry VTT v13** e o sistema **Tormenta20** que acompanha a vida acadêmica dos alunos da Grande Academia Arcana de Arton: ficha do aluno, matrícula com as disciplinas do *Manual do Arcano* agrupadas pelas perícias de Tormenta20, boletim por semestre e um compêndio de referência sobre a Academia.

| Requisito | Versão |
| --- | --- |
| Foundry VTT | 13 (verificado na 13.351) |
| Sistema Tormenta20 | 1.5.015 |

## Recursos

- **Ficha do Aluno**: grêmio, ingresso, bolsa, situação do curso, desempenho (semestres, aprovações, reprovações, coeficiente), Teste dos Quatro Elementos e anotações.
- **Matrícula**: 158 disciplinas do *Manual do Arcano* agrupadas por perícia de Tormenta20. Nas disciplinas de *Ofício (à escolha)* o aluno escolhe qual ofício usar: os oficiais (Armeiro, Artesão, Alquimista, Cozinheiro, Alfaiate), Engenhoqueiro ou um ofício personalizado da ficha. Bloqueia disciplinas sem pré-requisito, já aprovadas ou especiais não ofertadas; respeita mínimo e máximo por semestre; mostra a perícia predominante do semestre. Tem busca e filtro "somente disponíveis".
- **Boletim**: um quadro por semestre com nota, situação (Cursando, Aprovado, Recuperação, Reprovado, Trancado), média, observações e um botão que rola a perícia de T20 do personagem (ou o ofício escolhido).
- **Painel de alunos**: widget flutuante, sempre visível, com vida (PV), mana (PM), resumo das notas do semestre mais recente e atalho para a matrícula de cada aluno.
- **Painel de ameaças**: widget separado que aparece durante o combate com PV, PM, ND, Defesa, iniciativa e condições de cada ameaça.
- **Secretaria** (mestre): admissão de personagens e ações em lote (abrir matrículas, iniciar e encerrar semestre).
- **Catálogo editável** (mestre): trocar a perícia de T20 de qualquer disciplina, ocultar disciplinas, ofertar disciplinas especiais e criar disciplinas da mesa. Disciplinas com numeral romano encadeiam pré-requisitos automaticamente.
- **Compêndio** *Academia Arcana: Compêndio* com 16 páginas: visão geral, acesso, período letivo, admissão, classes, campus, grêmios, disciplinas, Teste dos Quatro Elementos, corpo docente, Raschid, itens e guia de uso.
- **Macros** prontas no compêndio *Academia Arcana: Macros*.

As regras de **vida estudantil** do livro (atividades do semestre e os testes de Estudo, Frustração e Convívio Social) **não** são automatizadas: o compêndio tem uma página reservada para a adaptação a T20, e o resultado de cada semestre é lançado pelo mestre.

## Adaptação das perícias

O livro usa as perícias de Tormenta RPG; o módulo usa as de Tormenta20:

| Manual do Arcano | Tormenta20 |
| --- | --- |
| Adestrar Animais | Adestramento |
| Conhecimento (arcano), Identificar Magia | Misticismo |
| Conhecimento (engenharia) | Ofício: Engenhoqueiro |
| Conhecimento (geografia, história, Tormenta) | Conhecimento |
| Conhecimento (natureza) | Sobrevivência |
| Conhecimento (nobreza) | Nobreza |
| Conhecimento (religião) | Religião |
| Ofício (alquimia) | Ofício: Alquimista |
| Ofício (administração), Ofício (metalurgia) | Ofício (à escolha do aluno) |
| Obter Informação (bônus do Grêmio do Falcão) | Investigação |
| Atletismo, Atuação, Cura, Diplomacia, Furtividade, Iniciativa, Intuição, Ladinagem, Percepção, Sobrevivência | mesmo nome |

## Instalação

No Foundry, em **Add-on Modules → Install Module**, cole a URL do manifesto:

```
https://github.com/fernandowrpg/t20-academia-arcana/releases/latest/download/module.json
```

Ative o módulo no mundo Tormenta20.

## Como usar

1. **Admissão**: o mestre clica em **Academia** no cabeçalho da ficha do personagem (ou usa a **Secretaria da Academia** no diretório de Atores) e admite o personagem.
2. **Abrir matrícula**: na Ficha do Aluno (ou em lote pela Secretaria), o mestre abre a matrícula do próximo semestre.
3. **Matrícula**: o jogador escolhe as disciplinas na aba **Matrícula**.
4. **Iniciar semestre**: o mestre fecha a matrícula.
5. **Boletim**: o mestre lança notas e situação de cada disciplina.
6. **Encerrar semestre**: só é permitido quando todas as disciplinas têm situação final.

Configurações em **Configure Settings → Academia Arcana**: mínimo e máximo de disciplinas, semestres regulares, limite de semestres, se jogadores fazem a própria matrícula, uso de notas numéricas, exibição dos painéis e o editor do catálogo.

### Painéis

Os dois painéis ficam flutuando sobre a mesa. Arraste pelo título para mover (clique duplo no título volta à posição padrão) e use a seta para alternar entre a versão completa e a compacta. A posição e o modo ficam salvos por navegador, e cada usuário pode desligar um painel nas configurações do módulo.

- **Alunos**: lista os alunos ativos ou com o curso trancado. O mestre vê todos; o jogador vê os personagens em que tem permissão de observador ou dono. Cada aluno mostra PV, PM, o semestre mais recente com notas (média, aprovações, reprovações, pendências e, ao clicar, as disciplinas) e o botão **Matrícula**, que abre direto a aba de matrícula e fica destacado enquanto a matrícula está aberta.
- **Ameaças**: aparece quando o combate é iniciado e some quando ele termina. Lista os combatentes sem jogador dono cujo token não é amistoso, na ordem de iniciativa, com destaque para quem está na vez. Clicar no nome centraliza o token; clicar no retrato abre a ficha. Por padrão só o mestre vê; em **Painel de ameaças para jogadores** ele pode liberar o estado aproximado (sem números) ou os valores completos. Ameaças ocultas nunca aparecem para jogadores.

### Correio da Academia

Abre pelo envelope no painel de alunos, pela Secretaria ou pela macro. À esquerda ficam os outros alunos (personagens e NPCs); à direita, a conversa com o histórico completo.

- **Quem escreve**: cada jogador escreve pelos personagens que controla. O mestre escolhe em nome de qual aluno escrever, o que serve para responder como os NPCs, e consegue ler todas as conversas.
- **Grupos**: o botão ao lado do nome do remetente abre um grupo com nome e dois ou mais colegas. Todos os participantes veem as mensagens. O ícone de engrenagem no topo do grupo adiciona ou remove participantes: pode usá-lo quem criou o grupo (com o mestre conectado, que é quem ajusta os donos da nota) e o próprio mestre. A conversa registra quem entrou e quem saiu; quem sai deixa de ver a nota, e quem entra passa a ver o histórico inteiro. Quem criou o grupo não pode ser removido.
- **Lida ou não lida**: cada mensagem que você enviou mostra um visto duplo e "lida" quando o destinatário abriu a conversa, ou um visto simples e "não lida". Em grupo, a marca diz quantos leram, e a dica lista quem leu e quem falta. As mensagens recebidas que você ainda não tinha visto aparecem com a marca "nova" até você trocar de conversa. O mestre vê a marca de leitura de todas as mensagens.
- **Avisar quando eu ler**: a caixa abaixo do nome do remetente é de cada aluno. Desmarcada, os colegas veem "leitura não informada" nas mensagens enviadas a ele, mesmo as que ele já tinha lido antes. O aluno continua vendo normalmente o que ainda não leu. Quando o mestre lê uma conversa escrevendo como personagem de jogador, isso não conta como leitura do personagem.
- **Edição pelo mestre**: o lápis em cada mensagem troca o texto. O texto anterior nunca é apagado: vai para o *Histórico de edições* da mensagem. Só o mestre vê esse histórico e a marca de "editada"; o olho ao lado revela (ou volta a ocultar) as edições daquela mensagem para os jogadores.
- **Itens**: escolha um item do inventário do remetente na lista (ou arraste da ficha para a área de escrita) e, se houver mais de um, a quantidade. Ao enviar, o item sai da ficha do remetente e fica guardado na mensagem; o destinatário (ou o mestre, no caso de NPCs) clica em **Receber** para colocá-lo na própria ficha. Num grupo, você escolhe qual colega recebe. Se o destinatário já tiver um item igual, ele entra como uma linha separada no inventário.
- **Onde fica guardado**: cada conversa é uma nota (Journal) na pasta *Correio da Academia*, e cada mensagem é uma página dela. Os donos da nota são os jogadores dos alunos participantes; os demais não têm acesso. O ícone de livro no topo da conversa abre a nota. Quando um personagem muda de jogador, o mestre conectado ajusta os donos das notas.
- **Mestre conectado**: só é necessário para abrir uma conversa nova quando o jogador não tem a permissão *Criar notas* do Foundry (por padrão, só jogadores de confiança têm). Mensagens em conversas que já existem não dependem do mestre.
- **Histórico garantido**: qualquer alteração no texto de uma mensagem, pela janela ou direto na nota, guarda o texto anterior no histórico. Só o mestre pode apagar mensagens ou conversas.
- **Privacidade das edições**: o histórico de edições fica na própria página da nota. A janela só o mostra aos jogadores quando o mestre revela, mas um dono da nota que saiba usar o console do navegador consegue lê-lo.
- A configuração **Jogadores usam o correio** liga ou desliga o acesso dos jogadores.

### Tema Scriptorium

O módulo traz um tema de escola de magia: janelas como rolos de pergaminho, cabeçalhos em forma de haste de madeira com ponteiras de latão, tinta sépia, roxo arcano e dourado divino. Em **Configure Settings → Academia Arcana → Tema Scriptorium**, cada usuário escolhe:

- **Foundry inteiro e janelas do módulo** (padrão): cobre janelas, barra lateral, chat, controles de cena, abas de cena, macros e lista de jogadores.
- **Somente as janelas e painéis do módulo**.
- **Desligado**.

A escolha vale só para aquele navegador e recarrega a página. O tema é claro: as janelas cobertas passam a usar o esquema claro do Foundry. As regras gerais têm prioridade baixa de propósito, para que fichas de sistema e outros módulos com estilo próprio continuem mandando na sua aparência. As fontes (Cinzel e IM Fell English) vêm do Google Fonts; sem internet, o Foundry usa fontes parecidas.

### Gerador de Alunos

Na Secretaria, **Gerar alunos** cria colegas para povoar a Academia. O mestre pode fixar nível, período, raça e classe; o que ficar em branco ou em *Aleatório* é sorteado, junto com nome, atributos, grêmio, histórico de disciplinas e notas.

- **Nível e período andam juntos**, um nível por semestre: informe só o nível e o período acompanha (até o último semestre regular); informe só o período e o nível acompanha; em branco, os dois são sorteados. Se você informar os dois, o módulo respeita. Ao **abrir matrículas** em lote, cada NPC gerado sobe um nível.

- As fichas são do tipo **personagem**, sem jogador dono (só o mestre controla), com token **neutro**, e vão para a pasta de atores *Alunos da Academia*.
- A ficha recebe a raça, um item de classe com o nível escolhido (é dele que o sistema Tormenta20 calcula nível, PV e PM) e um resumo na biografia.
- Os atributos são sorteados entre distribuições de 10 pontos da compra de atributos, com o maior valor no atributo principal da classe (Inteligência para arcanistas, Força para guerreiros etc.). Depois o aluno recebe +2 nesse atributo e +1 em outros dois sorteados; na ficha, esse bônus fica no campo racial do atributo.
- **Parceiro**: cada aluno tem um tipo de parceiro de *Tormenta20* (capítulo 6) definido pela classe, para quando acompanhar um personagem de jogador: arcanistas são adeptos, destruidores ou magivocadores; guerreiros, combatentes; clérigos, médicos; e assim por diante. O grau acompanha o nível do aluno: iniciante até o 4º nível, veterano do 5º ao 10º e mestre do 11º em diante. O parceiro aparece na lista do gerador, na Secretaria, nos colegas de turma do calendário e na biografia da ficha. As perícias das disciplinas aprovadas e em curso ficam marcadas como treinadas.
- Nomes: Tabela 1-24 de *Heróis de Arton*. Raças sem tabela própria usam a tabela humana (eiradaan usa a élfica; meio-elfo, a humana ou a élfica; lefou, qualquer uma).
- Classes: as 14 de *Tormenta20*, o treinador e as 14 variantes de *Heróis de Arton* e o frade de *Deuses de Arton*. Arcanistas são os mais comuns.
- Os NPCs tendem a se matricular nas disciplinas que os personagens cursam. Ao **abrir matrículas** em lote eles escolhem as disciplinas sozinhos, e ao **encerrar o semestre** em lote recebem notas sorteadas nas disciplinas pendentes.

### Calendário do Período Letivo

Abre pela Secretaria, pelo ícone de calendário no painel de alunos ou pela macro. Mostra a semana letiva (5 dias, 3 turnos) com uma aula por disciplina e quem está em cada turma: personagens em destaque e NPCs ao lado. Abaixo da grade, a lista **Colegas de turma** resume quais NPCs dividem aula com quais personagens.

- O filtro alterna entre as aulas dos personagens, as de um personagem só e todas as aulas da Academia.
- Os horários são distribuídos evitando choque entre as aulas de um mesmo aluno e ficam salvos no mundo. O mestre muda o horário de uma turma no próprio cartão ou usa **Redistribuir**.
- A grade se adapta à largura da janela: cinco colunas quando há espaço, um dia por linha em janelas médias e uma lista em janelas estreitas.
- A configuração **Jogadores veem o calendário** controla o acesso dos jogadores.

As regras de matrícula e avaliação estão em [docs/regras-da-academia.md](docs/regras-da-academia.md), em Markdown compatível com o Notion.

### API

```js
const api = game.modules.get("t20-academia-arcana").api;
api.abrir(actor);
api.secretaria();
api.catalogo();
api.calendario();
api.gerador();
api.correio();
api.painelAlunos();
api.painelAmeacas();
api.lerAluno(actor);
```

Os dados ficam no ator em `flags["t20-academia-arcana"].aluno`.

## Desenvolvimento

Requer Node.js 18 ou superior.

```bash
npm install
npm run build
```

- `npm run build:packs`: gera os compêndios LevelDB em `packs/` a partir de `src/compendio` (páginas HTML) e `src/macros`. A página **Disciplinas** é gerada a partir de `module/data/disciplinas.mjs`, a mesma fonte usada pela interface.
- `npm run build:release`: atualiza `module.json` (versão e URLs) e cria `dist/module.json` e `dist/module.zip`.
- `npm run unpack`: extrai os packs para `extraido/`, só para conferência.

Para testar localmente, copie (ou crie um link simbólico para) a pasta do projeto em `Data/modules/t20-academia-arcana` depois de rodar `npm run build:packs`.

### Estrutura

```
module/            código do módulo (main.mjs, logica.mjs, config.mjs, apps/, data/)
templates/         templates Handlebars das janelas
styles/            CSS
lang/              traduções
src/compendio/     páginas do compêndio (HTML) e index.json com a ordem
src/macros/        macros do compêndio
tools/             scripts de build
```

## Publicação manual no GitHub

### Primeira publicação

O repositório é `fernandowrpg/t20-academia-arcana`, já configurado em `package.json` (`foundry.github`) e nas URLs de `module.json`.

1. Crie no GitHub o repositório público `t20-academia-arcana`, vazio (sem README, licença ou .gitignore, para não conflitar).
2. Gere a release:
   ```bash
   npm install
   npm run build
   ```
3. Envie o código:
   ```bash
   git remote add origin https://github.com/fernandowrpg/t20-academia-arcana.git
   git push -u origin main
   ```
4. No GitHub, abra **Releases → Draft a new release**:
   - **Tag**: `v1.0.0` (precisa ser igual à `version` com o prefixo `v`).
   - **Título**: `v1.0.0`.
   - **Assets**: anexe `dist/module.json` e `dist/module.zip`.
   - Publique.
5. Confira se a URL do manifesto abre o JSON:
   `https://github.com/fernandowrpg/t20-academia-arcana/releases/latest/download/module.json`

### Novas versões

1. Atualize `version` em `package.json` (ex.: `1.1.0`) e registre as mudanças no `CHANGELOG.md`.
2. Rode `npm run build`.
3. Faça o commit e o push.
4. Crie uma release com a tag `v1.1.0` e anexe os novos `dist/module.json` e `dist/module.zip`.

O Foundry detecta a atualização pelo manifesto em `releases/latest`.

### Listagem oficial (opcional)

Para aparecer na busca do Foundry, cadastre o pacote em <https://foundryvtt.com/packages/submit> usando a URL do manifesto.

## Aviso legal

Módulo de fã, **não oficial**. *Tormenta*, *Arton*, a Academia Arcana e seus personagens são propriedade da **Jambô Editora**. O compêndio traz apenas resumos em texto próprio e a lista de nomes de disciplinas do *Manual do Arcano* (2012), não uma reprodução do livro. Para o conteúdo completo, adquira a obra.

O código está sob a licença MIT (veja `LICENSE`).

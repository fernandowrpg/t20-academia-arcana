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

Configurações em **Configure Settings → Academia Arcana**: mínimo e máximo de disciplinas, semestres regulares, limite de semestres, se jogadores fazem a própria matrícula, uso de notas numéricas e o editor do catálogo.

### API

```js
const api = game.modules.get("t20-academia-arcana").api;
api.abrir(actor);
api.secretaria();
api.catalogo();
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

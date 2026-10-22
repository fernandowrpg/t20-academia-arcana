# Changelog

## 1.16.0

- Correio, *Escrevendo como*: o seletor de remetente virou um botão com retrato e nome que abre a lista de identidades, com busca quando há muitas. Quem tem mensagens novas aparece primeiro, com o número de cada um; depois vêm professores, NPCs e personagens dos jogadores. O botão mostra quantas mensagens novas esperam em outras identidades.
- Correio: a faixa *Novas para* lista, acima das conversas, os outros personagens ou NPCs que receberam mensagens. Um clique troca para ele e já abre a conversa mais recente com novidade. Ao abrir o correio, o mestre começa pela identidade com mensagens novas.
- Correio: o topo da conversa mostra de quem para quem (retrato do remetente → destinatário), e a caixa de texto diz "Fulano para Beltrano…".
- Calendário: data da campanha no calendário de Arton, com dia da semana, mês, ano, estação e o significado de cada mês. Os 12 meses vão de Caravana (início da primavera) a Pyra (fim do inverno); cada um tem quatro semanas de Valk a Leen (28 dias). As colunas da grade e a folga mostram a data de cada dia, e o dia de hoje fica marcado. O mestre avança ou volta um dia ou uma semana, define a data ou escolhe um dia na tabela do mês.

## 1.15.0

- Painéis flutuantes (alunos, ameaças e grêmios): novo botão de minimizar no título, que deixa só a barra do topo à vista. Clique de novo para mostrar o painel. Cada usuário escolhe por conta própria e a escolha fica salva no navegador, junto com a posição.

## 1.14.0

- Calendário: os dias da semana passam a ser os de Arton. As aulas acontecem de Valk a Dallia (Valk, Hedryl, Luna, Astar e Dallia), e Haya e Leen são a folga. Os horários já salvos continuam nos mesmos lugares.
- Calendário, *Resumo do mestre*: quadro só para o mestre com os momentos da semana, em ordem de dia e turno, em que os personagens têm aula juntos. O filtro troca para as aulas que os personagens dividem com um aluno NPC ou com um professor específico; o número ao lado do nome é quantas aulas em comum. Uma marca avisa quando todos os personagens estão na mesma aula.

## 1.13.1

- Tema Scriptorium (modo "tudo"): os títulos das páginas no índice lateral dos diários e compêndios ficavam brancos sobre o pergaminho. Agora usam a tinta sépia, e a página aberta aparece em roxo.

## 1.13.0

- Secretaria, *Corpo docente*: cadastre professores novos, com uma ficha de NPC criada na hora, sem ficha ou com uma ficha existente.
- Cada professor, do livro ou cadastrado, tem um botão de disciplinas: uma janela com o catálogo por perícia para marcar o que ele leciona, sem tirar os colegas que dividem a turma. Vale para disciplinas do livro e da mesa.
- Botão para remover o professor do corpo docente: sai das disciplinas e perde o vínculo, mas a ficha continua no mundo.
- Catálogo de disciplinas: o professor das disciplinas do livro passa a ser editável. *Restaurar padrão* devolve os professores originais.

## 1.12.0

- Compêndio *Academia Arcana: Ambientes*: uma página por lugar da Academia (14 ambientes e um índice), com descrição, uso em jogo pelas regras do Tormenta20 Jogo do Ano, ganchos e um bloco secreto para notas do mestre. Biblioteca (+5 em pesquisa e em Misticismo para Identificar Magia), Laboratório Alquímico (+2 e matéria-prima a ¼ do preço), Enfermaria (+5 em Cura), câmaras do Centro de Testes (Metamágicas, agora com Magia Ilimitada, e Inesgotável) e Observatório (CD 15 e 20) adaptados para T20.
- Compêndio *Academia Arcana: Mapa*: aventura que cria a cena do mapa da Academia com um pino clicável por ambiente, ligado à página dele. Cena, pinos e páginas ficam editáveis no mundo.
- `tools/extrair-mapa.py` gera a imagem do mapa a partir do PDF do *Manual do Arcano*; a arte não vai para o repositório nem para a release.
- A página *O Campus* do compêndio principal aponta para os ambientes.

## 1.11.1

- Ficha do Aluno: o cabeçalho mostra a bandeira do grêmio do aluno, igual à do placar, com o mesmo enchimento, os pontos e a coroa de líder.

## 1.11.0

- Placar dos grêmios: cada aprovação e cada atividade extracurricular concluída rende pontos ao grêmio do aluno (valores configuráveis), além de pontos avulsos do mestre.
- Painel pequeno e sempre visível com uma bandeira por grêmio, que se enche de brilho conforme o grêmio pontua; a líder ganha uma coroa.
- Secretaria: quadro do placar com o detalhe por grêmio e o botão para encerrar o placar do semestre, que registra pontos e campeões, anuncia no chat e recomeça a contagem.

## 1.10.0

- Atividades extracurriculares: cada missão pode ter uma recompensa extra configurada pelo mestre, usada em uma cena: perícia (fica treinado pela cena, ou +2 se já for), poder geral ou outra vantagem descrita livremente.
- A recompensa aparece no quadro de atividades da Ficha do Aluno. O jogador clica em **Usar** para gastá-la, e o uso é anunciado no chat; o mestre pode devolver.

## 1.9.0

- Atividades extracurriculares: o mestre cria missões dadas por um professor a um ou mais alunos. Concluir a missão rende uma vantagem para a avaliação de uma disciplina daquele professor: *Preparo* (+2 no teste de uma prova), *Segunda chamada* (refaz uma prova) ou *Ponto extra* (+1 na nota final, até 10).
- A Ficha do Aluno lista as atividades e as vantagens conquistadas; no boletim, o mestre usa a vantagem numa disciplina. O ponto extra entra na média do semestre, no coeficiente e no painel de alunos.
- O professor com ficha avisa os alunos da missão pelo correio.
- As regras entraram em `docs/regras-da-academia.md` e na página *Regras dos Semestres* do compêndio.

## 1.8.0

- Corpo docente: na Secretaria, o mestre vincula uma ficha a cada professor do catálogo (ou cria uma ficha de NPC com um clique).
- Correio: professores com ficha participam das conversas e aparecem destacados, com o ícone de professor e as disciplinas que lecionam. O mestre escreve em nome deles.
- Boletim: cada avaliação guarda a ficha do professor que a lançou. Ao lançar nota ou situação, o módulo assina com o professor da disciplina; o mestre pode trocar. Um botão envia a avaliação ao aluno pelo correio, em nome do professor.

## 1.7.0

- Correio: confirmação de leitura. Cada mensagem enviada mostra se foi lida (em grupo, por quem), e as mensagens recebidas que você ainda não tinha visto aparecem marcadas como novas.
- Correio: cada aluno escolhe, em *Avisar quando eu ler*, se os colegas ficam sabendo que ele leu.

## 1.6.1

- Correio: o criador do grupo e o mestre podem adicionar e remover participantes. A conversa registra quem entrou e quem saiu, e quem sai deixa de ter acesso à nota.

## 1.6.0

- Correio: cada conversa agora é uma nota (Journal), na pasta *Correio da Academia*, cujos donos são os jogadores dos alunos participantes. Cada mensagem é uma página da nota. Com isso, enviar e ler mensagens não depende mais do mestre conectado.
- Correio: o item enviado sai da ficha do remetente e fica guardado na mensagem até o destinatário clicar em **Receber**.
- Correio: toda alteração de texto deixa histórico, inclusive as feitas direto na nota, e só o mestre pode apagar mensagens ou conversas.
- As conversas da v1.5.0 são convertidas em notas na primeira vez que o mestre entrar.

## 1.5.0

- Correio da Academia: os alunos trocam mensagens em conversas com histórico. Cada jogador escreve pelos seus personagens; o mestre lê tudo e escreve como qualquer aluno, inclusive os NPCs gerados.
- Grupos: qualquer aluno pode abrir uma conversa em grupo com dois ou mais colegas. Em grupo, o item enviado vai para o colega escolhido.
- O mestre pode editar qualquer mensagem. O texto anterior fica guardado no histórico da mensagem, que só o mestre vê até decidir revelar as edições aos jogadores.
- Envio de itens pelo correio: a mensagem pode levar um item do inventário do remetente (com quantidade), que passa para a ficha do destinatário.
- Aviso de correspondência nova e contador de mensagens não lidas no painel de alunos.

## 1.4.0

- Tema Scriptorium: aparência de escola de magia com janelas em pergaminho, hastes de madeira com ponteiras de latão, tinta sépia, roxo arcano e dourado divino. Cada usuário escolhe em *Tema Scriptorium* se aplica ao Foundry inteiro, só às janelas do módulo ou a nada.
- Os três protótipos de interface que deram origem ao tema ficam em `prototipos/interface.html`.

## 1.3.0

- Gerador de Alunos: depois da compra aleatória, o aluno recebe +2 no atributo da classe e +1 em outros dois atributos sorteados.
- Gerador de Alunos: nível e período andam juntos (um nível por semestre). Informe um deles e o outro acompanha; em branco, os dois são sorteados. Ao abrir matrículas em lote, cada NPC gerado sobe um nível.
- Gerador de Alunos: cada aluno ganha um tipo de parceiro de Tormenta20 conforme a classe (adepto, combatente, médico etc.), que pode acompanhar um personagem de jogador. O grau (iniciante, veterano ou mestre) acompanha o nível do aluno. O parceiro aparece no gerador, na Secretaria, no calendário e na biografia da ficha.
- A biografia do NPC gerado é atualizada a cada semestre, preservando o que o mestre escreveu fora do bloco do módulo.

## 1.2.2

- Gerador de Alunos: os atributos também são sorteados (distribuições de 10 pontos da compra de atributos), e o atributo principal da classe é sempre o mais alto. O PV já considera a Constituição sorteada.
- Compêndio: nova página *Regras dos Semestres*, gerada a partir de `docs/regras-da-academia.md`.

## 1.2.1

- Gerador de Alunos: as fichas passam a ser criadas como personagem do mestre (sem jogador dono), com um item de classe no nível escolhido, em vez de ameaça. Assim nível, PV e PM aparecem como em qualquer personagem.

## 1.2.0

- Gerador de Alunos: cria fichas de NPC neutro escolhendo o nível e sorteando nome, raça, classe, período, grêmio, histórico de disciplinas e notas. Nomes da Tabela 1-24 de *Heróis de Arton*; classes de *Tormenta20*, *Heróis de Arton* e *Deuses de Arton*. As perícias das disciplinas aprovadas e em curso ficam treinadas na ficha.
- Calendário do Período Letivo: grade semanal com as turmas, os personagens e os NPCs de cada aula, lista de colegas de turma, filtro por personagem e aviso de choque de horário. O mestre pode mudar o horário de cada turma ou redistribuir tudo. A grade se adapta à largura da janela.
- Secretaria: os NPCs gerados se matriculam sozinhos ao abrir as matrículas em lote e recebem notas sorteadas ao encerrar o semestre em lote.
- O painel de alunos deixa de listar os NPCs gerados e ganha um atalho para o calendário.
- Novo documento `docs/regras-da-academia.md` com as regras de matrícula e avaliação, pronto para importar no Notion.

## 1.1.0

- Painel de alunos: widget flutuante, sempre visível, com vida (PV), mana (PM), resumo das notas do semestre mais recente e atalho para a matrícula de cada aluno.
- Painel de ameaças: widget separado que aparece durante o combate, com PV, PM, ND, Defesa, iniciativa e condições de cada ameaça, além do total de PV do encontro.
- Os painéis podem ser arrastados, recolhidos e desligados por usuário; o mestre escolhe o que os jogadores veem das ameaças (nada, estado aproximado ou valores).
- Repositório organizado: o código-fonte saiu do arquivo zip e passou a ficar versionado em pastas.

## 1.0.0

- Ficha do Aluno com grêmio, ingresso, bolsa, situação do curso, desempenho, Teste dos Quatro Elementos e anotações.
- Matrícula por semestre com as disciplinas do *Manual do Arcano* agrupadas por perícia de Tormenta20, pré-requisitos, disciplinas especiais, ofício à escolha do aluno e limites configuráveis.
- Boletim com notas, situação, média, observações e rolagem da perícia de Tormenta20.
- Secretaria da Academia para o mestre, com admissão e ações em lote.
- Catálogo editável: perícia de Tormenta20 por disciplina, disciplinas ocultas, ofertas especiais e disciplinas da mesa.
- Compêndio de referência sobre a Academia Arcana e macros de atalho.

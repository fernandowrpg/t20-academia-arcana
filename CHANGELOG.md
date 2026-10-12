# Changelog

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

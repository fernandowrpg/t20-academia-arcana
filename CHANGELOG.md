# Changelog

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

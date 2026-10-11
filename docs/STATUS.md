# Estado da primeira versão — 11 de outubro de 2026

**Primeira versão publicada no [GitHub](https://github.com/davisilva169/Geo) e no [GitHub Pages](https://davisilva169.github.io/Geo/).**

## Entregas

| Bloco | Estado |
| --- | --- |
| Identidade Arcade Soft e nome Geo | Implementados |
| Catálogo e imagens locais | 196/196, auditadas contra a lista de referência |
| Aparência das bandeiras | Luz, sombra e relevo opcionais; proporções e símbolos preservados |
| Normal | Digitação, quatro nomes, quatro bandeiras e misto; filtros e revisão até zerar |
| Avalanche | Digitação e escolha rápida, progressão, vidas, combos, seis poderes e cinco eventos |
| Radar | Quatro dificuldades, temporizador, progressão opcional, infinito, Espelho, Caça rápida e Memória |
| Progresso | Histórico, precisão, tempo, pontuação, domínio, confusões, gráficos e matriz de países |
| Coleção e conquistas | 196 fichas de países, XP, níveis e onze conquistas |
| Preferências e dados | IndexedDB, temas, áudio, movimento reduzido, JSON de backup e restauração |
| Build e offline | Build estático e cache das 196 bandeiras, fontes e aplicação |
| Publicação | Código público, site no GitHub Pages e instalador 1.0.1 em Releases |

## Correções solicitadas na avaliação

### Travamento no Normal por volta da questão 154

O travamento específico não se reproduziu na primeira execução automatizada de 196 perguntas. A inspeção encontrou uma fragilidade: atualizações de relógio usavam snapshots de interface que podiam sobrescrever o checkpoint de feedback, enquanto a trava de resposta permanecia ativa.

As transições agora são atômicas e usam o estado mais recente. O evento de resposta é a fonte de verdade e reconstrói o feedback caso o checkpoint falte. Cliques ou Enter duplicados com o cursor anterior são ignorados.

Verificado: sessões completas de 196 respostas no navegador, ultrapassando a questão 154 e chegando aos resultados; teste de recuperação de checkpoint ausente na questão 154; preservação das respostas ao recarregar.

### Penalidade na escolha rápida do Avalanche

Cada escolha errada agora quebra o combo e faz todas as bandeiras presentes descerem 12% adicionais durante 520ms, com curva suave. Erros seguidos acumulam impulsos. A descida passa pelas mesmas regras de chão, escudo, perda de vida e fim de jogo.

Verificado: movimento intermediário e final no navegador, acúmulo de penalidades, efeito em todas as bandeiras e colisão com fim de jogo nos testes de regras.

## Validação concluída

- TypeScript: passou.
- 31 testes de regras/persistência/regressão: passaram.
- 15 jornadas de navegador em desenvolvimento: passaram.
- 1 jornada de produção totalmente offline: passou.
- Total: **47 testes automatizados aprovados**.
- Auditoria de países: 196 IDs únicos, correspondência exata com a lista, arquivos SVG, integridade SHA-256, aliases, semelhanças, licenças e proporções: passou.
- Build de produção: passou; aplicação e gráficos separados em módulos.
- 217 recursos locais no cache de produção.
- Dependências instaladas: auditoria sem vulnerabilidades conhecidas no momento da verificação.
- Capturas de desktop e viewport de celular inspecionadas.

Os testes de celular usam emulação de tamanho de tela em Chromium. Eles não substituem a avaliação com teclado virtual e desempenho em um aparelho físico. A verificação em outros navegadores e em um aparelho físico continua pendente.

## Como experimentar

Durante a sessão de desenvolvimento, acessar http://127.0.0.1:5173. Para abrir novamente no Windows, executar INICIAR-GEO.bat.

O modo offline é verificado no build de produção (npm run build e npm run preview), não no servidor de desenvolvimento. Nenhum teste automatizado gravou dados no perfil real do usuário: Playwright usa contextos separados.

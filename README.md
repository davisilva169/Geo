# Geo

Um jogo de treinamento geográfico em português, com 196 bandeiras, três modos e progresso salvo no seu navegador. Identidade visual **Arcade Soft**, aprovada em 9 de outubro de 2026. Nome provisório escolhido: **Geo**.

**Primeira versão pública:** [jogar no navegador](https://davisilva169.github.io/Geo/) · [código-fonte](https://github.com/davisilva169/Geo) · [instalador para Windows](https://github.com/davisilva169/Geo/releases/tag/v1.0.1). Sem conta, backend, rastreadores ou serviços pagos.

## Instalar como aplicativo no Windows

O Geo agora tem um instalador de Windows. Depois de gerar o pacote, abra o arquivo `Geo_1.0.1_x64-setup.exe` em `src-tauri/target/release/bundle/nsis/` e siga o assistente. Ele cria um aplicativo no menu Iniciar; para jogar, não é preciso deixar um servidor aberto. O instalador contém o jogo e as 196 bandeiras. O Windows usa o WebView2, que já vem instalado nas versões recentes do sistema ou é preparado pelo instalador.

A versão 1.0.1 troca o ícone pelo conceito 8C (olho com globo) e mantém o identificador `com.geo.flagtrainer` e o diretório de dados do aplicativo. Para atualizar uma instalação existente, feche o Geo e execute o novo instalador sem selecionar uma opção de apagar dados do aplicativo. O progresso salvo no navegador continua separado do aplicativo; use o backup JSON das Configurações se quiser transferi-lo.

Para reconstruir o instalador após alterações, instale Node.js 22.12+, Rust para Windows e Microsoft C++ Build Tools com a carga “Desenvolvimento para desktop com C++”. Depois, na pasta do projeto:

    npm ci
    npm run desktop:build

O instalador está disponível na [versão 1.0.1](https://github.com/davisilva169/Geo/releases/tag/v1.0.1). Ele não tem assinatura digital; o Windows pode exibir um aviso de aplicativo desconhecido.

O aplicativo e o jogo aberto no navegador guardam históricos separados. Se você já jogou no navegador, use **Configurações → Exportar backup** nele e, no aplicativo instalado, **Configurações → Importar backup**. Guarde o arquivo JSON antes de importar, pois a importação substitui o histórico do destino após confirmação.

## Jogar no navegador durante o desenvolvimento

Requisito: Node.js 22.12 ou superior.

No Windows, abra **INICIAR-GEO.bat** na pasta do projeto. O navegador abrirá e a janela do servidor deve permanecer aberta enquanto joga.

Ou execute:

    npm ci
    npm run dev

Abra o endereço informado, normalmente http://127.0.0.1:5173.

## Os três modos

- **Normal:** digitação, quatro nomes, quatro bandeiras e misto com pesos configuráveis. Sessões de até 196 países, filtros por continente e histórico, pausa, revelação, revisão iterativa até zerar os erros.
- **Avalanche:** movimento independente dos quadros, presets, vidas, combos, seis poderes, cinco eventos, entrada por digitação ou escolha rápida. Cada escolha errada acrescenta uma descida suave de 12% a todas as bandeiras em 520 ms. Erros seguidos acumulam a penalidade.
- **Radar:** grades de 4, 9, 16 e 25 bandeiras, tempo configurável, modo infinito, progressão opcional, Espelho, Caça rápida e Memória.

Os modos compartilham histórico, dificuldades, domínio por país, confusões, XP e conquistas. O progresso inclui gráficos com separação entre sessões e revisões, matriz de conhecimento e detalhes de cada país. Exportação e restauração em JSON ficam nas configurações.

O nível usa a curva crescente `floor(150 × n^2,25 + 100 × n)` XP para passar do nível `n` ao seguinte. Os primeiros avanços custam 250, 913 e 2.076 XP. O XP já ganho continua igual; o nível é recalculado com a nova curva.

## Bandeiras

São **196 arquivos SVG locais**, com desenhos e proporções originais. A luz e a sombra são aplicadas na apresentação, com uma opção para desligar o relevo. Nenhuma bandeira oficial foi desenhada por IA.

A lista foi conferida com o quiz de referência: 193 membros da ONU + Vaticano + Taiwan + Kosovo. Palestina não integra esse conjunto específico. Afeganistão e Síria usam variantes atuais documentadas. Consulte [a auditoria do catálogo](docs/COUNTRIES.md) e [as fontes e licenças](THIRD-PARTY-NOTICES.md).

## Desenvolvimento e testes

    npm run check
    python scripts/validate-countries.py
    npx playwright install chromium
    npm run dev

Com o servidor aberto, em outro terminal:

    npm run test:e2e

O teste de 196 perguntas percorre todos os países, incluindo a região da questão 154 relatada durante a avaliação. Os testes de regressão verificam recuperação de feedback, proteção contra avanço duplicado e penalidades suaves e acumuláveis.

    npm run build
    npm run preview

O build produz a pasta dist e um service worker com os recursos locais. A primeira visita à versão de produção precisa de conexão até o cache ficar pronto; depois é possível recarregar e jogar offline. A versão de desenvolvimento não registra service worker.

## Estrutura

- src/data: catálogo dos países.
- src/domain.ts: respostas, alternativas, revisão, domínio, pontuação e conquistas.
- src/quiz.ts: transições atômicas das perguntas e recuperação de partidas.
- src/avalanche.ts: simulação de queda, colisões, poderes e penalidades.
- src/storage.ts e src/store.tsx: IndexedDB, backup e estado persistente.
- src/xp.ts: curva de níveis e progresso até o próximo nível.
- src-tauri: aplicativo de Windows e configuração do instalador.
- src/pages: telas, modos de jogo e configurações.
- public/flags: 196 SVGs e manifesto de origem/integridade.
- tests/unit e tests/e2e: testes de regras e jornadas no navegador.
- docs: catálogo auditado, mecânicas, licenças, progresso e próximos passos.
- design: propostas originais da etapa de identidade.

## Publicação

O jogo está em [davisilva169.github.io/Geo](https://davisilva169.github.io/Geo/). O fluxo em `.github/workflows/pages.yml` é manual: cada atualização do site exige executar “Validar e publicar Geo” na aba Actions. Ele testa o catálogo e o código, gera o build com base `/Geo/` e publica no GitHub Pages.

As rotas usam hash para funcionar no GitHub Pages sem regras de servidor. Atualizações da aplicação não removem o banco local. Exportar backups é recomendado antes de trocar de navegador ou limpar dados do site.

## Documentação

- [Mecânicas e decisões técnicas](docs/MECHANICS.md)
- [Estado da primeira versão](docs/STATUS.md)
- [Próximos passos](docs/ROADMAP.md)
- [Auditoria de países e bandeiras](docs/COUNTRIES.md)
- [Créditos e licenças](THIRD-PARTY-NOTICES.md)

Código sob licença MIT. Fontes sob SIL Open Font License; SVGs conforme fontes documentadas. Geo é independente e não tem vínculo com GeoGuessr ou JetPunk.

# Mecânicas e arquitetura — Geo v1

## Bandeiras e aparência

Arcade Soft, tema claro padrão, tipografia Space Grotesk e Inter, controles com relevo discreto, roxo principal, verde para reconhecimento e âmbar para energia. Cada bandeira preserva proporção e geometria; o contêiner aplica sombra, luz especular de baixa opacidade e uma borda de relevo. Nepal preserva a silhueta e não recebe a camada retangular de luz. O acabamento pode ser desligado.

## Respostas e sessões

Os nomes são normalizados com Unicode NFD, remoção de acentos, minúsculas, hífens/apóstrofos como espaços e compactação de espaços. Correspondência é exata após normalizar. Aliases são opcionais; erros ortográficos não são automaticamente convertidos em outro país.

Uma sessão de 196 países no Normal é completa. Outras sessões regulares são práticas; revisões mantêm rootId ligado à origem. Respostas são eventos com ID permanente, país, país selecionado quando identificável, acerto, formato, latência, tipo e data. Assistências não entram em precisão, domínio ou XP.

As alternativas contêm a resposta e distratores distintos: confusões do jogador, semelhanças visuais e países restantes embaralhados. Posição da correta não é fixa. O modo misto usa seleção ponderada e reproduzível por sessão/pergunta.

O estado de uma pergunta é atualizado atomicamente. O relógio modifica apenas seus próprios campos sobre o estado mais recente. Uma resposta registrada pode reconstruir o feedback perdido, evitando bloqueio do avanço. Avanços repetidos com o cursor antigo são ignorados.

## Ciclo de revisão

Ao concluir uma sessão, extrair IDs únicos com erros. A revisão só contém esses países. Repetir até não haver erros. O novo acerto remove a pendência daquele país, mas mantém todos os erros e confusões históricos.

Filtros: todos, nunca estudados, erros da sessão anterior, erros da última sessão completa, todos os pendentes, países com pelo menos 25% de erros históricos, continente e revisão inteligente. Esta última prioriza pendências e revisões vencidas, incluindo países novos.

## Domínio e repetição espaçada

- Não estudado: nenhuma tentativa não assistida.
- Iniciante: sequência atual de acertos igual a zero.
- Em aprendizado: um acerto consecutivo.
- Familiar: pelo menos dois acertos consecutivos, sem preencher todos os critérios de domínio.
- Dominado: quatro ou mais acertos consecutivos, intervalo espaçado de pelo menos oito dias e pelo menos 75% de acertos históricos.

Acerto em sessão espaçada (18h ou mais após a tentativa anterior) dobra o intervalo, começando em um dia e limitado a 60 dias. Acertos próximos não aumentam nem adiam o intervalo já agendado. Um acerto que resolve uma pendência agenda nova revisão em um dia. Erro reinicia intervalo e sequência, com revisão prevista em dez minutos.

O tempo de resposta é mostrado como métrica separada. Ele não penaliza domínio, para não confundir habilidade de digitação, acessibilidade e conhecimento. A fórmula é uma heurística ajustável, sem alegação de validade científica.

## Pontuação, XP e conquistas

Acerto: arredondar (100 + 25 × dificuldade + rapidez) × combo × evento.

Rapidez = max(0, 50 − floor(latência em ms / 200)).
Combo = 1 + min(3, floor(acertos consecutivos / 5)) × 0,25.
Evento = 1,5 no Bônus de precisão do Avalanche e na Caça rápida do Radar; 1 fora deles.

Limpeza e identificação com Raio-X: 25 pontos, sem aumentar domínio, XP, precisão ou combo.

XP por país: 20 no primeiro acerto; 10 por revisão vencida; 1 por repetição antecipada. Para avançar do nível n ao n+1, são necessários floor(150 × n^2,25 + 100 × n) XP dentro do nível. Os custos dos três primeiros avanços são 250, 913 e 2.076 XP; os marcos são cumulativos. O XP já registrado não é alterado: apenas o nível exibido é recalculado. Conquistas são derivadas de dados reais ao encerrar sessões. Não existe punição por ausência diária.

## Avalanche

Simulação independente da renderização, com requestAnimationFrame e posições em porcentagem. O DOM exibe SVGs e controles acessíveis. Transformações são atualizadas diretamente em cada quadro; a interface de placar recebe atualizações limitadas. O relógio de simulação não avança durante pausa e o delta máximo é 100ms para evitar saltos após travamentos.

Velocidade = min(2,6, velocidade inicial × (1 + tempo / 180.000ms)), com fator 0,8 no ritmo mobile.
Tempo de travessia = max(5.500ms, 16.000ms / velocidade).
Intervalo de surgimento = max(1.800ms desktop ou 2.600ms mobile, 5.500ms / velocidade).
Nível sobe a cada 30s. Capacidade cresce gradualmente até cinco bandeiras no desktop ou três no ritmo mobile. Não gerar uma bandeira quando há outra com menos de 1,8s estimados até o chão; evitar ocupação próxima na mesma coluna.

Preset Relaxado: 0,65×, cinco vidas. Normal: 1×, três vidas. Difícil: 1,4×, três vidas. Insano: 1,9×, uma vida. Personalizado permite outras combinações.

Resposta correta elimina a duplicata mais baixa. Colisões resolvem uma vez por bandeira. Entrada e simulação seguem a ordem de eventos do navegador: se a resposta é processada antes da colisão, remove a bandeira; se a colisão já terminou a partida, a resposta não altera o resultado.

### Penalidade da escolha rápida

Cada erro zera o combo e cria um impulso de queda de 12 pontos percentuais em TODAS as bandeiras presentes. O impulso usa smoothstep x²(3−2x) durante 520ms, distribuído por quadro e somado à queda natural. Erros sucessivos acrescentam impulsos independentes: não reiniciam nem cancelam os anteriores. Bandeiras novas não recebem penalidades passadas.

Essa descida pode atingir o chão, consumir escudo ou vidas e terminar a partida. O congelamento pausa a queda natural, mas não elimina a penalidade de uma escolha errada. Assim, clicar indiscriminadamente em todas as opções tem um custo real.

### Poderes

Seis poderes, inicialmente uma carga cada, até duas cargas por poder. A cada novo marco de dez acertos consecutivos, um poder ganha uma carga, percorrendo a lista em ordem. O mesmo marco não é recompensado novamente na partida.

1. Congelar: quatro segundos.
2. Câmera lenta: sete segundos a metade da velocidade.
3. Escudo: absorve uma bandeira perdida.
4. Limpeza: remove a mais próxima do chão, 25 pontos assistidos.
5. Raio-X: nomes visíveis por 2,5s; acertos nesse período são assistidos.
6. Vida extra: uma vida até o limite inicial.

Eventos, em ciclo a cada 35s, durante 10s: Tempestade (intervalo ×0,75), Duplas perigosas (prioriza semelhantes), Momento zen (velocidade ×0,6), Bônus de precisão (pontos ×1,5), Desafio regional (uma região continental).

### Recordes

Chave inclui modo, preset, vidas, velocidade, poderes, duração, grade, limite de tempo, variante de evento, progressão do Radar, entrada, ritmo mobile, confirmação, conjunto, continente e tamanho da sessão. Resultados com vantagens diferentes não são apresentados como recordes equivalentes.

## Radar

Grades de 4, 9, 16 ou 25, com uma correta e sem duplicatas. A progressão opcional sobe um tamanho a cada cinco rodadas. A grade especialista pode exigir rolagem em celular; resultados mobile são separados.

Clássico e Espelho exibem bandeiras semelhantes quando possível. Caça rápida compartilha um relógio entre cinco buscas, usando cinco vezes o limite por rodada. Se o relógio termina, as buscas restantes desse grupo expiram; não é dado tempo novo até o próximo grupo. Memória revela a grade por dois segundos sem permitir seleção, depois oculta as imagens mantendo as posições e inicia o período de resposta. Modo infinito repete o conjunto em ordem embaralhada.

## Persistência e ciclo de vida

IndexedDB geo-learning, versão 1, armazena o snapshot de preferências, sessões, partida ativa e conquistas. Escritas serializadas previnem gravações antigas de sobrescrever novas. Cada resposta é salva; jogos com relógio mantêm checkpoint aproximadamente uma vez por segundo. Fechar abruptamente pode perder até cerca de um segundo de movimento, mas não uma resposta cuja gravação já terminou.

Ao voltar a uma partida interrompida, há pausa antes de continuar. Trocar de aba ou perder foco pausa. Resultados completos e interrompidos são identificados. Importação valida versão, países, sessões e parâmetros, rejeita duplicatas e baixa um backup de segurança antes de substituir dados.

Atualizações de assets não excluem IndexedDB. O service worker só é registrado no build de produção; cacheia SVGs, fontes, páginas e scripts locais. Não há envio de respostas a servidores. Não se promete persistência se o navegador apagar dados por falta de espaço ou ação do usuário; exportação é o mecanismo de backup.

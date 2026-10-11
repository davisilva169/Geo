import { useRef, useState } from "react";
import {
  Download,
  Upload,
  Trash2,
  LockKeyhole,
  Check,
  Trophy,
  ExternalLink,
  ShieldCheck,
  Volume2,
  Sparkles,
} from "lucide-react";
import { useStore } from "../store";
import { achievementDefinitions, allSessions, deriveStats } from "../domain";
import { Back, Button, icons, Modal } from "../components";
import { downloadBackup, initialData, validateBackup } from "../storage";
import { progressToNextLevel } from "../xp";
import type { Snapshot } from "../types";
export function Achievements() {
  const { data } = useStore();
  const stats = Object.values(deriveStats(allSessions(data)));
  const xp = stats.reduce((a, s) => a + s.xp, 0);
  const level = progressToNextLevel(xp);
  const unlocked = Object.keys(data.achievements).length;
  return (
    <>
      <Back />
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            PEQUENAS VITÓRIAS, GRANDES DESCOBERTAS
          </span>
          <h1>Suas conquistas</h1>
          <p>Uma coleção das coisas que você aprendeu pelo caminho.</p>
        </div>
        <span className="collection-count">
          {unlocked} / {achievementDefinitions.length}
        </span>
      </div>
      <section className="level-banner panel">
        <span className="result-medal">
          <Trophy size={38} />
        </span>
        <div>
          <span className="eyebrow">NÍVEL {level.level}</span>
          <h2>Cada descoberta conta.</h2>
          <p>
            {xp} XP acumulados · faltam {level.remaining} XP para o próximo
            nível
          </p>
          <div className="progress-track">
            <i style={{ width: `${level.ratio * 100}%` }} />
          </div>
        </div>
      </section>
      <div className="achievement-grid">
        {achievementDefinitions.map((a) => {
          const Icon = icons[a.icon as keyof typeof icons];
          const date = data.achievements[a.id];
          return (
            <article
              className={`panel achievement ${date ? "unlocked" : "locked"}`}
              key={a.id}
            >
              <span className="achievement-icon">
                <Icon size={34} />
              </span>
              <h3>{a.name}</h3>
              <p>{a.description}</p>
              <small>
                {date ? (
                  <>
                    <Check size={14} />
                    Conquistado em {new Date(date).toLocaleDateString("pt-BR")}
                  </>
                ) : (
                  <>
                    <LockKeyhole size={14} />
                    Uma descoberta futura
                  </>
                )}
              </small>
            </article>
          );
        })}
      </div>
      <p className="home-note">
        Sem sequência obrigatória, sem dias perdidos. Você aprende no seu ritmo.
      </p>
    </>
  );
}
export function Settings() {
  const { data, settings, replace, notify } = useStore();
  const [confirmation, setConfirmation] = useState<"delete" | "import" | null>(
    null,
  );
  const [candidate, setCandidate] = useState<Snapshot | null>(null);
  const [fileError, setFileError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  async function read(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 30 * 1024 * 1024)
        throw Error("Arquivo muito grande. O limite é 30 MB.");
      const value = validateBackup(JSON.parse(await file.text()));
      setCandidate(value);
      setConfirmation("import");
      setFileError("");
    } catch (error) {
      setFileError(
        error instanceof Error
          ? error.message
          : "Não foi possível ler este arquivo.",
      );
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  return (
    <>
      <Back />
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEU JOGO, DO SEU JEITO</span>
          <h1>Configurações</h1>
          <p>Pequenos ajustes para uma experiência que combina com você.</p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel">
          <h2>
            <Volume2 size={21} />
            Som e movimento
          </h2>
          <label className="setting-row">
            <span>
              <strong>Efeitos sonoros</strong>
              <small>Acertos, erros e feedback de jogo</small>
            </span>
            <input
              type="checkbox"
              checked={data.settings.sound}
              onChange={(e) => settings({ sound: e.target.checked })}
            />
          </label>
          <label className="setting-row">
            <span>Volume dos efeitos</span>
            <input
              type="range"
              min="0"
              max="1"
              step=".05"
              value={data.settings.volume}
              onChange={(e) => settings({ volume: Number(e.target.value) })}
            />
          </label>
          <label className="setting-row">
            <span>
              <strong>Animações</strong>
              <small>
                A preferência de movimento reduzido do sistema também é
                respeitada
              </small>
            </span>
            <input
              type="checkbox"
              checked={data.settings.motion}
              onChange={(e) => settings({ motion: e.target.checked })}
            />
          </label>
          <label className="setting-row">
            <span>Velocidade de transições</span>
            <select
              value={data.settings.transition}
              onChange={(e) => settings({ transition: Number(e.target.value) })}
            >
              <option value=".7">Rápida</option>
              <option value="1">Normal</option>
              <option value="1.4">Suave</option>
            </select>
          </label>
          <label className="setting-row">
            <span>
              <strong>Vibração</strong>
              <small>Em dispositivos compatíveis</small>
            </span>
            <input
              type="checkbox"
              checked={data.settings.haptics}
              onChange={(e) => settings({ haptics: e.target.checked })}
            />
          </label>
        </section>
        <section className="panel">
          <h2>
            <Sparkles size={21} />
            Aparência e aprendizado
          </h2>
          <label className="setting-row">
            <span>Tema</span>
            <select
              aria-label="Tema"
              value={data.settings.theme}
              onChange={(e) =>
                settings({
                  theme: e.target.value as "light" | "dark" | "system",
                })
              }
            >
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
              <option value="system">Seguir sistema</option>
            </select>
          </label>
          <label className="setting-row">
            <span>
              <strong>Luz e sombra nas bandeiras</strong>
              <small>
                Relevo visual suave; desenho e proporções preservados
              </small>
            </span>
            <input
              type="checkbox"
              aria-label="Luz e sombra nas bandeiras"
              checked={data.settings.relief}
              onChange={(e) => settings({ relief: e.target.checked })}
            />
          </label>
          <label className="setting-row">
            <span>
              <strong>Aceitar nomes alternativos</strong>
              <small>Acentos e maiúsculas sempre são normalizados</small>
            </span>
            <input
              type="checkbox"
              checked={data.settings.aliases}
              onChange={(e) => settings({ aliases: e.target.checked })}
            />
          </label>
          <label className="setting-row">
            <span>Formato preferido</span>
            <select
              value={data.settings.format}
              onChange={(e) =>
                settings({
                  format: e.target.value as typeof data.settings.format,
                })
              }
            >
              <option value="typing">Digitação</option>
              <option value="names">Quatro nomes</option>
              <option value="flags">Quatro bandeiras</option>
              <option value="mixed">Misto</option>
            </select>
          </label>
          <label className="setting-row">
            <span>Meta diária opcional</span>
            <select
              value={data.settings.dailyGoal}
              onChange={(e) => settings({ dailyGoal: Number(e.target.value) })}
            >
              <option value="0">Sem meta</option>
              {[10, 20, 50, 100].map((n) => (
                <option value={n} key={n}>
                  {n} respostas
                </option>
              ))}
            </select>
          </label>
          <div className="setting-row">
            <span>Idioma</span>
            <strong>Português (Brasil)</strong>
          </div>
        </section>
        <section className="panel settings-data">
          <h2>
            <ShieldCheck size={21} />
            Seus dados ficam com você
          </h2>
          <p>
            O progresso é salvo neste navegador, sem cadastro. Faça um backup
            para trocar de dispositivo ou proteger suas descobertas.
          </p>
          <div className="data-actions">
            <Button variant="secondary" onClick={() => downloadBackup(data)}>
              <Download size={17} />
              Exportar backup
            </Button>
            <Button variant="secondary" onClick={() => input.current?.click()}>
              <Upload size={17} />
              Importar backup
            </Button>
            <Button variant="ghost" onClick={() => setConfirmation("delete")}>
              <Trash2 size={17} />
              Apagar progresso
            </Button>
            <input
              ref={input}
              hidden
              type="file"
              accept="application/json,.json"
              onChange={(e) => void read(e.target.files?.[0])}
            />
          </div>
          {fileError && (
            <p className="warning" role="alert">
              {fileError}
            </p>
          )}
          <p className="field-note">
            Dados de sessões: {data.sessions.length} partidas. Backup formato
            v1. A importação substitui o histórico depois da sua confirmação.
          </p>
        </section>
      </div>
      {confirmation && (
        <Modal
          title={
            confirmation === "delete"
              ? "Apagar todo o progresso?"
              : "Restaurar este backup?"
          }
          onClose={() => setConfirmation(null)}
        >
          <p>
            {confirmation === "delete"
              ? "O histórico, o domínio e as conquistas serão apagados deste navegador. Suas preferências serão mantidas. Um backup dos dados atuais será baixado antes."
              : `O backup contém ${candidate?.sessions.length} partidas e substituirá o progresso atual. Um backup de segurança será baixado antes.`}
          </p>
          <div className="modal-actions">
            <Button variant="secondary" onClick={() => setConfirmation(null)}>
              Cancelar
            </Button>
            <Button
              variant={confirmation === "delete" ? "danger" : "primary"}
              onClick={() => {
                downloadBackup(data, "geo-antes-de-restaurar");
                if (confirmation === "delete")
                  replace({ ...initialData(), settings: data.settings });
                else if (candidate) replace(candidate);
                setConfirmation(null);
                notify(
                  confirmation === "delete"
                    ? "Progresso apagado. Um novo começo."
                    : "Backup restaurado com sucesso.",
                );
              }}
            >
              {" "}
              {confirmation === "delete"
                ? "Apagar progresso"
                : "Restaurar backup"}
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function Help() {
  return (
    <>
      <Back />
      <div className="page-heading">
        <div>
          <span className="eyebrow">UM GUIA PARA SUA JORNADA</span>
          <h1>Vamos conhecer o Geo?</h1>
          <p>Três modos conectados por um objetivo: aprender de verdade.</p>
        </div>
      </div>
      <div className="help-content panel">
        <details open>
          <summary>Normal: aprender e revisar</summary>
          <p>
            Escolha digitação, quatro nomes, quatro bandeiras ou uma mistura dos
            formatos. Acentos, espaços extras e capitalização não atrapalham.
            Nomes alternativos podem ser desligados nas configurações. Um nome
            errado nunca é aceito automaticamente por semelhança.
          </p>
          <p>
            Revelar ou pular conta como erro. Ao terminar, “Revisar erros” cria
            uma sessão somente com os países errados. Você pode repetir esse
            ciclo até zerar, preservando o histórico completo. Sessões de 196
            países são classificadas como completas; as demais são práticas ou
            revisões.
          </p>
        </details>
        <details>
          <summary>Avalanche: sobreviva à próxima onda</summary>
          <p>
            Digite um país presente na tela e confirme com Enter. Sem essa
            opção, um nome exato é reconhecido durante a digitação. Na entrada
            por toque, escolha o nome da bandeira mais próxima do chão. Em
            duplicatas, a mais baixa sai primeiro.
          </p>
          <p>
            Uma bandeira no chão custa uma vida. Resposta errada quebra o combo.
            Na escolha rápida, cada erro faz todas as bandeiras descerem mais
            12% do campo ao longo de 520ms; erros seguidos acumulam essa descida
            e podem causar perdas de vida. A penalidade também funciona durante
            o congelamento. A dificuldade cresce a cada 30 segundos, respeitando
            limites de velocidade, ocupação e intervalo. O celular usa menos
            bandeiras simultâneas e velocidade adaptada.
          </p>
          <p>
            Os poderes começam com uma carga. A cada novo marco de 10 acertos
            seguidos, um poder recebe uma carga, até duas. Congelar (1): 4s.
            Câmera lenta (2): 7s. Escudo (3): protege de uma queda. Limpeza (4):
            remove a bandeira mais baixa e vale 25 pontos, sem contar como
            acerto. Raio-X (5): nomes por 2,5s. Vida extra (6): recupera uma
            vida até o limite inicial.
          </p>
          <p>
            Tempestade, Duplas perigosas, Momento zen, Bônus de precisão e
            Desafio regional se alternam a cada 35 segundos e duram 10 segundos.
            Escudo e limpeza são respostas assistidas e não contam para domínio.
            Acertos enquanto o Raio-X está ativo valem 25 pontos e são
            assistidos: não aumentam o combo nem o domínio.
          </p>
          <p>
            Esc pausa a partida. Espaço continua livre para escrever nomes. Ao
            trocar de aba ou perder foco, o jogo pausa. Recordes separam preset,
            vidas, poderes, duração, entrada, conjunto de países e adaptação
            mobile.
          </p>
        </details>
        <details>
          <summary>Radar: reconheça os detalhes</summary>
          <p>
            Leia o país e encontre sua bandeira na grade de 4, 9, 16 ou 25
            opções. Só uma corresponde à resposta. Errar ou deixar o tempo
            acabar registra uma falha. Sua melhor sequência aparece no
            resultado. A opção de progressão aumenta a grade a cada cinco
            rodadas, até 25 bandeiras.
          </p>
          <p>
            Espelho prioriza países parecidos; Caça rápida reúne cinco buscas
            sob um relógio compartilhado; Memória mostra as bandeiras por dois
            segundos e depois pede a posição. Infinito continua até você
            encerrar. Em grades grandes no celular pode ser necessário rolar; o
            tempo começa quando a rodada é apresentada.
          </p>
        </details>
        <details>
          <summary>Como o domínio e a revisão são calculados?</summary>
          <p>
            Não estudado: nenhuma tentativa. Iniciante: erro na tentativa mais
            recente. Em aprendizado: um acerto seguido. Familiar: dois ou mais
            acertos seguidos. Dominado: pelo menos quatro acertos seguidos, 75%
            de acerto histórico e intervalo espaçado de pelo menos oito dias.
          </p>
          <p>
            Um acerto qualificado em outro dia (pelo menos 18 horas após o
            anterior) dobra o intervalo: 1, 2, 4, 8… até 60 dias. Erros zeram o
            intervalo e agendam revisão em 10 minutos. Acertos próximos não
            aumentam o intervalo. A revisão inteligente prioriza erros pendentes
            e prazos vencidos. Tempo de resposta é mostrado separadamente, sem
            penalizar quem digita mais devagar.
          </p>
          <p>
            Esta é uma heurística simples e documentada, não uma medida
            científica de memória. Uma revisão correta remove o erro pendente,
            mas nunca apaga as dificuldades anteriores.
          </p>
        </details>
        <details>
          <summary>Pontos, XP e conquistas</summary>
          <p>
            Pontos por acerto: (100 + 25 × dificuldade + bônus de rapidez) ×
            multiplicador de combo. Rapidez: no máximo 50 pontos, reduzindo 1
            ponto a cada 200ms. Combo: +25% a cada 5 acertos, até 1,75×. Bônus
            de precisão e Caça rápida multiplicam por 1,5. Limpeza vale 25
            pontos.
          </p>
          <p>
            XP por país: 20 no primeiro acerto, 10 ao acertar uma revisão
            vencida e 1 por repetição antecipada. O primeiro avanço custa 250
            XP; depois, cada nível exige progressivamente mais. Conquistas são
            avaliadas ao encerrar uma sessão. Não há punição por ficar dias sem
            jogar.
          </p>
        </details>
        <details>
          <summary>Bandeiras, fontes e convenção de países</summary>
          <p>
            O conjunto tem 196 países: os 193 membros da ONU, Vaticano, Taiwan e
            Kosovo, conforme a lista de respostas do quiz de referência.
            Palestina não integra esse conjunto específico. Essa escolha é uma
            convenção do treinamento.
          </p>
          <p>
            As bandeiras são SVGs locais obtidos de fontes documentadas, com
            proporções originais. Afeganistão usa a bandeira branca atual e
            Síria a bandeira verde, branca e preta de três estrelas. Notas sobre
            essas variantes estão na coleção. A luz e a sombra são um acabamento
            de apresentação que pode ser desligado.
          </p>
          <p>
            <a
              href="https://www.jetpunk.com/user-quizzes/176134/bandeiras-do-mundo/stats"
              target="_blank"
              rel="noreferrer"
            >
              Referência dos 196 países ↗
            </a>{" "}
            ·{" "}
            <a
              href="https://github.com/hampusborgos/country-flags"
              target="_blank"
              rel="noreferrer"
            >
              Fonte principal dos SVGs ↗
            </a>
          </p>
        </details>
        <details>
          <summary>Offline, acessibilidade e privacidade</summary>
          <p>
            Após o primeiro carregamento completo da versão de produção, o jogo
            baixa seus recursos para uso offline. Este preparo pode levar alguns
            segundos. Dados ficam em IndexedDB neste navegador. Use Exportar
            backup para transferir ou proteger seu progresso. Limpar dados do
            navegador pode apagar o histórico.
          </p>
          <p>
            Os controles funcionam com Tab, Enter e Espaço; Esc pausa. Foco
            visível, mensagens de acerto/erro, movimento reduzido, tema escuro e
            som opcional estão disponíveis. Não há rastreadores, cadastro ou
            envio do seu histórico a um servidor.
          </p>
        </details>
        <p className="field-note">
          Geo é um projeto independente de treinamento geográfico, sem vínculo
          com o GeoGuessr.
        </p>
      </div>
    </>
  );
}

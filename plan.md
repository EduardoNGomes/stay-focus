# Stay Focus — implementation plan / plano de implementação

The original six features below describe the first shipped scope. The user-requested extension in **Feature update (007–009)** supersedes the single-window model. / As seis funcionalidades originais abaixo descrevem o primeiro escopo. A ampliação pedida pelo usuário em **Atualização de funcionalidades (007–009)** substitui o modelo de faixa única.

## English

### Goal and users

Build a Chrome extension for people who want to avoid chosen websites during a chosen time window. Users enter sites, set start and end times, and choose Normal or Hardcore mode. The extension makes the current schedule and blocking state easy to understand.

### Proposed product behavior

- **Schedule:** Proposal: one recurring daily window in the user's local timezone, such as 13:00–18:00. Outside the window, listed sites work normally. Define start as inclusive and end as exclusive. Handle windows crossing midnight. Save the site list, schedule, and mode locally.
- **Site list:** Add and remove hostnames or URLs; normalize them to hostnames, reject invalid entries and duplicates, and block the hostname and its subdomains on HTTP and HTTPS. The initial scope is top-level site navigation in Chrome, not traffic inside other applications.
- **Normal mode:** The user can pause and resume blocking from the extension at any time, including during the window. A pause ends with the current window; the next window blocks again.
- **Hardcore mode:** Proposal: while the window is active, the extension refuses in-app pause, schedule shortening, mode change, and removal of blocked sites. Changes made outside the window are allowed. Show the lock end time and a clear explanation before a user selects this mode.
- **Hardcore limit:** A normal user-installed Chrome extension cannot prevent a user from disabling or uninstalling it through Chrome. The user explicitly accepts that disabling or removing it in Chrome stops the blocking. Hardcore is an **in-app commitment lock** only. Explain this accurately in the UI. [Chrome Enterprise installation policy](https://support.google.com/chrome/a/answer/6306504) describes a different, managed deployment model that is outside this plan.
- **Blocked navigation:** Show a simple blocked page or Chrome's block response with the site's name and window end time, subject to the chosen implementation and Chrome API constraints. Avoid implying that every access path outside Chrome is covered.

### Proposed technical approach

Use a Manifest V3 extension with a popup for quick status/actions and an options page for the site list, schedule, and mode. Use the local MDO Design System at `/home/rookie/Projects/mdo-design-system` as the visual source: dark palette, green action/focus color, existing CSS tokens and components, 8px radius, and reduced-motion support. Package the CSS into the extension rather than relying on a runtime server. Use `chrome.storage.local` for configuration, `chrome.alarms` plus startup reconciliation for schedule transitions, and `chrome.declarativeNetRequest` dynamic rules for active site blocking. Dynamic rules persist across browser sessions; the worker must still reconcile saved state and alarms after startup or changes. [DNR API](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest), [service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle), [alarms tutorial](https://developer.chrome.com/docs/extensions/get-started/tutorial/service-worker-events).

No account, cloud sync, analytics, or external service is proposed. Request only permissions required by the selected implementation. Review Chrome's rule matching and permission warnings during implementation.

### Phases and ordered feature inventory

| ID | Phase | Feature | Depends on |
| --- | --- | --- | --- |
| 001 | Foundation | Manifest V3 shell, local configuration model, and MDO styled popup/options layout | None |
| 002 | Configuration | Add, validate, display, and remove blocked sites | 001 |
| 003 | Scheduling | Set the local daily window, calculate active state, and recover transitions after restart | 001 |
| 004 | Blocking | Apply/remove Chrome navigation-blocking rules for the saved sites according to the schedule | 002, 003 |
| 005 | Modes | Normal pause/resume and Hardcore in-app lock, with clear status and limitations | 002, 003, 004 |
| 006 | Release readiness | Manual browser scenarios, accessibility check, packaging instructions, and limitations documentation | 001–005 |

### Validation and acceptance

Load the unpacked extension in Chrome. Verify valid/invalid entries, duplicate and subdomain behavior, sites reachable outside the window, blocked inside it, start/end transitions, a window crossing midnight, browser restart during an active window, Normal pause/resume, and Hardcore's in-app controls. Verify keyboard use, readable status, and reduced motion. Explicitly verify and document that Chrome's own extension controls can still disable or remove a normal install.

### Approved assumptions and decisions

1. **Schedule shape:** One recurring daily window is the accepted starting scope.
2. **Hardcore guarantee:** The user accepts that Chrome can disable or remove the extension, which stops blocking. The lock applies to the extension's own controls during the active window.
3. **Normal pause persistence:** A pause lasts only until the end of the current window; the next window blocks again.
4. **Blocking page:** Use a custom explanation page if supported cleanly by the chosen rule setup; otherwise use Chrome's standard blocked response.

### Feature update (007–009), requested after the initial implementation

- Replace the single daily window with named scheduled sessions. Each session has its own local daily start/end times, blocked sites, Normal/Hardcore mode, and Normal pause state. Overnight windows remain supported. Multiple sessions may overlap; a site stays blocked while any active, unpaused session includes it.
- Preserve existing user data by migrating the former site list, schedule, mode, and pause into one named session. New installations start with no scheduled sessions.
- A Hardcore session locks only its own schedule, mode, removal, and site removals while active. Other sessions remain independently editable. Chrome can still disable or remove the extension.
- Add a Pomodoro timer with its **own selected sites** and configurable focus and break lengths (defaults proposed: 25/5 minutes). Focus and break phases alternate automatically. Sites are blocked only during a running focus phase. Pause freezes the countdown and stops Pomodoro blocking; resume continues the remaining phase. Timer state survives popup closure and browser restart using stored timestamps.
- Proposal for consistent modes: Pomodoro also offers Normal/Hardcore. During a running Hardcore focus phase, in-app pause, stop, mode change, and site removal are locked until the break. The user can always disable/remove the extension through Chrome.
- Use the union of active scheduled-session and Pomodoro site lists for Chrome rules and existing-tab handling. The popup shows active sessions and the Pomodoro countdown; the options page manages scheduled sessions and Pomodoro settings.

| ID | Phase | Feature | Depends on |
| --- | --- | --- | --- |
| 007 | Sessions | Migrate existing settings and add independently scheduled, named sessions with per-session sites and modes | 001–005 |
| 008 | Pomodoro | Add configurable focus/break cycles, timer controls, dedicated sites, and union blocking | 007 |
| 009 | Verification | Test migration, overlaps, timer transitions/restart, Hardcore locks, UI, and browser behavior; update documentation | 007, 008 |

Validate migration without data loss; independent and overlapping windows; domain union; Pomodoro focus, break, pause, resume, stop, and restart; interactions between a scheduled session and Pomodoro; and old Hardcore behavior within each session. Browser acceptance still requires a runnable Chrome environment.

## Português

### Objetivo e usuários

Criar uma extensão do Chrome para pessoas que querem evitar sites escolhidos durante um horário definido. A pessoa adiciona sites, define início e fim e escolhe o modo Normal ou Hardcore. A extensão mostra claramente o horário e o estado atual do bloqueio.

### Comportamento proposto

- **Horário:** Proposta: uma faixa diária recorrente no fuso local, como 13:00–18:00. Fora dela, os sites ficam acessíveis. O início é inclusivo e o fim é exclusivo. Faixas que passam da meia-noite são aceitas. Lista, horário e modo são salvos localmente.
- **Lista de sites:** Adicionar e remover domínios ou URLs; normalizar para o domínio, rejeitar entradas inválidas e duplicadas e bloquear o domínio e seus subdomínios em HTTP e HTTPS. O escopo inicial cobre a navegação principal no Chrome, não o tráfego de outros aplicativos.
- **Modo Normal:** A pessoa pode pausar e retomar o bloqueio pela extensão a qualquer momento, inclusive durante a faixa. A pausa termina junto com a faixa atual; a próxima faixa volta a bloquear.
- **Modo Hardcore:** Proposta: durante a faixa ativa, a extensão impede, em sua própria interface, pausar, encurtar o horário, trocar de modo e remover sites bloqueados. Fora da faixa, essas alterações são permitidas. Antes da escolha, mostrar o fim da trava e uma explicação clara.
- **Limite do Hardcore:** Uma extensão comum instalada pela pessoa não consegue impedir que ela a desative ou remova pelos controles do Chrome. A pessoa confirmou que, nesses casos, o bloqueio deve parar. Hardcore é apenas uma **trava de compromisso dentro da extensão**. Explicar isso corretamente na interface. A [política de instalação do Chrome Enterprise](https://support.google.com/chrome/a/answer/6306504) descreve outro modelo, com navegador gerenciado, fora deste plano.
- **Navegação bloqueada:** Mostrar uma página simples de bloqueio ou a resposta padrão do Chrome com o site e o horário de término, conforme as possibilidades da API escolhida. Não sugerir cobertura de acessos fora do Chrome.

### Abordagem técnica proposta

Usar Manifest V3, popup para estado e ações rápidas e página de opções para sites, horário e modo. Seguir o MDO Design System local em `/home/rookie/Projects/mdo-design-system`: paleta escura, verde para ação/foco, tokens e componentes CSS existentes, raio de 8px e respeito a movimento reduzido. Empacotar o CSS na extensão, sem servidor em execução. Usar `chrome.storage.local` para configuração, `chrome.alarms` e reconciliação na inicialização para transições de horário, e regras dinâmicas de `chrome.declarativeNetRequest` para bloquear sites quando necessário. Regras dinâmicas persistem entre sessões; ainda é preciso reconciliar estado salvo e alarmes após inicialização ou mudanças. [API DNR](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest), [ciclo de vida do service worker](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle), [tutorial de alarmes](https://developer.chrome.com/docs/extensions/get-started/tutorial/service-worker-events).

Não se propõem conta, sincronização em nuvem, análises nem serviço externo. Solicitar somente as permissões necessárias. Conferir correspondência das regras e avisos de permissão do Chrome durante a implementação.

### Fases e inventário ordenado de funcionalidades

| ID | Fase | Funcionalidade | Dependências |
| --- | --- | --- | --- |
| 001 | Base | Estrutura Manifest V3, modelo de configuração local e layout de popup/opções com MDO | Nenhuma |
| 002 | Configuração | Adicionar, validar, exibir e remover sites bloqueados | 001 |
| 003 | Horários | Definir a faixa diária local, calcular estado ativo e recuperar transições após reinício | 001 |
| 004 | Bloqueio | Aplicar/remover regras de bloqueio de navegação conforme sites e horário salvos | 002, 003 |
| 005 | Modos | Pausar/retomar no Normal e travar controles internos no Hardcore, com estado e limites claros | 002, 003, 004 |
| 006 | Preparação | Cenários manuais no navegador, verificação de acessibilidade, instruções de empacotamento e documentação dos limites | 001–005 |

### Validação e aceite

Carregar a extensão descompactada no Chrome. Verificar entradas válidas/inválidas, duplicatas e subdomínios, acesso fora da faixa, bloqueio dentro dela, transições de início/fim, faixa que passa da meia-noite, reinício do navegador durante bloqueio, pausa/retomada no Normal e controles internos do Hardcore. Verificar uso por teclado, clareza do estado e movimento reduzido. Confirmar e documentar explicitamente que os controles do Chrome ainda podem desativar ou remover uma instalação comum.

### Premissas e decisões aprovadas

1. **Formato do horário:** Uma faixa diária recorrente é o escopo inicial aprovado.
2. **Garantia do Hardcore:** A pessoa aceita que desativar ou remover a extensão pelo Chrome interrompe o bloqueio. A trava vale para os controles da própria extensão durante a faixa ativa.
3. **Duração da pausa no Normal:** A pausa termina junto com a faixa atual; a próxima faixa volta a bloquear.
4. **Página de bloqueio:** Usar página explicativa própria se for viável com as regras escolhidas; caso contrário, usar a resposta padrão do Chrome.

### Atualização de funcionalidades (007–009), solicitada após a implementação inicial

- Substituir a faixa diária única por sessões agendadas com nome. Cada sessão tem início/fim diário no horário local, seus próprios sites, modo Normal/Hardcore e estado de pausa no Normal. Faixas que passam da meia-noite continuam válidas. Sessões podem se sobrepor; o site permanece bloqueado enquanto qualquer sessão ativa e não pausada o incluir.
- Preservar dados existentes migrando a lista de sites, horário, modo e pausa anteriores para uma sessão com nome. Instalações novas começam sem sessões agendadas.
- Uma sessão Hardcore trava apenas o próprio horário, modo, exclusão da sessão e remoção de seus sites enquanto estiver ativa. Outras sessões continuam editáveis de forma independente. O Chrome ainda pode desativar ou remover a extensão.
- Adicionar um temporizador Pomodoro com **sites próprios escolhidos** e durações configuráveis de foco e descanso (padrão proposto: 25/5 minutos). As fases de foco e descanso alternam automaticamente. Os sites ficam bloqueados somente durante foco em andamento. Pausar congela a contagem e interrompe o bloqueio do Pomodoro; retomar continua a fase restante. O estado persiste ao fechar o popup e reiniciar o navegador por meio de horários salvos.
- Proposta para manter os modos coerentes: o Pomodoro também oferece Normal/Hardcore. Durante foco Hardcore em andamento, a interface trava pausa, parada, troca de modo e remoção de sites até o descanso. A pessoa ainda pode desativar/remover a extensão pelo Chrome.
- Usar a união das listas das sessões agendadas ativas e do Pomodoro para as regras do Chrome e as abas já abertas. O popup mostra sessões ativas e a contagem do Pomodoro; a página de opções gerencia sessões e configurações do Pomodoro.

| ID | Fase | Funcionalidade | Dependências |
| --- | --- | --- | --- |
| 007 | Sessões | Migrar configurações existentes e criar sessões independentes com sites, horários e modos próprios | 001–005 |
| 008 | Pomodoro | Criar ciclos configuráveis de foco/descanso, controles do temporizador, sites próprios e união do bloqueio | 007 |
| 009 | Verificação | Testar migração, sobreposições, transições/reinício do timer, travas Hardcore, interface e navegador; atualizar documentação | 007, 008 |

Validar migração sem perda de dados; faixas independentes e sobrepostas; união de domínios; foco, descanso, pausa, retomada, parada e reinício do Pomodoro; interação entre sessão agendada e Pomodoro; e o comportamento Hardcore de cada sessão. A validação no navegador ainda exige um ambiente em que o Chrome execute.

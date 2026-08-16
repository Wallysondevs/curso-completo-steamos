O Modo Desktop é o "lado PC" do Steam Deck: KDE Plasma sobre Wayland ou X11, com o Dolphin, o Discover, o Konsole e tudo mais que você aprendeu ao longo do curso. Quando o Desktop trava, congela ou se recusa a reconhecer um periférico, os sintomas são diferentes dos do Modo Jogo — e as ferramentas também. Esta seção cobre os problemas específicos da área de trabalho.

Uma observação que evita muita frustração: o Modo Jogo (Gamescope) e o Modo Desktop (KDE) são **sessões gráficas separadas**. O que funciona numa pode não funcionar na outra, e um periférico reconhecido no Desktop pode ser ignorado no Jogo por uma política de compositor diferente. Não assuma que o problema é do aparelho — verifique em qual sessão você está.

:::objetivos
- Separar problema de sessão (Gamescope vs KDE) de problema de sistema
- Desfazer um Desktop que congelou sem perder dados
- Diagnosticar periféricos que não são reconhecidos (impressora, USB, Bluetooth)
- Alternar entre Wayland e X11 quando um aplicativo só roda em um deles
- Recuperar uma sessão Plasma corrompida (configs, cache, wallpaper)
:::

## Tabela do Modo Desktop

| Sintoma | Causa provável | Solução |
|---|---|---|
| Desktop congela, mouse não mexe | Compositor KWin travou, driver, app fullscreen | `Ctrl+Alt+F3` para outro TTY; `loginctl terminate-session`; ou `sudo systemctl restart sddm` |
| Plasma não carrega, tela fica preta após login | Sessão/cache Plasma corrompida | Renomeie `~/.config/plasma-org.kde.plasma.desktop-appletsrc` e `~/.cache`; reconecte |
| App só funciona em X11 (ou Wayland) | Compatibilidade do toolkit (Qt/GTK) | Na tela de login troque a sessão: "Plasma (X11)" vs "Plasma (Wayland)" |
| Impressora não é encontrada | CUPS não detectou, driver, rede | `systemctl status cups`; `lpinfo -v`; instale driver via `lpadmin` |
| Dispositivo USB não aparece | Porta/cabo, driver ausente, alimentação insuficiente | `lsusb` vê? `dmesg | tail`; teste outro cabo/hub com energia |
| Monitor externo no Desktop some ao alternar | Hotplug do KWin, sessão Wayland | `xrandr --query` (X11) ou `kscreen-doctor -o` (Wayland); reconfigure |
| Tecla/atalho de teclado não funciona | Atalho rebatido, teclado config errado | Configurações KDE → Atalhos; cheque o layout do teclado (ABNT vs US) |
| Desktop muito lento/memória cheia | Indexador Baloo, widgets, efeitos KDE pesados | Desligue Baloo (Busca), reduza efeitos (Compositor → sem blur); `htop` |
| Wallpaper/ícones sumiram após update | Cache/Confs do Plasma conflitantes | `kquitapp5 plasmashell; kstart5 plasmashell` para reiniciar a shell |

## Quando o Desktop congela

Um congelamento do Desktop geralmente é o **KWin** (compositor) ou um aplicativo que travou em fullscreen. Antes de desligar de forma bruta, tente recuperar a sessão:

```terminal
# Passo 1: mude para outro TTY (o Desktop fica no TTY1 normalmente)
# Pressione: Ctrl+Alt+F3  (ou F4, F5...)
```

A troca de TTY dá um shell de texto mesmo com o Desktop congelado. A partir dali:

```terminal
# Passo 2: veja as sessões e processos
$ loginctl list-sessions
$ w                      # quem está logado?

# Passo 3: reinicie o gerenciador de sessão (derruba o Desktop, não o sistema):
$ sudo systemctl restart sddm
```

O `restart sddm` reinicia o gerenciador de login, te devolvendo à tela de login — seus apps fechados, mas o sistema intacto (nada de desligar no botão). Se nem o TTY responder, aí sim vem o reset físico (botão de energia 10 s).

```terminal
# Alternativa fina: matar só a shell Plasma (não a sessão inteira):
$ kquitapp5 plasmashell && kstart5 plasmashell
```

Esse par derruba e religa o **plasmashell** (painéis, área de trabalho, ícones) sem tocar nas janelas abertas — útil quando o painel sumiu ou o desktop ficou vazio, mas o resto responde.

## Wayland versus X11

O KDE Plasma no SteamOS roda por padrão em **Wayland** (mais moderno, melhor para aceleração de hardware), mas oferece **X11** como alternativa na tela de login. A escolha importa na prática: alguns aplicativos antigos (especialmente ferramentas de captura de tela, alguns jogos e applets) só funcionam bem em X11; outros (com suporte a HDR, escalonamento por monitor) preferem Wayland.

Na tela de login do SDDM, há um seletor de sessão (canto inferior, antes de logar):

- **Plasma (Wayland)** — padrão.
- **Plasma (X11)** — fallback de compatibilidade.

Para descobrir qual você está usando agora:

```terminal
$ echo $XDG_SESSION_TYPE
wayland
```

Ou, no X11 mais especificamente, `xrandr` funciona e `echo $XDG_SESSION_TYPE` retorna `x11`.

:::dica
Se um app tem comportamento gráfico bizarro no Desktop (sem redimensionar, sem capturar tela, janelas transparentes), a primeira coisa a testar é mudar de Wayland para X11 (ou o contrário) na tela de login. Metade dos "bugs visuais" do Plasma são, na verdade, incompatibilidade de toolkit com o protocolo de sessão.
:::

## Periféricos que não aparecem

Um dispositivo que não é reconhecido tem uma hierarquia de causas que começa no cabo e termina no driver:

```terminal
# Passo 1: o kernel viu o dispositivo?
$ lsusb
Bus 003 Device 005: ID 0bda:8153 Realtek USB 10/100/1000 LAN

$ dmesg | tail -15
[ ...] usb 3-2: new full-speed USB device number 5 using xhci_hcd
```

Se o `lsusb` **mostra** o dispositivo, o hardware está ok e o problema é de driver ou de usuário (permissões, udev). Se **não mostra**, é cabo, porta ou alimentação — teste outro cabo/porta antes de culpar o driver.

Para **impressoras**, o subsistema é o CUPS:

```terminal
$ systemctl status cups
$ lpinfo -v                       # lista as impressoras/portas detectadas
$ lpstat -p -d                    # estado das filas
```

Uma impressora em rede (via IP) que "some" costuma ser descoberta mDNS/DNSSD desligado ou o endereço IP mudado (sem reserva no roteador). Adicione manualmente:

```terminal
$ lpadmin -p MinhaImpressora -E -v ipp://192.168.0.50/ipp/print -m everywhere
```

O `-m everywhere` usa o driver "everywhere" (driverless) que funciona com a maioria das impressoras modernas.

## Configs Plasma corrompidas

Depois de um update, o Plasma pode entrar em estados estranhos: wallpaper some, painel com duplicidade, atalhos quebrados, desktop vazio. Quase sempre é cache/config conflitante. A recuperação em ordem de agressividade:

```terminal
# 1) Reiniciar só a shell (inofensivo):
$ kquitapp5 plasmashell && kstart5 plasmashell

# 2) Limpar o cache do Plasma (perde thumbnails, wallpaper customizados podem resetar):
$ mv ~/.cache ~/.cache.bak

# 3) Resetar a config dos applets/desktop (painéis e widgets voltam ao padrão):
$ mv ~/.config/plasma-org.kde.plasma.desktop-appletsrc ~/.config/plasma-org.kde.plasma.desktop-appletsrc.bak
```

A opção 3 preserva um backup (`.bak`) para você voltar atrás. Ela reinicia os painéis e widgets, mas não toca em arquivos, senhas ou aplicativos — é um reset *visual* do Plasma, não um reset de dados.

:::nota
Referências aprofundadas: Modo Desktop e KDE Plasma (cap. 19–20), Dolphin e configs (cap. 21–22), periféricos e impressoras (cap. 26), e atalhos de teclado (cap. 27).
:::

## Resumo

- Modo Jogo (Gamescope) e Modo Desktop (KDE) são sessões separadas; periféricos podem se comportar diferente em cada uma.
- Desktop congelou → Ctrl+Alt+F3 para TTY, depois `sudo systemctl restart sddm` (evita desligamento bruto).
- Wayland vs X11 é a primeira variável a testar quando um app se comporta mal visualmente.
- Periférico "sumiu": `lsusb` + `dmesg` separam cabo/porta de driver/permissão.
- Plasma estranho após update → reinicie a shell, depois cache, depois reset de applets (com backup).

## Exercícios

1. Execute `echo $XDG_SESSION_TYPE` e registre se você está em Wayland ou X11. Deslogue, mude a sessão na tela de login para a outra e compare a experiência.
2. Desligue o Desktop via TTY: pressione `Ctrl+Alt+F3`, faça login e investigue com `loginctl list-sessions`. Depois volte com `Ctrl+Alt+F1`. O Desktop ainda estava funcionando?
3. Conecte um pen drive ou hub USB e execute `lsusb` + `dmesg | tail`. O dispositivo foi detectado? Conte quantas linhas de log o kernel emitiu para ele.
4. Reinicie a shell Plasma com `kquitapp5 plasmashell && kstart5 plasmashell`. O que desaparece e reaparece? Alguma janela aberta foi afetada?
5. **Desafio.** Faça um reset controlado dos applets: mova `~/.config/plasma-org.kde.plasma.desktop-appletsrc` para `.bak`, reconecte e observe o desktop voltar ao padrão. Depois restaure o arquivo original e reconecte de novo. Documente o que mudou em cada etapa.
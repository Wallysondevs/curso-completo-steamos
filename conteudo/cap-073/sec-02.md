O Decky Loader tem dois caminhos de instalação: o instalador gráfico, que você roda clicando num arquivo `.desktop` no Desktop Mode, e o instalador por linha de comando, um `curl | sh` que faz a mesma coisa de dentro do Konsole. Os dois terminam no mesmo lugar, montando `~/homebrew/` e registrando um serviço `systemd` para o backend. Esta seção mostra os dois, do jeito que a documentação oficial propõe, e o que cada etapa faz por baixo.

:::objetivos
- Instalar o Decky Loader pelo instalador gráfico e pela linha de comando
- Entender o papel da senha de administrador e da conta `deck`
- Verificar a instalação inspecionando `~/homebrew/` e o serviço systemd
- Retornar ao Game Mode e confirmar que a aba do Decky apareceu
- Conhecer os sinais de uma instalação mal-sucedida
:::

## Pré-requisitos: senha e modo desktop

As duas rotas de instalação exigem privilégio administrativo, porque o instalador precisa criar arquivos fora do seu `$HOME` e registrar um serviço no `systemd`. No SteamOS, a conta padrão é `deck`, e ela **não tem senha definida por padrão**. Antes de instalar, você precisa de uma das duas coisas:

- Ter definido uma senha para `deck` com `passwd` (rodado num terminal do Desktop Mode), ou
- Deixar o instalador definir uma senha temporária `Decky!` para você (a opção que o instalador gráfico oferece).

O instalador precisa disso porque roda partes com `sudo`. Sem senha, o `sudo` falha e a instalação aborta no meio.

:::atencao
Definir senha via `passwd` deixa o valor persistente. Se você aceitar a senha temporária `Decky!` do instalador, troque-a depois com `passwd` — deixar `Decky!` como senha de root num dispositivo que vive logado é um risco de segurança real, especialmente se você expõe SSH.
:::

## Rota 1: instalador gráfico

No Desktop Mode, baixe o arquivo `decky_installer.desktop` e arraste-o para a área de trabalho. Ao dar dois cliques, o Steam Deck executa um script que abre uma janela com opções:

```terminal
$ cd ~/Desktop
$ curl -L -o decky_installer.desktop \
  https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/decky_installer.desktop
$ chmod +x decky_installer.desktop
```

O assistente pergunta qual versão instalar: **Latest Release** (estável, para a maioria das pessoas) ou **Latest Pre-Release** (para desenvolvedores de plugin, pode ter bugs). Escolha a estável. Em seguida, ele pede a senha de administrador (ou oferece definir `Decky!` temporariamente) e instala tudo.

Ao terminar, o assistente mostra um atalho "Return to Gaming Mode". Clique nele para voltar ao Game Mode — o Decky só carrega quando o Game Mode inicia, porque é ali que ele injeta a interface.

## Rota 2: linha de comando

Quem prefere terminal (ou está configurando o deck via SSH) usa o instalador de uma linha:

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  3847  100  3847    0     0  18433      0 --:--:-- --:--:-- --:--:-- 18433
[sudo] password for deck:
```

O `curl` baixa o script `install_release.sh` e o `sh` o executa imediatamente. Ele faz o mesmo trabalho do instalador gráfico: monta a estrutura, baixa a versão estável do Decky Loader e registra o serviço. A etapa do `sudo` é onde você digita a senha.

:::perigo
O padrão `curl ... | sh` executa código baixado da internet sem que você o veja. É o que a documentação oficial do Decky recomenda, e é aceitável quando você confia na fonte (github.com/SteamDeckHomebrew). Para qualquer outro projeto, baixe o script primeiro, leia-o com `less`, e só então execute: `curl -L -o install.sh <url>` seguido de `less install.sh` e `sh install.sh`.
:::

## O que a instalação realmente faz

Independentemente da rota, o resultado é o mesmo conjunto de artefatos. Depois de instalar, você pode inspecioná-los no Desktop Mode:

```terminal
$ ls ~/homebrew/
plugins/  services/  settings/  data/  logs/
$ ls ~/.config/systemd/user/ | grep -i plug
plugin_loader.service
```

Note o detalhe: o serviço do backend se chama `plugin_loader`, não `decky`. É ele que sobe o servidor HTTP local na porta 1337 quando você entra no Game Mode. O nome `homebrew` no diretório remete ao projeto-mãe, não ao Decky especificamente.

```terminal
$ systemctl --user status plugin_loader --no-pager
● plugin_loader.service - Plugin Loader
     Loaded: loaded (/home/deck/.config/systemd/user/plugin_loader.service; enabled; vendor preset: enabled)
     Active: active (running) since Sat 2025-04-19 18:02:11 -03; 4min ago
```

O estado `active (running)` confirma que o backend subiu. Se ele estiver `failed`, a seção 8 deste capítulo trata exatamente disso.

## Voltando ao Game Mode

A instalação não faz efeito até o Game Mode reiniciar. Se você estiver no Desktop Mode, use o atalho "Return to Gaming Mode" ou reinicie a sessão. Dentro do Game Mode, abra o Menu Rápido com `...` e procure o ícone do Decky na lateral — um foguete. Ele se torna a porta de entrada para todos os plugins.

```terminal
$ systemctl --user restart plugin_loader
```

Se, após retornar e o Decky ainda não aparecer, reinicie o serviço manualmente com o comando acima e volte ao Game Mode. É o primeiro passo de diagnóstico antes de qualquer coisa mais drástica.

## Desinstalando (para o caso de querer reverter)

Saber desinstalar tão bem quanto instalar evita pânico. O Decky tem um script de desinstalação espelhado:

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/uninstall.sh | sh
```

Ele remove o serviço, o `~/homebrew/` e desfaz as mudanças. Note que, por segurança, o script tende a **preservar** as configurações e logs em `~/homebrew/` em alguns casos, para você não perder dados ao reinstalar. Se quiser uma remoção realmente limpa, apague a pasta depois:

```terminal
$ rm -rf ~/homebrew/
```

:::atencao
`rm -rf` é destrutivo e irreversível — só rode o comando acima se tiver certeza de que quer descartar todas as configurações e dados dos plugins. Se a intenção é apenas reinstalar o Decky por causa de um bug, prefira o `uninstall.sh` sozinho e deixe a pasta de configurações intacta.
:::

## Resumo

- O Decky se instala pelo instalador gráfico (arquivo `.desktop`) ou por `curl | sh` com `install_release.sh`; os dois terminam montando `~/homebrew/`.
- A conta `deck` não tem senha por padrão; a instalação precisa de uma senha de `sudo` ou define `Decky!` temporariamente.
- O backend roda como serviço `systemd` de usuário chamado `plugin_loader.service`, escutando na porta 1337.
- O Decky só aparece no Game Mode depois que a sessão é reiniciada; senão, reinicie com `systemctl --user restart plugin_loader`.
- A desinstalação é feita com `uninstall.sh`; para remoção total, apague `~/homebrew/` após desinstalar.

## Exercícios

1. Instale o Decky Loader pela rota que preferir (gráfica ou linha de comando), anotando em qual etapa ele pediu a senha de administrador.
2. Depois da instalação, liste `~/homebrew/` e identifique cada subpasta. O que diferencia `plugins/` de `settings/`?
3. Rode `systemctl --user status plugin_loader` e escreva o estado atual (`active`, `inactive`, `failed`) e o que cada um significaria para o funcionamento dos plugins.
4. Entre no Game Mode, abra o Menu Rápido e confirme que o ícone do Decky apareceu. Se não apareceu, reinicie o serviço e tente de novo, documentando o que funcionou.
5. **Desafio.** Baixe o `install_release.sh` sem executá-lo (`curl -L -o ...`), abra com `less` e localize os comandos que criam `~/homebrew/` e registram o serviço `systemd`. Explique em três linhas o que o script faz, sem o rodar.

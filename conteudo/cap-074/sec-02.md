O CSS Loader não vem com o SteamOS: ele é um plugin do **Decky Loader**, e o Decky Loader também não vem. Instalar os dois é um processo conhecido da comunidade, feito pelo terminal ou por um instalador gráfico, e exige um passo que muita gente pula — trocar para o modo Desktop e definir uma senha de administração. Esta seção cobre a instalação completa, do zero até o tema ativo.

:::objetivos
- Trocar do modo Gaming para o modo Desktop do SteamOS
- Definir e usar uma senha de administrador no modo Desktop
- Instalar o Decky Loader e o plugin CSS Loader
- Verificar a instalação pelos arquivos e pelo serviço do sistema
- Conhecer o comando de atualização e remoção do Decky
:::

## Do modo Gaming ao Desktop

O Steam Deck inicia no modo Gaming por padrão, mas o terminal e o gerenciador de pacotes vivem no modo Desktop (uma sessão KDE Plasma baseada em Arch Linux). Para instalar o Decky, você precisa estar lá:

1. Pressione o botão **Steam** e abra o menu **Energia**.
2. Escolha **Alternar para o modo Desktop**.
3. Abra o **Konsole** (o terminal do KDE).

No modo Desktop, o usuário `deck` continua sendo o seu usuário, mas agora há um sistema operacional completo por trás — com `pacman`, `systemctl` e tudo o mais que você já aprendeu a usar na [seção sobre o arquivo os-release](#/cap-005/sec-01).

```terminal
$ whoami
deck
$ cat /etc/os-release | head -2
NAME="SteamOS"
VERSION="3.6.20"
```

A primeira barreira é o `sudo`. Por padrão, a conta `deck` não tem senha definida, e o SteamOS usa uma proteção de *sudo* que exige uma senha definida pelo usuário. O instalador do Decky usa `sudo` para criar o serviço, então você precisa criar uma senha antes:

```terminal
$ passwd
Changing password for deck.
Current password:
New password:
Retype new password:
passwd: password updated successfully
```

O campo `Current password` virá vazio na primeira vez (ainda não há senha) — basta pressionar [[Enter]] e informar a nova senha duas vezes. Essa senha fica associada à conta `deck` e será pedida toda vez que um comando usar `sudo`.

:::atencao
Não esqueça essa senha. O SteamOS não tem um "esqueci minha senha" amigável no modo Desktop; recuperar envolve redefinir pelo modo de recuperação. Anote antes de seguir.
:::

## Instalando o Decky Loader

O jeito mais confiável é o script oficial de instalação, baixado via `curl` e executado com o interpretador do sistema. O script detecta o SteamOS e configura o serviço que carrega os plugins no modo Gaming:

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 12345  100 12345    0     0  45678      0 --:--:-- --:--:-- --:--:-- 45789
Installing Decky Loader...
Creating systemd service...
Decky Loader installed successfully.
```

O script faz três coisas: baixa o binário, instala um **serviço systemd** e registra o plugin de carregamento. Depois de concluído, você volta ao modo Gaming e o Decky aparece como um ícone de plugue no menu lateral (o botão `[[...]]` ou `[[QAM]]`).

Para confirmar que o serviço existe e está ativo, rode no modo Desktop:

```terminal
$ systemctl --user status plugin_loader.service
● plugin_loader.service - Decky Loader
     Loaded: loaded (/home/deck/homebrew/services/plugin_loader.service; enabled; preset: enabled)
     Active: active (running) since Sat 2025-08-16 14:10:22 -03; 2min ago
   Main PID: 2143 (plugin_loader)
```

O estado `active (running)` e a unidade dentro de `~/homebrew/services/` são o sinal de que a instalação seguiu o caminho esperado. Veja que o serviço roda **no escopo do usuário** (`systemctl --user`), não como root — coerente com a ideia de que o Decky só mexe no que pertence ao `deck`.

## Instalando o CSS Loader pelo painel do Decky

Com o Decky ativo no modo Gaming, o CSS Loader é instalado pela própria loja de plugins do Decky, sem terminal:

1. Abra o Decky (ícone de plugue no menu [[QAM]]).
2. Entre na **loja** (Store) e busque por *CSS Loader*.
3. Toque em **Instalar**.

Ao instalar, o Decky baixa o plugin da comunidade e grava a pasta `~/homebrew/plugins/SDH-CssLoader/`. Você pode verificar do terminal o resultado:

```terminal
$ ls ~/homebrew/plugins/
SDH-CssLoader
$ ls ~/homebrew/plugins/SDH-CssLoader/
index.js  plugin.json  backend  frontend
```

O `plugin.json` é o manifesto que o Decky lê para saber que o plugin existe; `index.js` carrega o backend, e `frontend/` contém a interface que você vê no painel. A partir daqui, a seção sobre a [biblioteca e interface de temas](#/cap-074/sec-04) mostra como baixar e ativar o primeiro tema.

## Atualizar e remover

Como o Decky e seus plugins são código de comunidade que acompanha (com atraso) as mudanças do SteamOS, mantê-los atualizados evita a maioria das quebras. O próprio painel do Decky oferece atualização com um toque, mas há um comando equivalente pela linha:

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
Updating Decky Loader...
Decky Loader is up to date.
```

O mesmo script serve para instalar e atualizar — ele é idempotente. Para **remover** por completo (o que desfaz o serviço e os plugins), o projeto fornece um desinstalador:

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/uninstall.sh | sh
Removing Decky Loader...
Removed systemd service.
Decky Loader uninstalled.
```

:::dica
Sempre que o SteamOS receber uma atualização grande do cliente (não apenas correções de jogo), abra o Decky e verifique se há atualização dos plugins **antes** de reclamar que um tema quebrou. Quase sempre o problema é versão desatualizada, não o tema em si.
:::

## Resumo

- Instalar o CSS Loader exige trocar para o modo Desktop e definir senha para a conta `deck` com `passwd`.
- O Decky Loader é instalado por um script via `curl`, que cria o serviço de usuário `plugin_loader.service`.
- O serviço roda no escopo do usuário (`systemctl --user`) e vive em `~/homebrew/services/`.
- O CSS Loader é instalado pela loja do Decky e grava arquivos em `~/homebrew/plugins/SDH-CssLoader/`.
- O mesmo script de instalação atualiza o Decky, e um desinstalador remove serviço e plugins.

## Exercícios

1. No modo Desktop, execute `passwd` e defina uma senha para `deck`; depois rode `sudo whoami` e confirme que retorna `root`.
2. Confirme que o serviço do Decky existe com `systemctl --user status plugin_loader.service` e anote o caminho da unidade carregada.
3. Liste `~/homebrew/plugins/` e identifique quais plugins estão instalados além do CSS Loader.
4. Rode `cat ~/homebrew/plugins/SDH-CssLoader/plugin.json` e localize o campo que define a versão do plugin.
5. **Desafio.** Explique a diferença entre um serviço `systemctl --user` e um serviço de sistema (`systemctl` sem `--user`) usando o que você aprendeu sobre systemd. Por que faz sentido o Decky rodar no escopo do usuário `deck` em vez de como root?

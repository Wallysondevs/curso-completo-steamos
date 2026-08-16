Aplicar CSS na mão num Steam Deck é possível, mas frágil: a cada atualização do Steam, nomes de classe mudam e o tema quebra em silêncio. O Decky Loader existe para tirar esse fardo das suas costas — ele é o carregador de plugins que se acopla ao cliente Steam e dá a ele um menu próprio, com loja de plugins, atualizações e a base sobre a qual o CSS Loader (e dezenas de outras extensões) funciona. Esta seção cobre a instalação, a estrutura no disco e como manter o Decky saudável.

:::objetivos
- Instalar o Decky Loader no Steam Deck
- Entender onde os plugins ficam no disco e como são carregados
- Navegar pela interface de plugins dentro do modo jogo
- Atualizar e, se necessário, remover o Decky com segurança
- Reconhecer os sinais de um Decky quebrado após atualização do Steam
:::

## O que o Decky faz por baixo

O Decky Loader não é um jogo nem um aplicativo comum: é um *plugin loader* que injeta código no processo do Steam. Ele abre uma ponte entre a interface do modo jogo e um pequeno serviço local que gerencia plugins, atualizações e configurações. Por isso ele aparece como um menu extra (o botão `...` de configurações rápidas ganha uma aba de plugins) em vez de um programa separado no desktop.

A instalação é feita por um script mantido pela comunidade. O caminho recomendado hoje é clonar o repositório oficial e rodar o instalador, que detecta a arquitetura e a versão do Steam e grava o necessário no diretório do usuário.

```terminal
$ git clone https://github.com/SteamDeckHomebrew/decky-loader.git ~/decky-loader
Cloning into '/home/ana/decky-loader'...
remote: Enumerating objects: 512, done.
remote: Counting objects: 100% (512/512), done.
remote: Compiling objects: 100% (318/318), done.
Receiving objects: 100% (318/318), 1.12 MiB | 4.20 MiB/s, done.
$ cd ~/decky-loader
$ ./install_release.sh
Detected SteamOS / Steam Deck
Installing Decky Loader...
Creating homebrew services...
Decky Loader installed. Restart Steam to complete.
```

O final do script avisa para reiniciar o Steam. No Steam Deck, isso significa voltar ao modo desktop e dar um *Return to Gaming Mode*, ou sair e entrar do cliente. Só depois disso o menu de plugins aparece.

:::nota
Se `git` não estiver disponível no seu usuário, o SteamOS oferece acesso no modo desktop ao repositório flathub, e o próprio guia do Decky (no repositório oficial) traz o `.desktop` e o instalador alternativo. O essencial é usar **somente** o script e o endereço oficiais — cópias de terceiros podem embutir payloads.
:::

## Onde os plugins vivem

Depois de instalado, o Decky cria uma árvore própria dentro do `home` do usuário. Entender essa árvore ajuda a diagnosticar qualquer problema sem depender de adivinhação.

```terminal
$ ls -la ~/homebrew
total 20
drwxr-xr-x 4 ana ana 4096 Feb 10 15:10 .
drwxr-xr-x 3 ana ana 4096 Feb 10 15:08 ..
drwxr-xr-x 2 ana ana 4096 Feb 10 15:10 plugins
drwxr-xr-x 2 ana ana 4096 Feb 10 15:10 services
$ ls ~/homebrew/plugins
...
$ systemctl --user list-units 'plugin_loader*' --no-pager
  UNIT                    LOAD   ACTIVE SUB     DESCRIPTION
  plugin_loader.service   loaded active running Decky plugin loader
```

O diretório `~/homebrew/plugins` guarda cada plugin instalado (cada um numa subpasta), e `~/homebrew/services` guarda definições de serviços de sistema que os plugins podem declarar. O `plugin_loader.service` é o serviço *userland* que permanece rodando e é o coração do Decky — se ele cai, o menu de plugins some do modo jogo.

Cada plugin é, na prática, um pacote com um `package.json` que descreve nome, versão e pontos de entrada (front-end em JavaScript/React e back-end em Python). O Decky lê esses metadados para montar a loja de plugins.

```terminal
$ cat ~/homebrew/plugins/SomePlugin/package.json 2>/dev/null | head -12
{
  "name": "SomePlugin",
  "version": "v1.2.3",
  "description": "Example plugin",
  "main": "dist/index.js",
  "scripts": { "build": "..." }
}
```

## Usando o menu de plugins

Tudo o que o Decky gerencia fica acessível pelo modo jogo, sem tocar no terminal. Ao abrir o menu `...` (o botão de reticências no controle), surge a aba de plugins; dentro dela há uma loja com categorias, um botão de instalar/desinstalar e configurações por plugin.

O fluxo básico é: abrir a loja, buscar o plugin, instalar e — quando o plugin pedir — reiniciar o cliente para carregar o front-end. Instalar é rápido; ativar algumas extensões exige reiniciar o Steam porque o código é injetado na inicialização.

```text
Modo jogo -> menu "..." -> aba Plugins -> Loja -> buscar -> Instalar -> (reiniciar se pedir)
```

A loja pesquisa pelo nome do plugin e mostra versão, autor e descrição. Vale favoritar o cuidado com a procedência: a loja oficial do Decky concentra plugins revisados pela comunidade, mas a barra de "revisão" varia — leia o que um plugin faz antes de instalar, especialmente os que pedem permissões amplas.

## Atualizações e o ciclo da quebra

O Decky acompanha as atualizações do Steam, mas fica um passo atrás: quando a Valve lança um build novo, a interface muda e o Decky pode parar de injetar corretamente até a comunidade lançar uma versão compatível. Os sintomas típicos são discretos — o menu de plugins some, ou o Steam abre sem a aba de plugins, ou uma mensagem de "versão incompatível" aparece.

```terminal
$ journalctl --user -u plugin_loader.service --no-pager | tail -8
Feb 10 15:12:01 steamdeck plugin_loader[1400]: checking for update...
Feb 10 15:12:02 steamdeck plugin_loader[1400]: steam client version: 1738026274
Feb 10 15:12:02 steamdeck plugin_loader[1400]: no compatible loader found, waiting
```

A mensagem `no compatible loader found` é o sinal clássico de que o Steam atualizou e o Decky ainda não tem suporte. A correção é quase sempre a mesma: atualizar o Decky (pelo menu, se você o alcançar, ou rodando o instalador novamente) e aguardar a comunidade acompanhar o build.

:::atencao
Nunca tente "consertar" um Decky quebrado desinstalando e reinstalando o Steam inteiro, nem desativando o modo somente-leitura do sistema. O problema quase sempre se resolve atualizando o próprio Decky; reiniciar o aparelho e rodar o instalador atualizado cobre a grande maioria dos casos.
:::

## Removendo com limpeza

Se decidir que não quer mais o Decky, o mesmo repositório traz o caminho de desinstalação. O script remove os serviços e a pasta `~/homebrew`, devolvendo o Steam ao estado original.

```terminal
$ cd ~/decky-loader
$ ./uninstall.sh
Removing Decky Loader...
Disabling homebrew services...
Removing /home/ana/homebrew...
Decky Loader removed. Restart Steam to complete.
```

A remoção não toca no restante do sistema, porque tudo que foi instalado ficava contido em `~/homebrew`. É essa contenção — todo o Decky dentro de uma pasta de usuário — que torna o experimento seguro e reversível.

## Resumo

- O Decky Loader injeta um menu de plugins no modo jogo e gerencia-os via um serviço local.
- A instalação é feita pelo script oficial (`install_release.sh`) clonado do repositório da comunidade.
- Plugins ficam em `~/homebrew/plugins`; o `plugin_loader.service` é o serviço que mantém o Decky ativo.
- O menu de plugins aparece na aba `...` do modo jogo, com loja, instalar e configurações.
- Um Steam atualizado pode deixar o Decky sem suporte temporário; a correção é atualizar o Decky.
- A desinstalação (`uninstall.sh`) remove a pasta `~/homebrew` e restaura o estado original.

## Exercícios

1. Instale o Decky Loader seguindo o script oficial e confirme, com `ls ~/homebrew/plugins`, que a pasta de plugins foi criada.
2. No modo jogo, localize a aba de plugins no menu `...` e liste quais plugins vêm pré-instalados na sua máquina.
3. Rode `systemctl --user status plugin_loader.service` e identifique se o serviço está `active (running)`.
4. Abra o `package.json` de um plugin instalado e anote o campo `version`. Explique por que ele importa no contexto de atualizações do Steam.
5. **Desafio.** Leia as últimas linhas do log do `plugin_loader` com `journalctl --user` e descreva o que a mensagem `no compatible loader found` significa e qual é a ação correta para resolvê-la.

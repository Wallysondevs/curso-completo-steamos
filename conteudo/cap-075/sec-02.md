Antes de qualquer animação nova, é preciso instalar o carregador que torna os plugins possíveis: o Decky Loader. Ele é um projeto da comunidade que injeta uma barra lateral de plugins no Game Mode, e sua instalação no Steam Deck é um script de uma linha. Mas o que parece simples esconde algumas decisões: Steam bloqueia a raiz por padrão, o deck usa uma partição read-only, e o Decky precisa de um caminho persistente que sobreviva a atualizações do sistema.

:::objetivos
- Instalar o Decky Loader pelo script oficial e entender cada etapa
- Configurar o SteamOS para permitir instalação persistente (read-only off)
- Verificar que o Decky aparece no Game Mode antes de instalar plugins
- Instalar o Animation Changer pela loja de plugins do Decky
- Diagnosticar falhas comuns de instalação
:::

## Preparando o terreno: read-only e sudo

O SteamOS monta a partição raiz como somente-leitura por padrão. É uma decisão de design da Valve para proteger o sistema de alterações acidentais. O Decky Loader precisa escrever na raiz para se instalar, então o primeiro passo é desabilitar essa trava:

```terminal
$ sudo steamos-readonly disable
[sudo] password for deck:
readonly filesystem disabled on /etc, /usr
```

O comando `steamos-readonly disable` é um script de conveniência que a Valve incluiu exatamente para este cenário: desenvolvedores e usuários que precisam modificar o sistema fora do Flatpak. Ele não é permanente — volta ao normal com `steamos-readonly enable` ou após uma atualização do sistema.

:::perigo
Desabilitar o read-only remove uma camada de proteção. Com a raiz montada como leitura-escrita, um `sudo rm -rf /` acidental ou um script malicioso pode corromper o sistema. Só mantenha o read-only desabilitado enquanto instala coisas que precisam dele. Depois da instalação, reabilite com `sudo steamos-readonly enable`.
:::

## Instalando o Decky Loader

A instalação do Decky Loader é um `curl` direto, executado como root, que baixa e roda o script oficial:

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
100  4523  100  4523    0     0  15596      0 --:--:-- --:--:-- --:--:-- 15596
Installing Decky Loader...
Placing service files...
Enabling service...
Starting service...
Decky Loader installed successfully!
```

O script faz três coisas: copia o binário do Decky para o sistema, instala e habilita um serviço `systemd` para iniciá-lo com o Steam, e registra o plugin no diretório que o Game Mode procura. Se você ler a saída linha a linha, a história está toda ali: `Placing service files`, `Enabling service`, `Starting service`.

```terminal
$ systemctl --user status plugin_loader 2>/dev/null || systemctl status plugin_loader
● plugin_loader.service - Decky Plugin Loader
     Loaded: loaded (/etc/systemd/system/plugin_loader.service; enabled)
     Active: active (running) since ...
```

A unidade do systemd que gerencia o Decky se chama `plugin_loader`. Se essa unidade está `active (running)`, o Decky está no ar. Se não, reinicie a sessão Steam (não a máquina inteira):

```terminal
$ systemctl restart plugin_loader
```

:::dica
Se o Decky não aparece no Game Mode mesmo com o serviço rodando, tente sair do Game Mode para o desktop e voltar. O Decky é injetado na sessão Steam — uma troca de modo recarrega a injeção.
:::

## Primeiro acesso no Game Mode

Depois de instalar, volte ao Game Mode. O Decky Loader aparece como um ícone no menu de acesso rápido (botão `...` ou `[[QAM]]`). Ao abrir pela primeira vez, você verá uma tela de boas-vindas e o convite para definir uma senha sudo temporária — o Decky precisa de elevação para algumas operações.

A tela também mostra a loja de plugins. O catálogo é puxado de um repositório da comunidade e inclui dezenas de plugins. O que interessa agora é o **Animation Changer**.

## Instalando o Animation Changer

Dentro do Decky, vá até a aba de loja (ícone de sacola) e busque por "Animation Changer". A instalação é um clique. O que acontece por trás:

```terminal
$ ls ~/homebrew/plugins/
AnimationChanger/
```

A pasta `~/homebrew/plugins/` é o ponto de encontro de todos os plugins instalados via Decky. Cada plugin vive numa subpasta com seu código Python, front-end e assets. O Animation Changer, especificamente, baixa um banco de temas da comunidade e os expõe como uma galeria dentro do Game Mode.

```terminal
$ ls ~/homebrew/plugins/AnimationChanger/
dist/
src/
plugin.json
package.json
animations/
```

O `plugin.json` é o manifesto — ele declara o nome, versão, autor e quais permissões o plugin precisa. O `animations/` pode estar vazio ou ter samples: os temas propriamente ditos são baixados sob demanda, quando você escolhe um na galeria.

:::info
A pasta `~/homebrew/` é a casa do ecossistema Decky no Steam Deck. Além de `plugins/`, ela pode conter `themes/` (para temas CSS do Decky), `data/` (para configuração persistente) e `logs/` (para diagnóstico). Se algo der errado, é nessa árvore que você começa a procurar.
:::

## Primeira troca: teste rápido

Dentro do Animation Changer, escolha uma animação de boot da galeria e clique em "Apply". O plugin baixa o WebM e o registra. Para testar, reinicie o Steam Deck (ou role a tela do plugin até a opção "Test Boot Animation", que mostra o vídeo sem reiniciar).

O ciclo completo de uma troca funciona assim:

1. Você escolhe um tema na galeria.
2. O plugin baixa o `.webm` ou `.mp4` para a pasta de temas.
3. O plugin escreve no arquivo de configuração nativo que aponta para esse vídeo.
4. Na próxima inicialização ou suspensão, o SteamOS lê a configuração e exibe o vídeo.

Os passos 3 e 4 são nativos do SteamOS — o plugin só faz a interface e a escrita. Isso explica por que, se o SteamOS atualiza e muda o formato de configuração, o plugin pode quebrar temporariamente: ele escrevia em um campo que não existe mais.

## Resumo

- O SteamOS monta a raiz como read-only; use `sudo steamos-readonly disable` antes de instalar o Decky Loader.
- O Decky Loader se instala via script `curl | sh` e roda como serviço systemd chamado `plugin_loader`.
- O ponto de entrada no Game Mode é o menu de acesso rápido (`QAM`), onde o Decky injeta sua interface.
- O Animation Changer se instala pela loja do Decky; ele vive em `~/homebrew/plugins/AnimationChanger/`.
- O fluxo completo: escolha → download → registro no arquivo nativo → reinicialização.

## Exercícios

1. Instale o Decky Loader seguindo o script oficial e confira a instalação com `systemctl status plugin_loader`. O serviço foi habilitado (`enabled`)? Está rodando?
2. Entre no Game Mode, abra o Decky e explore a loja de plugins. Quantos plugins estão disponíveis no momento da sua consulta? Quantos deles você reconhece de fóruns ou vídeos sobre Steam Deck?
3. Instale o Animation Changer, liste os arquivos dentro de `~/homebrew/plugins/AnimationChanger/` e descreva o papel de cada um deles com base no nome.
4. Aplique uma animação de boot qualquer da galeria e localize, no disco, o arquivo `.webm` que o plugin acabou de baixar. Em qual diretório ele foi parar?
5. **Desafio.** Desabilite o read-only com `sudo steamos-readonly enable`, reinicie o deck, e tente instalar um segundo plugin pelo Decky. O que acontece? Reabilite em seguida. Isso demonstra por que o read-only precisa estar desligado para qualquer operação de escrita na raiz.
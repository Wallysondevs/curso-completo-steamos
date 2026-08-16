Toda manipulação de arquivos que você faz no Steam Deck passa, em algum momento, por um gerenciador de arquivos. No Modo Desktop, esse papel cabe ao `dolphin`, o gerenciador de arquivos oficial do KDE Plasma — e o mesmo que abre quando você clica em "Abrir pasta" dentro do Steam ou de qualquer aplicativo do sistema. Dominá-lo é o primeiro passo para operar o Deck como um computador de verdade, não apenas como console.

:::objetivos
- Identificar o Dolphin como gerenciador de arquivos padrão do KDE Plasma no SteamOS
- Iniciar o Dolphin pela linha de comando e abrir uma pasta específica
- Entender o papel da KDE Frameworks no acesso a arquivos locais e remotos
- Interpretar a árvore de diretórios navegando pelo painel de locais e breadcrumb
- Localizar e ler o arquivo de configuração do Dolphin
:::

## O gerenciador padrão do Modo Desktop

O SteamOS tem dois mundos gráficos: o Modo Jogo, onde roda só o Steam, e o Modo Desktop, onde roda o KDE Plasma completo. É no Modo Desktop que vive o Dolphin. Ele é o substituto direto do "Explorador de Arquivos" do Windows ou do Finder do macOS, com uma diferença importante: por ser um programa KDE, ele herda recursos poderosos como split view, terminal embutido e a capacidade de montar servidores remotos como se fossem pastas locais.

Você pode abrir o Dolphin de várias formas: pelo menu de aplicativos, pelo atalho de teclado, ou pela linha de comando. A forma de linha de comando é a que mais importa para um curso como este, porque ela funciona igual tanto numa sessão gráfica quanto via SSH.

```terminal
$ dolphin .
```

O ponto final (`dolphin .`) pede para abrir o diretório atual. O processo devolve o controle para o terminal imediatamente (o Dolphin roda em segundo plano) e imprime alguns avisos de protocolo que você pode ignorar. Abrir um caminho específico é igualmente simples:

```terminal
$ dolphin /home/deck/lab
$ dolphin ~/Downloads
```

A segunda forma usa o `~` (til), que o shell expande para o seu diretório home antes de passar o resultado ao Dolphin. É o mesmíssimo atalho que você usa no `cd`.

## Onde o Dolphin guarda suas preferências

Tudo o que você configura no Dolphin — painel lateral visível, tamanho dos ícones, ordenação, plugins ativos — fica num arquivo de texto puro chamado `dolphinrc`, dentro do diretório oculto `~/.config`. Arquivos com ponto na frente do nome são ocultos justamente porque armazenam configuração, e não dados do usuário.

```terminal
$ cat ~/.config/dolphinrc
[General]
Version=301
ViewPropsTimestamp=4,2025,1,1,0,0,0

[KDE]
ColorScheme=SteamOS

[DetailsMode]
Columns=Name,Size,Date,Permissions
PreviewsShown=true

[Search]
Location=Everywhere
FullTextSearch=true
```

A saída usa o formato INI, dividido em grupos entre colchetes (`[General]`, `[DetailsMode]`, `[Search]`). Cada chave guarda uma preferência. Na amostra, `Columns` mostra que a visão em detalhes exibe nome, tamanho, data e permissões; `PreviewsShown=true` indica que as miniaturas estão ativadas. Editar esse arquivo à mão é raramente necessário, mas lê-lo ajuda a entender que "configuração" aqui não é mágica — é texto que pode ser copiado e versionado.

:::dica
Para recomeçar o Dolphin do zero (tirar todas as personalizações), feche todas as janelas e renomeie o arquivo: `mv ~/.config/dolphinrc ~/.config/dolphinrc.bak`. Na próxima abertura, o Dolphin recria um `dolphinrc` com os padrões de fábrica, e seu backup fica intacto caso você queira voltar atrás.
:::

## A KDE Frameworks por trás do navegador

O Dolphin não fala diretamente com o disco. Ele conversa com uma camada chamada KDE Frameworks, e em particular com um subsistema chamado **KIO** (*KDE Input/Output*). O KIO é o que permite ao Dolphin tratar quase qualquer coisa — disco local, servidor SSH, compartilhamento Samba, conteúdo de arquivo zip — como um diretório navegável, com a mesma interface. Essa abstração é a espinha dorsal de tudo o que veremos neste capítulo, de abas até serviços remotos.

```terminal
$ ls ~/.local/share/kio/
exec	servicemenus	service
```

O diretório `~/.local/share/kio/` guarda extensões do KIO: os *service menus* (ações extras que aparecem no menu de contexto clicando com o botão direito). Ainda que quase vazio numa instalação limpa, é para aqui que se instalam plugins que adicionam ações customizadas — um assunto que retomaremos na seção sobre menu de contexto.

:::info
O KIO também é o motivo pelo qual você não precisa de privilégios de root para navegar em pastas remotas: a autenticação é delegada ao protocolo do serviço (SSH, FTP, Samba), e não exige montar nada manualmente, como veremos na seção de serviços remotos.
:::

## A anatomia da janela

Ao abrir o Dolphin, a interface segue o padrão do KDE Plasma. No topo, a **barra de ferramentas** com os botões de voltar, avançar, subir um nível e alternar visão. Abaixo, o **breadcrumb** — a trilha de localização que mostra o caminho atual em segmentos clicáveis, por exemplo `home ▸ deck ▸ lab`. No lado esquerdo, o **painel Locais** lista as pastas mais frequentes (Home, Documentos, Downloads, Lixeira e as mídias montadas). A faixa de **status** no rodapé informa quantos itens há no diretório e o espaço livre em disco.

A barra de endereço aceita escrita manual de caminhos — clique na trilha e ela vira um campo de texto editável, onde você digita `/etc`, `~/lab` ou até mesmo uma URL remota.

## Resumo

- O Dolphin é o gerenciador de arquivos padrão do KDE Plasma, presente no Modo Desktop do SteamOS.
- `dolphin .` abre o diretório atual; `dolphin ~/Downloads` abre um caminho específico, com `~` expandido pelo shell.
- As preferências do Dolphin vivem em `~/.config/dolphinrc`, um arquivo INI dividido em grupos.
- O acesso a arquivos é mediado pelo KIO, parte da KDE Frameworks, que unifica disco local e serviços remotos.
- `~/.local/share/kio/` guarda extensões como os *service menus* do menu de contexto.

## Exercícios

1. No Modo Desktop, abra um terminal e execute `dolphin ~/Downloads`. Confirme na barra de endereço que o caminho corresponde ao expandido de `~`.
2. Liste o conteúdo do diretório de configuração com `ls -la ~/.config | grep dolphin`. O `dolphinrc` aparece? O que o ponto no nome significa?
3. Execute `cat ~/.config/dolphinrc` e identifique pelo menos três grupos entre colchetes e uma chave em cada.
4. Compare o conteúdo de `~/.local/share/kio/` com `ls -la ~/.local/share/kio/`. Qual subdiretório está vazio na sua instalação?
5. **Desafio.** Sem abrir o Dolphin graficamente, descubra o caminho absoluto do executável com `which dolphin` e leia as primeiras linhas do manual com `man dolphin` (ou `dolphin --help`). Que opções de linha de comando existem para abrir múltiplas abas de uma vez?

Chega de teoria: a primeira ação concreta é colocar o ProtonUp-Qt na sua máquina. Em qualquer distribuição ele funciona, mas no SteamOS há um caminho especialmente natural — o app está no Flathub e aparece direto na loja Discover do modo Desktop. Esta seção cobre a instalação pelos dois caminhos e o que fazer se algo sair do lugar.

O ProtonUp-Qt é distribuído como **Flatpak**, o formato de empacotamento universal que o SteamOS já usa para aplicativos de desktop no modo Desktop. Por isso a instalação é limpa: nada de compilar, nada de repositório externo, nenhuma dependência manual. Você escolhe entre a loja gráfica ou o terminal.

:::objetivos
- Instalar o ProtonUp-Qt via Discover e via linha de comando
- Entender por que o Flatpak é o formato natural no SteamOS
- Abrir o aplicativo pela primeira vez e reconhecer sua interface
- Diagnosticar os problemas mais comuns de instalação
:::

## Por que Flatpak

Quando você sai do modo Gaming para o modo Desktop no Deck, os aplicativos que encontra na Discover são, na maioria, Flatpaks. Isso não é acidente: o SteamOS tem o sistema de arquivos base **somente leitura** por padrão, protegido contra alterações acidentais. Instalar pacotes tradicionais no sistema inteiro exigiria desativar essa proteção e seria perdido a cada atualização do sistema operacional.

O Flatpak resolve isso colocando cada app num contêiner próprio, no diretório do usuário, sem tocar na raiz somente-leitura. O ProtonUp-Qt se encaixa perfeitamente nesse modelo e, por isso, é a forma recomendada de instalá-lo no Deck. O mesmo comando funciona no desktop de qualquer distribuição com Flatpak disponível.

:::info
O identificador oficial do app no Flathub é `net.davidotek.pupgui2`. O nome "ProtonUp-Qt" é o título amigável; o ID técnico é o que você usa nos comandos.
:::

## Instalando pela Discover (modo Desktop)

O caminho mais confortável é o gráfico. No Deck, entre no **modo Desktop** (botão de energia → trocar para Desktop), abra a **Discover** (a loja), e busque por "ProtonUp-Qt". O aplicativo correto é o mantido por DavidoTek, com o ícone de um foguete ou de uma engrenagem de compatibilidade — confira o nome do desenvolvedor na página antes de instalar, para não baixar um app homônimo.

Clique em **Instalar** e aguarde. A Discover baixa o runtime do Flatpak na primeira vez, então a instalação pode demorar alguns minutos mesmo sendo um app pequeno; é o download das bibliotecas base compartilhadas, não o app em si.

Depois de instalado, o ProtonUp-Qt aparece no menu de aplicativos do modo Desktop. Você pode fixá-lo na barra de tarefas se for usar com frequência.

## Instalando pelo terminal

Quem prefere o terminal chega ao mesmo resultado com um único comando Flatpak. Abra o Konsole (o terminal do modo Desktop) e rode:

```terminal
$ flatpak install net.davidotek.pupgui2
Looking for matches…
Found similar ref(s) for 'net.davidotek.pupgui2' in remote 'flathub' (system).
Use this remote? [Y/n]: Y

        ID                            Branch       Op   Remote   Download
 1. [✓] net.davidotek.pupgui2         stable       i    flathub   < 5.0 MB

Proceed with these changes to the system installation? [Y/n]: Y
Installation complete.
```

O `flatpak` pergunta duas vezes antes de prosseguir: uma para confirmar o remoto `flathub` e outra para confirmar a instalação. Responda `Y` nas duas. O download é pequeno (menos de 5 MB do app em si); o que o comando faz, por baixo, é garantir que o runtime base já está presente e, se não estiver, baixá-lo também.

Para confirmar que deu certo, liste os apps instalados filtrando pelo nome:

```terminal
$ flatpak list | grep -i prot
ProtonUp-Qt	net.davidotek.pupgui2	1.4.1	stable	system
```

A saída mostra o título amigável, o ID técnico, a versão instalada e o canal (`stable`). Se essa linha aparecer, a instalação está íntegra.

## Abrindo pela primeira vez

No terminal, o app abre assim:

```terminal
$ flatpak run net.davidotek.pupgui2
```

Na interface, a primeira coisa que chama atenção é um seletor no rodapé ou no topo perguntando **qual instalação de Steam** você quer gerenciar. Na maioria dos casos há só uma, já pré-selecionada. O ProtonUp-Qt detecta automaticamente o Steam do seu usuário (e também instalações do Lutris ou do Heroic, se existirem), então normalmente você não precisa configurar nada.

Se nenhuma instalação de Steam aparecer, verifique se o cliente Steam está instalado e se você já o abriu pelo menos uma vez — o ProtonUp-Qt procura pelos diretórios padrão que só são criados após o primeiro login.

:::atencao
Não confunda "instalação do Steam" com "biblioteca de jogos". O ProtonUp-Qt instala as builds de Proton no diretório `compatibilitytools.d` da instalação do Steam, não nas pastas de biblioteca dos jogos. É por isso que uma única build serve para todos os jogos (e todas as bibliotecas) daquela instalação.
:::

## O que a primeira tela mostra

Depois de escolher a instalação, a janela principal divide o espaço em duas colunas: à esquerda, a lista de **versões instaladas**; à direita, o botão **Add version** (Adicionar versão), que abre a lista dos compatíveis disponíveis para download. Há também abas para atualizar, ver o changelog e gerenciar versões já instaladas.

Não há muito mais a configurar. O ProtonUp-Qt é deliberadamente minimalista: ele não altera configurações de jogo, não mexe no Proton oficial e não substitui o Steam. É apenas uma ponte limpa entre o Flathub e o diretório do Proton.

## Resumo

- O ProtonUp-Qt é um Flatpak (ID `net.davidotek.pupgui2`), o formato natural no SteamOS de sistema somente-leitura.
- Você instala pela Discover no modo Desktop ou com `flatpak install net.davidotek.pupgui2`.
- O download do app é pequeno; a demora inicial vem do runtime base do Flatpak.
- O app detecta a instalação do Steam automaticamente e instala builds em `compatibilitytools.d`.
- `flatpak list | grep -i prot` confirma a versão instalada; `flatpak run net.davidotek.pupgui2` abre o app pelo terminal.
- O ProtonUp-Qt é minimalista: não altera jogos, não substitui o Proton oficial e não precisa ficar instalado para as builds funcionarem.

## Exercícios

1. Verifique se o Flatpak já está presente na sua máquina com `flatpak --version`. Se não estiver, anote que ele vem habilitado por padrão no modo Desktop do SteamOS.
2. Instale o ProtonUp-Qt usando o comando `flatpak install net.davidotek.pupgui2` e confirme a instalação com `flatpak list | grep -i prot`.
3. Abra o app e localize o seletor de instalação do Steam. Quantas instalações ele detectou na sua máquina?
4. Compare o tamanho real do app instalado com `flatpak info net.davidotek.pupgui2` e explique por que o número (runtime incluso) é maior que os 5 MB do download.
5. **Desafio.** Sem abrir a interface gráfica, use `flatpak run net.davidotek.pupgui2 &` para abrir o app em segundo plano pelo terminal. Depois liste os processos com `ps aux | grep pupgui` e identifique o PID do processo gráfico — e encerre-o com `kill`.

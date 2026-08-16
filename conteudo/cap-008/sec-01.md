Toda distribuição de desktop tem um mecanismo de atualização, mas pouquíssimas tratam a atualização como um evento tão sério quanto o SteamOS. Num videogame portátil, um update mal-sucedido não é um aborrecimento: é o aparelho que não liga no meio de uma viagem. Por isso a Valve desenhou o SteamOS para que a atualização seja segura, reversível e invisível para o usuário comum — e esta seção abre o assunto mostrando onde ele se encaixa na máquina.

:::objetivos
- Entender por que o SteamOS trata atualização de forma diferente de um desktop Linux comum
- Conhecer o comando central `steamos-update` e seus subcomandos principais
- Diferenciar atualização do sistema de atualização de pacotes (pacman)
- Identificar a versão atualmente instalada a partir do `build_id`
:::

## Por que o SteamOS não atualiza como um desktop normal

Num Ubuntu ou Fedora de mesa, atualizar significa rodar `apt upgrade` ou `dnf upgrade`: o gerenciador de pacotes baixa centenas de `.deb` ou `.rpm` e os instala um a um sobre o sistema em execução. O resultado é um sistema "vivo", que muda de estado a cada pacote, e que se ficar no meio do caminho (queda de energia, download interrompido) pode ficar num estado inconsistente.

O SteamOS adotou o modelo oposto, herdado da tradição dos sistemas **imutáveis** e **atômicos**. A raiz do sistema (`/`) é somente leitura por padrão, e a atualização **não** acontece peça por peça. A Valve publica uma *imagem completa* do sistema — um sistema operacional inteiro, testado e assinado — e essa imagem substitui o sistema de forma **atômica**: ou a troca acontece por inteiro, ou não acontece.

Isso tem uma consequência que costuma confundir quem vem do Arch Linux: o SteamOS é baseado em Arch, mas você **não** atualiza o sistema com `pacman -Syu`. A atualização do sistema operacional é feita pela Valve, via `steamos-update`, e não pelo gerenciador de pacotes (que tem o seu próprio papel, tratado em outro capítulo). São três camadas distintas:

- **Atualização do sistema** → `steamos-update`: troca a imagem imutável inteira.
- **Atualização de pacotes do usuário** → `pacman` / Flatpak: camadas que ficam fora da imagem imutável.
- **Atualização de jogos e aplicativos** → Steam / Flatpak.

## O comando central: steamos-update

A ferramenta que governa as atualizações do SteamOS é o `steamos-update`. Ele é um *wrapper* (um empacotador de tarefas) que, por baixo, orquestra o download da imagem, a verificação da assinatura criptográfica, a escrita na partição inativa e a troca de boot. O subcomando mais usado é o `check`, que verifica se há atualização disponível:

```terminal
$ steamos-update check
Checking for available updates...
The system is up to date.
```

Quando há algo novo, a resposta muda e informa qual é a versão disponível e o canal de origem:

```terminal
$ steamos-update check
Checking for available updates...
An update is available: 3.6.21 (build_id 20241105.100)
```

Repare que a saída traz dois identificadores: o número de versão (`3.6.21`) e o `build_id`. O `build_id` é o identificador exato e inequívoco da imagem — mais confiável que o número de versão, porque identifica o *build* específico produzido pela Valve, com data de compilação. Duas máquinas com o mesmo `build_id` estão rodando exatamente os mesmos binários.

Outro subcomando central é o `checkout`, que reaplica a versão atual. Na prática ele é usado para "limpar" o sistema, restaurando a imagem original do canal em uso:

```terminal
$ steamos-update checkout
Checking for available updates...
Current version is 3.6.21, no action needed.
```

:::dica
`steamos-update checkout` é o atalho clássico do Steam Deck para corrigir um sistema com arquivos da raiz estragados (alguém mexeu em `/usr` sem querer, por exemplo). Ele baixa de novo a imagem do canal atual e a reaplica, sobrescrevendo qualquer alteração indevida na partição de sistema.
:::

## Lendo o build_id do seu sistema

Você não precisa depender só da saída do `steamos-update` para saber qual imagem está rodando. O SteamOS escreve essa informação no arquivo `/etc/os-release`, que toda distribuição Linux mantém:

```terminal
$ cat /etc/os-release
NAME="SteamOS"
PRETTY_NAME="SteamOS 3.6"
BUILD_ID=20241105.100
VARIANT_ID=steamdeck
HOME_URL="https://steamdeck.com"
```

O campo `BUILD_ID` é o mesmo número que o `steamos-update` reporta. O `VARIANT_ID=steamdeck` indica que esta é a variante para o hardware Steam Deck (existe também a variante para desktop, usada em outras máquinas). O `NAME="SteamOS"` e o `PRETTY_NAME="SteamOS 3.6"` confirmam a linha de versão mainline do curso.

Não confunda `BUILD_ID` com a linha de versão. O `PRETTY_NAME` "SteamOS 3.6" aponta para a geração (nobre, no jargão), enquanto o `BUILD_ID` aponta para o build exato. Com o passar dos meses, a 3.6 recebe vários builds (3.6.0, 3.6.21, 3.6.32...), todos "SteamOS 3.6", mas com `BUILD_ID` distintos.

## O que acontece durante uma atualização

Para entender o que a próxima seção vai detalhar, vale fixar a sequência de alto nível. Quando você pede uma atualização, o SteamOS:

1. Baixa a imagem assinada do canal selecionado.
2. Verifica a assinatura criptográfica (impede que uma imagem falsa seja instalada).
3. Escreve a imagem na **partição de sistema inativa**.
4. Marca essa partição como a próxima a iniciar.
5. Reinicia; o bootloader troca para a partição recém-gravada.

O detalhe essencial está no passo 3: a atualização nunca é escrita **por cima** do sistema que está em uso. Ela vai para a partição "irmã", que fica parada. Se tudo der certo, o próximo boot usa a partição nova; se der errado, a partição antiga (ainda intacta) vira a rede de segurança.

```terminal
$ steamos-readonly status
Read-only filesystem is enabled.
```

Esse comando confirma o que já foi dito: a raiz é somente leitura. O `steamos-readonly` controla essa trava, e o estado padrão é `enabled` — a raiz protegida. É essa proteção que garante que a imagem não seja corrompida por alterações manuais entre uma atualização e outra.

## Resumo

- O SteamOS usa atualização **atômica** por imagem completa, não atualização por pacote.
- A atualização do sistema é feita com `steamos-update`, **não** com `pacman -Syu`.
- `steamos-update check` verifica se há atualização; `checkout` reaplica a versão atual.
- `BUILD_ID` em `/etc/os-release` identifica o build exato da imagem instalada.
- A raiz é somente leitura (`steamos-readonly status` mostra `enabled`), protegendo a imagem.

## Exercícios

1. Rode `steamos-update check` e anote a resposta. Há atualização disponível ou o sistema está em dia?
2. Leia `cat /etc/os-release` e copie os valores de `PRETTY_NAME`, `BUILD_ID` e `VARIANT_ID`. Escreva, em uma frase, o que cada um significa.
3. Execute `steamos-readonly status` e confirme que a raiz está protegida contra escrita.
4. Compare o `BUILD_ID` da sua máquina com a saída de `steamos-update check`. Os dois identificadores batem?
5. **Desafio.** Sem rodar `pacman -Syu`, pesquise (com `steamos-update check`) qual canal de atualização sua máquina está usando. A partir do número 3.6.x do seu sistema, proponha um comando que mostre se há uma versão mais recente da geração 3.6 disponível — e explique por que isso não é a mesma coisa que atualizar pacotes isolados.

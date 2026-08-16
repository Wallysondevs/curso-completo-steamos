O Steam Deck tem uma relação ambígua com seus próprios dados. De um lado, a Valve resolve a maior parte do problema com o Steam Cloud: saves de jogos comprados na Steam sobem e descem sozinhos. De outro, tudo o que está fora do ecossistema — saves de emuladores, jogos de GOG, lutris, pastas de ROMs, arquivos de configuração que você mesmo editou — fica solto no disco, sem cópia e sem segundo lugar para morar. Este capítulo trata exatamente desse segundo espaço: como montar uma estratégia de sincronização e backup que cubra o que a Steam não cobre.

:::objetivos
- Distinguir o que o Steam Cloud já faz daquilo que fica sem proteção
- Entender os três modelos de sincronização (ponto a ponto, servidor próprio e nuvem comercial)
- Identificar onde vivem saves, ROMs e configurações no SteamOS
- Escolher a ferramenta certa para cada caso de uso
- Reconhecer os riscos de sincronizar pastas erradas
:::

## O que a Steam já faz por você

Antes de instalar qualquer coisa, vale saber o que já funciona de fábrica. O Steam Cloud guarda saves e algumas configurações dos jogos da Steam numa conta da Valve. Quando você instala um jogo em outro dispositivo, ele baixa o save mais recente antes da primeira execução e faz upload ao fechar o jogo.

```terminal
$ ls ~/.local/share/Steam/userdata/
123456789/
$ ls ~/.local/share/Steam/userdata/123456789/
0/  1/  7/  376030/  570/  730/  config/
```

Cada pasta numerada sob `userdata` representa um título (o número é o AppID do jogo na Steam), e dentro delas ficam os saves locais. A pasta `config/` guarda os arquivos `localconfig.vdf` e `sharedconfig.vdf`, que registram as configurações por usuário.

O limite é que o Steam Cloud só cobre jogos da Steam **que o desenvolvedor habilitou**. Jogos antigos, alguns títulos de GOG ou itch.io, e principalmente emuladores e seus saves ficam totalmente fora dessa rede de proteção.

:::atencao
O Steam Cloud não é backup. Ele é sincronização de conveniência: se um jogo corromper o save local, a versão corrompida pode ser enviada para a nuvem e sobrescrever a boa. Confiar nele como única cópia é um erro comum de quem perde dezenas de horas de progresso.
:::

## Os três modelos de sincronização

Existem três formas fundamentais de manter dados em dois lugares, e elas resolvem problemas diferentes.

**Ponto a ponto (P2P).** Duas ou mais máquinas conversam diretamente entre si, sem servidor central. É o modelo do *Syncthing*: seus arquivos nunca passam pelo computador de outra pessoa. Ideal para quem quer privacidade total e não precisa acessar dados por navegador.

**Servidor próprio.** Você roda um serviço (como *Nextcloud*) num servidor que controla, e os clientes se conectam a ele. Garante um ponto central sempre disponível, com acesso via navegador e aplicativo de celular, mas exige manter uma máquina ligada.

**Nuvem comercial.** Dropbox, Google Drive, OneDrive e afins. Você terceiriza a infraestrutura em troca de conveniência e zero manutenção, mas aceita os termos de serviço e o armazenamento de terceiros.

| Modelo | Ferramenta | Ponto forte | Ponto fraco |
|---|---|---|---|
| P2P | Syncthing | Privacidade, sem servidor | Precisa de 2+ máquinas ligadas |
| Servidor próprio | Nextcloud | Central, com web e apps | Você mantém o servidor |
| Nuvem comercial | Dropbox, Drive | Zero manutenção | Dados com terceiros |

## Onde estão os dados que importam

Para sincronizar com eficiência, você precisa saber exatamente o que copiar. Os dados do Steam Deck se distribuem em poucos lugares físicos.

```terminal
$ ls ~/.var/app/ | head -10
com.usebottles.bottles/
com.valvesoftware.Steam/
net.retrodeck.retrodeck/
org.libretro.RetroArch/
```

Aplicativos instalados via Flatpak guardam seus dados de usuário em `~/.var/app/<nome.do.app>`. É ali que ficam saves de emuladores instalados pelo EmuDeck ou RetroDeck, configurações de aplicativos e caches.

Os caminhos que mais importam no contexto deste capítulo:

- `~/.local/share/Steam/userdata/` — saves e configurações dos jogos da Steam.
- `~/.var/app/` — dados dos Flatpaks (emuladores, ferramentas).
- `~/Emulation/` ou `~/retrodeck/` — ROMs, BIOS e saves organizados por EmuDeck/RetroDeck.
- `~/Documents` e `~/Pictures` — arquivos pessoais criados no modo desktop.

:::dica
No modo desktop, o `$HOME` do usuário `deck` é `/home/deck`. Todos os caminhos deste capítulo assumem esse usuário. Se você editou o sistema fora do modo desktop, pode estar operando como outro usuário e os caminhos mudam.
:::

## Por que não sincronizar tudo às cegas

A tentação é sincronizar o `$HOME` inteiro e encerrar o assunto. Isso cria mais problema do que resolve. Pastas de cache, miniaturas, o diretório `.cache` e bancos de dados que mudam centenas de vezes por segundo geram tráfego infinito e conflitos sem valor.

```terminal
$ du -sh ~/.cache ~/.config ~/.local/share 2>/dev/null
2,1G    /home/deck/.cache
412M    /home/deck/.config
18G     /home/deck/.local/share
```

Sincronizar `.cache` seria copiar 2 GB de dados descartáveis. Sincronizar `.local/share` inteiro arrastaria 18 GB, boa parte composta por jogos instalados que podem ser baixados de novo. A regra é simples: **sincronize dados insubstituíveis, não dados regeneráveis**.

:::perigo
Nunca sincronize arquivos de lock ou bancos de dados SQLite que um programa mantém abertos enquanto roda — como o `localconfig.vdf` com a Steam aberta. A cópia de um arquivo em uso pode capturar um estado inconsistente e, quando restaurada, corromper a aplicação. Feche o jogo/aplicativo antes de sincronizar seus dados.
:::

## Resumo

- O Steam Cloud cobre só saves de jogos da Steam habilitados; tudo o mais fica desprotegido.
- Existem três modelos: P2P (Syncthing), servidor próprio (Nextcloud) e nuvem comercial (Dropbox).
- Saves de Flatpaks vivem em `~/.var/app/`; saves da Steam em `~/.local/share/Steam/userdata/`.
- Sincronize dados insubstituíveis, nunca cache, miniaturas ou arquivos regeneráveis.
- Steam Cloud é conveniência, não backup: ele pode sobrescrever um save bom com um corrompido.

## Exercícios

1. Liste os jogos que têm saída de Steam Cloud usando `ls ~/.local/share/Steam/userdata/` e compare com os jogos instalados. Identifique três títulos instalados cujo save não é coberto pela nuvem.
2. Meça quanto espaço ocupam `~/.cache`, `~/.config` e `~/.local/share` com `du -sh`. Para cada um, diga se seria razoável sincronizar e por quê.
3. Abra o Flatpak da Steam e localize a pasta de dados em `~/.var/app/com.valvesoftware.Steam/`. Explique por que ela difere de `~/.local/share/Steam/`.
4. Enumere, no seu caso, três pastas de dados insubstituíveis (saves que não são da Steam) que você não pode perder.
5. **Desafio.** Sem instalar nada, liste todos os diretórios sob `~/.var/app/` que armazenam saves de emuladores e estime o tamanho total deles. Depois proponha uma regra de filtragem (por nome ou extensão) que capture só saves e estados, não ROMs nem caches.

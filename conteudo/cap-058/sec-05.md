Warpinator e `scp` resolvem o arquivo avulso; Syncthing resolve um problema diferente: manter *pastas inteiras* espelhadas entre dois ou mais dispositivos, continuamente, sem cabos e sem você pensar nisso. É a ferramenta ideal para sincronizar saves, ROMs em andamento, documentação ou qualquer pasta que precise existir igual no Deck e em outro lugar.

:::objetivos
- Instalar o Syncthing no SteamOS e em outro dispositivo
- Entender o modelo de "pastas compartilhadas" e IDs de dispositivo
- Configurar sincronização bidirecional (ou só-envio/só-recebimento)
- Ler avisos de conflito e resolvê-los
- Rodar o Syncthing como serviço que inicia com o sistema
:::

## Como o Syncthing pensa

O Syncthing é peer-to-peer e descentralizado: não há nuvem no meio, os dados vão direto de dispositivo para dispositivo, criptografados. Cada dispositivo tem um **ID único** (uma string longa). Você *adiciona* o outro dispositivo pelo ID e, então, *compartilha* pastas específicas entre eles. Nada é exposto além do que você escolher.

```terminal
# no Deck, o Syncthing expõe uma interface web local (porta 8384)
http://localhost:8384
```

## Instalação no SteamOS

No modo Desktop, instale pelo Discover ou terminal:

```terminal
$ flatpak install flathub com.github.zocker_160.SyncThingy
```

Há dois componentes: o **serviço** (o motor que roda em segundo plano) e a **interface** (a página web ou um app gráfico). No celular, o app oficial **Syncthing** (F-Droid/Play Store) faz os dois. No Linux/Windows/macOS, o site oficial traz instaladores.

## Primeira sincronização

1. Abra a interface web (`localhost:8384`) no Deck.
2. No outro dispositivo, copie o **ID** dele (na tela "Adicionar dispositivo").
3. No Deck, "Adicionar dispositivo" → cole o ID → confirme o pedido no outro lado.
4. Crie uma pasta compartilhada no Deck (ex.: `~/Emulation/saves`) e marque o outro dispositivo como destinatário.
5. Aceite a pasta do outro lado e escolha onde ela será espelhada localmente.

```terminal
# a pasta adicionada aparece na interface e na árvore de arquivos
Folder "saves" → synced, sharing with [outro-dispositivo]
```

## Modos de compartilhamento

Cada compartilhamento tem um *tipo de pasta* que define o fluxo:

- **Enviar e receber** (padrão): sincronização bidirecional.
- **Somente enviar**: este lado manda, nunca recebe (bom para backup unidirecional).
- **Somente receber**: este lado recebe, nunca manda.
- **Ignorar exclusões**: o receptor mantém arquivos mesmo se a origem apagar.

Escolha conforme o caso: saves que vão e voltam pedem bidirecional; backup pede "somente enviar" da origem.

## Conflitos e monitoramento

Se o mesmo arquivo muda nos dois lados antes de sincronizar, o Syncthing não sobrescreve silenciosamente: ele gera um arquivo **`.sync-conflict-...`** ao lado do original para você decidir. Isso é um aviso, não um erro. A interface mostra histórico, velocidade e estado de cada pasta e dispositivo em tempo real.

```terminal
save.srm
save.sync-conflict-20240815-120000-ABC123.srm
```

## Rodando no boot

Para o Syncthing iniciar junto com o sistema (sem você abrir o app toda vez), use o systemd com a unit do usuário ou o serviço `syncthing@deck`:

```terminal
$ systemctl --user enable --now syncthing
```

Isso garante que a sincronização aconteça mesmo se você estiver só no modo de jogo.

## Pontos-chave

- Syncthing = espelhamento contínuo de pastas, peer-to-peer, sem nuvem.
- Dispositivos se adicionam por **ID único**; pastas se compartilham por item.
- Tipos de pasta controlam o fluxo (bidirecional, só-envio, só-recebimento).
- Conflitos geram arquivos `.sync-conflict-*`, nunca perda silenciosa.
- Ative via systemd para sincronizar desde o boot.

## Exercícios

1. Instale o Syncthing no Deck e em um segundo dispositivo e troque os IDs.
2. Crie uma pasta `~/teste-sync` com um arquivo e compartilhe-a bidirecionalmente.
3. Edite o arquivo do outro lado e observe a mudança aparecer no Deck.
4. Configure uma pasta "somente enviar" para backup de `~/Emulation/saves`.
5. **Desafio.** Provoque um conflito editando o mesmo arquivo nos dois lados antes de sincronizar e resolva o `.sync-conflict-*`.

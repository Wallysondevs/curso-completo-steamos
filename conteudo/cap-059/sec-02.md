O Syncthing resolve um problema específico e resolve muito bem: sincronizar pastas entre suas próprias máquinas sem depender de servidor de terceiros. Os arquivos trafegam criptografados diretamente entre os dispositivos, e nenhum dado para num computador que você não controla. No Steam Deck, ele é a escolha natural para espelhar saves de emuladores e documentos entre o Deck e um computador ou NAS da sua casa.

:::objetivos
- Instalar o Syncthing no SteamOS via Flatpak
- Ativar a interface web e a interface gráfica dedicada
- Parear o Deck com outro dispositivo de forma segura
- Criar a primeira pasta compartilhada entre os dois
- Interpretar o painel de status de sincronização
:::

## Por que Syncthing e não outra coisa

O Syncthing é *open source*, multiplataforma e não exige conta nem servidor. Cada dispositivo recebe um identificador único (uma sequência longa de letras e dígitos) e um certificado criptográfico. Para sincronizar duas máquinas, você troca esses identificadores e aprova o pareamento dos dois lados — depois disso, as pastas escolhidas passam a convergir automaticamente.

A vantagem no Steam Deck é dupla: você não precisa de uma nuvem comercial para arquivos pessoais, e o Syncthing roda em segundo plano usando pouquíssima memória, sem se intrometer no desempenho dos jogos.

A desvantagem honesta: a sincronização só acontece quando **as duas máquinas estão ligadas** ao mesmo tempo (ou por uma janela de tempo em que ambas estiveram online). Não há um "servidor sempre disponível" para arquivar quando o Deck está desligado — para isso, o capítulo sobre Nextcloud ou rclone complementa.

## Instalando via Flatpak

No SteamOS, o caminho mais limpo é o Flatpak oficial, que vem empacotado e mantido pela comunidade. Instale pelo terminal ou pelo Discover.

```terminal
$ flatpak install flathub com.github.zocker_160.SyncThingy
Looking for matches…
Required runtime for com.github.zocker_160.SyncThingy/x86_64/stable (runtime/org.kde.Platform/x86_64/6.6) found in remote flathub
Do you want to install it? [Y/n]: Y
Installation complete.
```

O pacote `com.github.zocker_160.SyncThingy` é a interface gráfica que também cuida de iniciar o serviço do Syncthing por baixo. Alternativamente, quem prefere controle total instala o daemon puro (`com.github.zocker_160.SyncThingy` já o traz) ou usa a interface web que o próprio serviço expõe.

:::info
Existem dois componentes no ecossistema: o **daemon** (`syncthing`), que faz o trabalho de sincronizar e expõe uma interface web na porta `8384`, e o cliente gráfico (como o SyncThingy), que toma conta de iniciar o daemon e mostra um painel nativo. Ambos falam com o mesmo serviço.
:::

## Primeira execução e a interface web

Depois de instalar, inicie o SyncThingy. Ele vai subir o daemon e abrir a interface. Você também pode falar direto com o daemon pela linha de comando se o serviço já estiver rodando.

```terminal
$ systemctl --user status syncthing.service 2>/dev/null || echo "sem unidade user"
$ syncthing --help 2>/dev/null | head -3
Usage: syncthing [options]
Options:
  -gui-address string    Override GUI listen address (default "127.0.0.1:8384")
```

A interface web, acessível em `http://127.0.0.1:8384`, é o coração do Syncthing. Nela você vê todos os dispositivos, todas as pastas e o estado de cada sincronização em tempo real.

```terminal
$ curl -s http://127.0.0.1:8384/rest/system/version | head -c 200
{"arch":"amd64","codename":"Gold Grasshopper","longVersion":"syncthing v1.27.12 \"Gold Grasshopper\" (go1.22.5 linux-amd64)","os":"linux","version":"v1.27.12"}
```

Essa chamada ao endpoint REST devolve a versão e a arquitetura do daemon. A interface web é só uma casca bonita para essa API: tudo o que você vê ali tem um equivalente em `/rest/`.

## Pareando dois dispositivos

O pareamento é o passo mais sensível, e o mais mal-entendido. Cada dispositivo tem um **ID de dispositivo** — uma string de 56 caracteres — que funciona como impressão digital. Para vincular o Deck ao seu PC ou NAS, você copia esse ID de um lado e o adiciona do outro.

```terminal
## No Deck, veja o próprio ID
$ curl -s http://127.0.0.1:8384/rest/system/status | python3 -c "import sys,json;print(json.load(sys.stdin)['myID'])"
ABCDE1234-ABCDE1234-ABCDE1234-ABCDE1234-ABCDE1234-ABCDE1234-ABCDE1234
```

Do outro lado, você abre a interface do Syncthing no PC, vai em "Adicionar dispositivo" e cola esse ID. O dispositivo remoto aparece como "pendente" até que você aceite o pareamento **dos dois lados** — é isso que impede que alguém com seu ID invada sua sincronização só por tê-lo digitado.

:::atencao
O ID do dispositivo não é secreto. A segurança do Syncthing vem do **aceite mútuo**: ambos os lados precisam confirmar. Compartilhar o ID por mensagem é normal e seguro. O que você não deve fazer é aceitar cegamente um dispositivo desconhecido que pediu pareamento — confirme sempre que o ID bate com o que você espera.
:::

## Criando a primeira pasta compartilhada

Com os dispositivos pareados, você cria uma pasta no Deck e escolhe com quem compartilhá-la. No painel, "Adicionar pasta", preencha um *Folder ID* (um nome estável, como `saves-deck`) e o caminho local.

```yaml
# ~/.config/syncthing/config.xml (resumo da pasta de saves)
<folder id="saves-deck" label="Saves do Deck" path="/home/deck/sync/saves" type="sendreceive">
  <device id="FEDCBA4321-..." introducedBy=""></device>
  <fsWatcherEnabled>true</fsWatcherEnabled>
  <ignorePerms>true</ignorePerms>
</folder>
```

O tipo `sendreceive` (padrão) significa que a pasta envia **e** recebe alterações: o conteúdo converge nos dois lugares. O `fsWatcherEnabled` faz o Syncthing reagir instantaneamente a mudanças no sistema de arquivos em vez de varrer periodicamente.

Ao criar a pasta no Deck, o outro dispositivo recebe um convite para aceitá-la e precisa escolher **onde** colocá-la localmente. A partir daí, qualquer arquivo em `/home/deck/sync/saves` espelha no caminho equivalente do outro lado.

```terminal
$ mkdir -p ~/sync/saves
$ echo "save da zelda" > ~/sync/saves/nota.txt
## Após alguns segundos, o painel mostra: "Sincronizado"
$ curl -s http://127.0.0.1:8384/rest/db/status?folder=saves-deck | head -c 200
{"errors":0,"globalBytes":17,"globalFiles":1,"inSyncBytes":17,"inSyncFiles":1,"localBytes":17,"localFiles":1,"needBytes":0,"needFiles":0,"state":"idle","stateChanged":"..."}
```

O status `idle` com `needFiles: 0` significa que não há nada pendente: os dois lados estão idênticos. É o número que você aprende a ler de relance para saber se o sistema está saudável.

## Resumo

- Syncthing sincroniza suas máquinas ponto a ponto, sem servidor nem conta de terceiros.
- Instale o Flatpak `com.github.zocker_160.SyncThingy` (ou use o daemon puro) no SteamOS.
- A interface web vive em `http://127.0.0.1:8384` e é a casca da API REST em `/rest/`.
- Parear exige trocar o ID de dispositivo de 56 caracteres e aceitar dos dois lados.
- Uma pasta `sendreceive` converge nos dois sentidos; `needFiles: 0` e estado `idle` indicam sincronização completa.
- A sincronização só ocorre com ambos os dispositivos ligados; não há servidor sempre ativo.

## Exercícios

1. Instale o SyncThingy via Flatpak e anote a versão exibida em `http://127.0.0.1:8384/rest/system/version`.
2. Descubra o seu ID de dispositivo com o endpoint `/rest/system/status` e o campo `myID`.
3. Crie uma pasta de teste chamada `teste-deck` apontando para `~/sync/teste` e adicione um arquivo qualquer. Observe o estado mudar para `idle`.
4. Pareie o Deck com um segundo dispositivo (PC ou outro) e compartilhe a pasta `teste-deck`. Confirme que o arquivo aparece dos dois lados.
5. **Desafio.** Usando `curl` na API REST, liste as pastas configuradas (`/rest/config/folders`) e escreva um comando que mostre, para cada pasta, quantos arquivos estão fora de sincronia (`needFiles`). Compare com o que o painel gráfico exibe.

O Syncthing brilha entre máquinas que ficam ligadas ao mesmo tempo. Mas há um cenário que ele não cobre: você quer acessar um arquivo do Deck pelo navegador do trabalho ou quer que seus dados estejam disponíveis num servidor que fica ligado 24 horas por dia. É aí que o Nextcloud entra — um servidor de arquivos completo, com cliente desktop, aplicativo de celular e toda a infraestrutura de sincronização que você espera de um Dropbox, mas rodando na sua própria máquina.

:::objetivos
- Entender o que Nextcloud oferece que o Syncthing não resolve
- Instalar o cliente de sincronização do Nextcloud no SteamOS
- Conectar o cliente a um servidor Nextcloud existente
- Configurar pastas de sincronização seletiva no Deck
- Diagnosticar falhas de conexão (SSL, autenticação, firewall)
:::

## A diferença entre servidor e cliente

Nextcloud é uma plataforma de duas partes: o **servidor**, que hospeda os arquivos, e o **cliente**, que roda no dispositivo e sincroniza com o servidor. O servidor não é tópico deste capítulo — você pode instalá-lo num VPS, num NAS (Synology, QNAP, TrueNAS) ou num Raspberry Pi caseiro. Nesta seção, partimos do pressuposto de que o servidor já existe e queremos conectar o Steam Deck a ele.

O que o Nextcloud entrega além de arquivos: calendário, contatos, compartilhamento por link público, edição colaborativa de documentos. Mas no Steam Deck, o foco é um só: sincronização de saves e arquivos pessoais.

## Instalando o cliente no SteamOS

O cliente oficial do Nextcloud está no Flathub, pronto para instalar no modo desktop.

```terminal
$ flatpak install flathub com.nextcloud.desktopclient.nextcloud
Looking for matches…
Required runtime for com.nextcloud.desktopclient.nextcloud/x86_64/stable (runtime/org.kde.Platform/x86_64/6.6) found in remote flathub
Do you want to install it? [Y/n]: Y
Installation complete.
```

Depois de instalado, ele aparece no menu de aplicativos como "Nextcloud Desktop". Na primeira execução, pede o endereço do servidor — este é o momento em que muitos tropeçam, porque o formato do endereço importa.

```terminal
## Exemplos de endereços válidos de servidor:
## https://meu-nas.local/nextcloud
## https://nuvem.exemplo.com
## https://192.168.1.50:8443
```

A URL precisa ser exatamente a que você usa no navegador para acessar a interface web do Nextcloud. Se for `http://` (sem SSL), o cliente vai alertar mas permite continuar; o recomendado é ter certificado Let's Encrypt configurado no servidor e usar sempre `https://`.

:::atencao
Se você roda o servidor Nextcloud em casa com IP dinâmico, o cliente vai quebrar sempre que o IP mudar. Use um domínio com DNS dinâmico (ddns) ou um túnel VPN como Tailscale/WireGuard para garantir um endereço estável.
:::

## Autenticando e configurando pastas

Depois de conectar com login e senha (ou token de aplicativo, se o servidor exigir), o cliente pergunta o que sincronizar. A estratégia recomendada para o Steam Deck é **sincronização seletiva**: só escolha as pastas que fazem sentido na máquina portátil, não a raiz inteira do Nextcloud.

```terminal
$ flatpak run com.nextcloud.desktopclient.nextcloud &
[INFO] Qt bearer thread running
Nextcloud version: 3.14.2 (build 20250321)
Connected to https://nuvem.exemplo.com/ as ana
```

No painel de configuração, você vê a lista de pastas remotas e marca as que quer espelhar localmente. Uma configuração típica para o Steam Deck:

- **`/Saves`** — pasta remota com saves de emuladores, espelhada localmente em `~/Nextcloud/Saves`
- **`/Documentos`** — arquivos de trabalho, se o Deck também serve como máquina de desktop
- **`/ROMs`** — opcional, só se você tem espaço e quer acesso centralizado

```terminal
$ ls ~/Nextcloud/
Saves/  Documentos/
$ ls ~/Nextcloud/Saves/
RetroArch/  Dolphin/  DuckStation/  PCSX2/
```

Tudo o que aparecer dentro dessas pastas espelha entre o servidor e o Deck.

## Diagnóstico de problemas comuns

O cliente Nextcloud tem um painel de *Activity* que mostra os arquivos transferidos, mas para diagnósticos sérios você precisa dos logs.

```terminal
$ flatpak run com.nextcloud.desktopclient.nextcloud --logwindow &
```

A opção `--logwindow` abre uma janela separada com o fluxo de logs em tempo real. É o primeiro lugar para olhar quando um arquivo não sobe.

Os erros mais comuns no Steam Deck:

| Sintoma | Causa provável | Solução |
|---|---|---|
| "Connection refused" | Servidor fora do ar ou IP mudou | Verificar servidor; testar com `curl https://servidor` |
| "SSL handshake failed" | Certificado expirado ou autoassinado | Renovar certificado ou adicionar CA ao Flatpak |
| "File locked" | Arquivo em uso por jogo/emulador | Fechar o jogo antes de sincronizar |
| "Quota exceeded" | Espaço acabou no servidor | Liberar espaço no servidor ou reduzir pastas |

Muitos erros de SSL no Flatpak vêm do fato de o runtime não herdar os certificados do sistema. A solução é garantir que a CA raiz esteja acessível ao ambiente do Flatpak.

```terminal
$ flatpak run --env=SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt com.nextcloud.desktopclient.nextcloud &
```

## Sincronização em segundo plano no modo desktop

O cliente Nextcloud fica residente na bandeja do sistema enquanto o modo desktop estiver aberto. Ele monitora as pastas selecionadas, sobe arquivos alterados e baixa arquivos novos — comportamento idêntico ao Dropbox. No modo jogo, entretanto, ele não é iniciado automaticamente.

Para quem quer sincronização mesmo em modo jogo, a abordagem é rodar o cliente como um serviço systemd user, algo que a seção 8 deste capítulo ensina a generalizar. Antes de chegar lá, convém entender que o Nextcloud consome mais recursos do que o Syncthing (ele mantém duas conexões HTTPS, faz pooling periódico e lida com metadados de versão), então ativá-lo durante o jogo pode ser custoso.

:::dica
Se você só precisa de sincronização eventual (digamos, ao terminar uma sessão de emulador), é mais simples conectar o Deck no modo desktop, deixar o Nextcloud sincronizar e desligar. O Syncthing é mais adequado para ficar ativo o tempo todo.
:::

## Resumo

- Nextcloud é um servidor completo de arquivos com cliente desktop; o servidor roda em outra máquina e o Deck se conecta como cliente.
- Instale `com.nextcloud.desktopclient.nextcloud` via Flatpak; conecte com `https://` e sincronização seletiva.
- Só sincronize pastas essenciais (saves, documentos); evite a raiz inteira do servidor.
- Diagnostique falhas com `--logwindow`, testando `curl` e verificando SSL, IP e quota.
- O cliente fica residente no modo desktop; no modo jogo, prefira Syncthing ou agende sincronização com systemd.

## Exercícios

1. Instale o cliente Nextcloud via Flatpak e conecte-o a um servidor real (pode ser um trial público como o da Nextcloud GmbH).
2. Crie uma pasta remota chamada `SteamDeck-Test` e marque-a para sincronização seletiva. Adicione um arquivo e confirme que ele aparece localmente.
3. Force um erro de conexão desligando o servidor e observe o comportamento de retry do cliente nos logs.
4. Compare o uso de memória residente do cliente Nextcloud com o do Syncthing (`ps aux | grep -E 'nextcloud|syncthing'`). Qual dos dois é mais leve?
5. **Desafio.** Configure o Nextcloud client para rodar como serviço `systemd --user`, seguindo a estrutura que a seção 8 descreverá (ou usando a documentação do Nextcloud sobre `--background`). Teste se ele sincroniza mesmo fora do modo desktop.
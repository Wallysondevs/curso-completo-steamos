Steam Cloud cobre só a biblioteca Steam. Para saves não-Steam, emuladores, arquivos de configuração e até mesmo saves Steam que você quer sincronizar entre decks **sem passar pelo servidor da Valve**, existe o Syncthing. Ele é peer-to-peer, não depende de nuvem de terceiros, e com a unit systemd certa funciona até em segundo plano no Gaming Mode. Esta seção mostra como instalar, emparelhar e configurar o Syncthing no SteamOS para sincronizar saves entre decks, desktops e até um NAS.

:::objetivos
- Instalar o Syncthing como Flatpak e como unit systemd de usuário
- Emparelhar dois dispositivos e compartilhar a primeira pasta de saves
- Configurar versionamento para evitar sobrescrita acidental
- Ajustar intervalo de scan e ignorar arquivos temporários
- Diagnosticar conflitos de sincronização com o log do Syncthing
:::

## Instalação e primeira sincronização

O Syncthing está no Flathub. A instalação é limpa e não mexe no sistema read-only:

```terminal
$ flatpak install flathub me.kozec.syncthingtk
$ flatpak run me.kozec.syncthingtk
```

Na primeira execução, o Syncthing abre uma interface GTK e também uma interface web em `http://localhost:8384`. A versão Flatpak já inclui o daemon (`syncthing`) e a GUI (`syncthingtray`). Mas para rodar em segundo plano no Gaming Mode, você precisa da unit systemd. O Flatpak não instala unit automaticamente — você cria uma manualmente como usuário:

```terminal
$ mkdir -p ~/.config/systemd/user/
$ cat > ~/.config/systemd/user/syncthing.service << 'EOF'
[Unit]
Description=Syncthing - Open Source Continuous File Synchronization
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/bin/flatpak run --command=syncthing me.kozec.syncthingtk serve --no-browser --no-restart --logflags=0
Restart=on-failure
RestartSec=5
SuccessExitStatus=3 4
RestartForceExitStatus=3 4

[Install]
WantedBy=default.target
EOF
$ systemctl --user daemon-reload
$ systemctl --user enable --now syncthing
Created symlink ~/.config/systemd/user/default.target.wants/syncthing.service → ~/.config/systemd/user/syncthing.service
$ systemctl --user status syncthing
● syncthing.service - Syncthing
   Loaded: loaded (~/.config/systemd/user/syncthing.service; enabled)
   Active: active (running) since Sat 2025-04-20 10:15:22 -03
```

:::dica
O `--no-browser` impede que o Syncthing abra o navegador automaticamente. O `--no-restart` evita que ele reinicie sozinho em caso de crash — quem cuida do restart é o systemd via `Restart=on-failure`. O `SuccessExitStatus=3 4` é necessário porque o Syncthing usa esses códigos para saídas normais (como sinal SIGTERM), e sem isso o systemd marcaria como falha.
:::

## Emparelhando dois dispositivos

Cada instância do Syncthing tem um Device ID — um hash SHA-256 em base32, com 56 caracteres. Você precisa trocar os IDs entre os dispositivos:

```terminal
# No Deck OLED:
$ flatpak run --command=syncthing me.kozec.syncthingtk --device-id
BZR7K3Q-ABCDEFG-HIJKLMN-OPQRSTU-VWXYZ12-3456789-ABCDEFG

# No Deck LCD (ou desktop):
$ flatpak run --command=syncthing me.kozec.syncthingtk --device-id
C8S9L4R-MNBVCXZ-LKJHGFD-SAPOIUY-TREWQ98-7654321-MNBVCXZ
```

Na interface web (`localhost:8384`), vá em "Add Remote Device", cole o ID do outro dispositivo e marque-o como "Introducer" se quiser que ele apresente outros dispositivos automaticamente. O outro lado receberá uma notificação para aceitar a conexão.

Uma vez emparelhados, criar uma pasta compartilhada:

1. Em "Folders" → "Add Folder", escolha um Label (ex.: `Saves-Proton`).
2. Defina o caminho: `~/all-saves/proton/` (criado na [seção anterior](#/cap-072/sec-05)).
3. Na aba "Sharing", marque o dispositivo remoto.
4. O dispositivo remoto recebe uma notificação — aceite e defina o caminho local onde os arquivos aparecerão (ex.: o mesmo `~/all-saves/proton/`).

```terminal
$ ls ~/all-saves/proton/
1245620/  2254740/  413150/
# Em 30 segundos, esses arquivos aparecem no outro dispositivo
```

## Versionamento: a rede de segurança do Syncthing

O Syncthing tem uma funcionalidade que o Steam Cloud não tem: versionamento de arquivos. Quando um arquivo é modificado ou apagado no dispositivo A, o dispositivo B pode manter a versão antiga em uma pasta `.stversions` em vez de sobrescrever. Isso significa que você pode recuperar um save de três sincronizações atrás.

Configure na aba "Folder" → "File Versioning":

- **Trash Can:** move os arquivos substituídos para `.stversions` e os mantém por N dias.
- **Simple File Versioning:** mantém até N versões antigas por arquivo.
- **Staggered File Versioning:** mantém versões em intervalos crescentes (1h, 1d, 7d, 30d).

Para saves de jogos, o Staggered é ideal: você quer a versão de 10 minutos atrás (se fechou o jogo sem querer), mas também a de 3 dias atrás (se um patch corrompeu o save e você só percebeu depois).

```terminal
$ ls ~/all-saves/proton/1245620/.stversions/
ER0000.sl2~20250420-101522  ER0000.sl2~20250420-091200  ER0000.sl2~20250418-224100
```

:::atencao
O versionamento consome espaço. Cada versão antiga ocupa o tamanho inteiro do arquivo — se seu save tem 150 MB (sim, alguns jogos produzem saves enormes), 5 versões são 750 MB. Ajuste o número de versões ou dias conforme o tamanho dos seus saves. Verifique com `du -sh` periodicamente:

```terminal
$ du -sh ~/all-saves/proton/*/.stversions/ 2>/dev/null
45M     /home/deck/all-saves/proton/1245620/.stversions/
```
:::

## Ajustes finos para saves de jogos

Arquivos de save mudam com frequência durante o jogo — autosaves, quicksaves, saves de checkpoint. O Syncthing, por padrão, faz scan da pasta a cada 60 segundos. Isso significa que, no pior caso, um save leva até 60 segundos para começar a sincronizar após ser fechado. Dá para reduzir esse intervalo:

Na interface web, aba "Folder" → "Advanced" → "Full Rescan Interval (s)": mude de `3600` para `300` (5 minutos). O scan incremental — que detecta mudanças via inotify — continua sendo em tempo real. O rescan completo é só uma verificação de consistência.

Outra configuração importante é o padrão de ignores (`.stignore`). Você não quer sincronizar arquivos temporários, shader caches, saves states de emulador ou o `.stversions`:

```terminal
$ cat ~/all-saves/proton/.stignore
# Ignorar cache de shaders e arquivos temporários
**/shader_cache/
**/*.tmp
**/*.log
**/.stversions/
# Ignorar save states de emuladores (gigantes, dispensáveis)
**/*.state
**/*.state.*
# Ignorar arquivos de lock
**/*.lock
```

## Diagnosticando conflitos no Syncthing

O Syncthing também tem conflitos, mas diferentemente do Steam Cloud, ele **não perde dados** — quando dois dispositivos modificam o mesmo arquivo antes de sincronizar, ele renomeia o arquivo "perdedor" com sufixo `.sync-conflict-<data>-<hora>-<dispositivo>`:

```terminal
$ ls ~/all-saves/proton/1245620/
ER0000.sl2
ER0000.sl2.sync-conflict-20250420-101522-C8S9L4R
```

Você decide qual versão fica manualmente, comparando os dois arquivos. Para saves binários (como `.sl2`, `.sav`), a comparação é por tamanho e timestamp; para saves em texto (`.json`, `.xml`, `.cfg`), um `diff` resolve:

```terminal
$ ls -la ~/all-saves/proton/1245620/ER0000*
-rw-r--r-- 1 deck deck 149876 Abr 20 10:15 ER0000.sl2
-rw-r--r-- 1 deck deck 149870 Abr 20 09:12 ER0000.sl2.sync-conflict-20250420-101522-C8S9L4R
# ER0000.sl2 é maior e mais recente — provavelmente a versão correta.
```

Os logs do Syncthing (acessíveis na interface web em "Logs" ou via `journalctl`) mostram exatamente quando e por que um conflito ocorreu:

```terminal
$ journalctl --user -u syncthing --since "10 minutes ago" | grep -i conflict
Apr 20 10:15:22 steamdeck syncthing[1834]: [BZR7K] INFO: Conflict on file "ER0000.sl2" in folder "Saves-Proton"
```

## Resumo

- Syncthing é peer-to-peer, não usa nuvem de terceiros e funciona no SteamOS via Flatpak + systemd user unit.
- O emparelhamento usa Device IDs de 56 caracteres; pastas são compartilhadas individualmente com controle de direção (send/receive/both).
- O versionamento (`Staggered File Versioning`) protege contra sobrescrita acidental mantendo versões antigas em `.stversions/`.
- `.stignore` permite excluir shader caches, save states e arquivos temporários da sincronização.
- Conflitos no Syncthing geram arquivos `.sync-conflict-*` — nenhum dado é perdido, apenas duplicado para decisão manual.

## Exercícios

1. Instale o Syncthing em dois dispositivos (dois decks, ou deck + desktop) e emparelhe-os. Sincronize a pasta `~/all-saves/` criada no exercício da seção anterior.
2. Configure versionamento Staggered (1h, 1d, 7d, 30d) e provoque uma sobrescrita: modifique um save, deixe sincronizar, depois restaure uma versão antiga da `.stversions/`.
3. Crie um `.stignore` que exclua shader caches, save states e arquivos `.tmp`. Verifique se a sincronização ficou mais rápida.
4. Provoque um conflito: edite o mesmo arquivo de save nos dois dispositivos enquanto um deles está offline. Traga-o de volta online e veja o arquivo `.sync-conflict-*` aparecer.
5. **Desafio.** Substitua o Syncthing pelo `rsync` com `ssh` em um script que roda via timer systemd a cada 5 minutos. Compare: qual abordagem gasta menos bateria? Qual lida melhor com arquivos binários grandes?
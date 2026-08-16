Fechamos o índice rápido com o que interessa na hora do aperto: **todas as tabelas das seções anteriores reunidas numa só página**, mais um fluxograma de resgate que começa no sintoma e termina no comando. Você pode imprimir esta seção, salvar no celular ou deixar num PDF aberto. Ela é autocontida — não depende de links, não depende de conexão, não depende do Deck funcionar.

Se você tem tempo para ler uma única seção deste capítulo, leia esta. É o mapa do tesouro de cabeça para baixo: em vez de tesouro → mapa, é "estou preso → onde devo olhar". E a resposta está nas páginas a seguir.

:::objetivos
- Consultar a tabela mestra (todas as áreas) sem pular entre seções
- Seguir o fluxograma de resgate: do sintoma ao diagnóstico em 3 decisões
- Ter à mão os comandos-âncora de cada área e os procedimentos de emergência
- Saber quando parar de remendar e partir para recuperação por imagem USB
- Guardar esta seção como "último recurso offline" do curso
:::

## Tabela mestra: sintoma → causa → solução (todas as áreas)

A tabela abaixo condensa as oito áreas anteriores. Leia como um dicionário: ache o sintoma mais próximo e confira o remédio.

### Boot e inicialização

| Sintoma | Causa | Solução |
|---|---|---|
| Não liga, sem LED | Bateria zerada / EC travado | Carregar 15 min; reset EC (12 s no botão) |
| Liga, ventoinha, tela preta | GPU não inicializou | Boot menu (`…+Vol−`), outro slot, `dmesg | grep amdgpu` |
| Logo → reboot → logo | Partição A/B corrompida | Boot menu, escolher slot inativo |
| Logo trava (sem reiniciar) | FS com erro | Recovery USB, `fsck -f` |
| "No bootable device" | SSD solto / BIOS desconfigurada | BIOS (`Vol+`), verificar SSD, reconectar |
| Boot lento (minutos) | fsck, microSD com erro | Remover microSD, reiniciar |

### Rede

| Sintoma | Causa | Solução |
|---|---|---|
| Wi-Fi sumiu | rfkill/firmware/driver | `rfkill list`; `sudo rfkill unblock wifi`; `dmesg | grep firmware` |
| Conecta, não navega | DHCP/DNS | `nmcli device show wlan0`; forçar DNS (`1.1.1.1`) |
| Wi-Fi cai sozinho | Power save / sinal | `sudo iw dev wlan0 set power_save off`; mudar de banda |
| Bluetooth não aparece | Serviço parado | `sudo systemctl status bluetooth` |
| Bluetooth pareia, som falha | Codec / buffer | `bluetoothctl info <mac>`; `wpctl status` sink |
| Controle BT não conecta | Slot de pareamento | `bluetoothctl remove <mac>`; refazer |

### Desempenho

| Sintoma | Causa | Solução |
|---|---|---|
| FPS caiu do nada | Throttling térmico (>90 °C) | `sensors`; limpar ventoinha, reduzir TDP |
| Stutter/microtravadas | Shader compile, frame pacing | Precompile ativo; aguardar cache; `gamemode` |
| Degrada com o tempo | Vazamento memória, swap | `free -h`; reiniciar o jogo |
| Esquenta demais | Poeira, pasta, TDP alto | Limpar grelhas; `sensors`; TDP 8-12 W |
| FPS travado (30/40/60) | Limitador ativo | Quick Access → desligar limitador; checar refresh |
| CPU 100%, GPU ociosa | CPU-bound | `top`; reduzir draw distance; aumentar TDP |
| GPU 100%, FPS baixo | GPU-bound | FSR/NIS ligado; reduzir resolução |

### Controles

| Sintoma | Causa | Solução |
|---|---|---|
| Drift | Potenciômetro gasto/sujo | Zona morta (8-12%); limpar; trocar se grave |
| Botão não responde | Membrana/mapeamento | `evtest` confirma; software = reconfigurar; hardware = trocar |
| Touchpad não resp. (Desktop) | Steam fechado | Abrir Steam; checar layout "Desktop" |
| Touchpad errático | Sensibilidade/config | Ajustar sensibilidade/háptico/zona no Steam Input |
| Giroscópio não funciona | Gyro desligado no layout | Ligar Gyro; definir botão ativador |
| Controle externo ignorado | Ordem de prioridade | Steam Input → reordenar; forçar gamepad |

### Armazenamento

| Sintoma | Causa | Solução |
|---|---|---|
| Disco cheio "misterioso" | Shader cache + compatdata | `du -sh ~/.local/share/Steam/steamapps/*`; apagar órfãos |
| microSD sumiu | Desmontou, corrompeu, leitor sujo | `lsblk`; `dmesg`; reencaixar; `fsck` |
| microSD não monta | Formato/FS com erro | `fdisk -l /dev/mmcblk0`; `fsck.exfat`/`fsck.ext4` |
| microSD muito lento | Falsificado/morrendo | `hdparm -t /dev/mmcblk0`; < 20 MB/s = trocar |
| "Read-only filesystem" | Partição em RO (proteção) | `fsck -f` pela recuperação; `mount -o remount,rw` |
| NVMe sumiu da BIOS | SSD solto/falhando | Reencaixar; `smartctl -a /dev/nvme0n1` |

### Áudio e vídeo

| Sintoma | Causa | Solução |
|---|---|---|
| Sem som (tudo) | PipeWire/sink/volume | `systemctl --user status pipewire`; `wpctl status` |
| Som no lugar errado | Rota de sink | `wpctl set-default <sink_id>` |
| Som corta/estala | Buffer/interferência | Ajustar `default.clock.rate`; testar outro cabo/dock |
| Tela externa preta | Dock sem alt-mode DP, cabo ruim | `xrandr --query`; testar outro dock/cabo |
| Resolução/refresh errado | EDID mal lido | `xrandr --output ... --mode ... --rate 60` |
| Flickering | VRR/refresh incompatível | Desligar VRR; fixar 60 Hz |
| Artefatos na tela interna | Driver amdgpu ou painel | Testar BIOS: limpa = driver, suja = hardware |
| HDR cores lavadas | Pipeline sem HDR | Desligar HDR; verificar suporte do monitor |

### Atualizações e pacotes

| Sintoma | Causa | Solução |
|---|---|---|
| Update quebrou boot | Cópia A/B ruim | Boot menu → slot anterior |
| Flatpak não abre | Runtime/permissão | `flatpak info <app>`; `flatpak repair`; `flatpak update` |
| Flatpak fecha na hora | Runtime faltando | `flatpak run <app> --command=sh`; atualizar runtime |
| pacman "database locked" | Lock de update interrompido | `sudo rm /var/lib/pacman/db.lck` |
| pacman conflito de arquivos | Overlay vs imagem | `sudo pacman -Syu --overwrite '/*'` |
| pacman read-only | Imutabilidade ativa | `sudo steamos-readonly disable` |

### Modo Desktop

| Sintoma | Causa | Solução |
|---|---|---|
| Desktop congelou | KWin/plasma travado | `Ctrl+Alt+F3`; `sudo systemctl restart sddm` |
| Plasma não carrega | Cache/config corrompida | Renomear `plasma-org.kde.plasma.desktop-appletsrc` + `~/.cache` |
| App só roda em X11 | Incompatibilidade toolkit | Trocar sessão na tela de login (Wayland ↔ X11) |
| Periférico USB não aparece | Cabo/porta/driver | `lsusb`; `dmesg | tail`; testar outro cabo |
| Impressora não encontrada | CUPS/driver/rede | `systemctl status cups`; `lpinfo -v`; `lpadmin` |
| Plasma visual estranho | Configs conflitantes | `kquitapp5 plasmashell && kstart5 plasmashell` |

## Fluxograma de resgate

Para todo problema deste capítulo, o caminho de decisão é o mesmo. Em caso de emergência (sistema não dá boot, não dá para ler este livro), siga este fluxo:

```
SINTOMA
  │
  ├── O Deck LIGA normalmente?
  │     ├── NÃO → Tabela "Boot e inicialização"
  │     │         1. Reset EC (12 s)
  │     │         2. Boot menu (… + Vol−) → slot antigo
  │     │         3. BIOS (Vol+) → verificar SSD
  │     │         4. Recovery USB + fsck
  │     │         5. Reinstalação limpa
  │     │
  │     └── SIM → O que exatamente está errado?
  │                │
  │                ├── Internet → Tabela "Rede"
  │                ├── FPS/Lentidão/Calor → Tabela "Desempenho"
  │                ├── Botão/Analógico/Touchpad → Tabela "Controles"
  │                ├── Disco/MicroSD → Tabela "Armazenamento"
  │                ├── Som/Tela/Dock → Tabela "Áudio e vídeo"
  │                ├── App/Update/Pacman → Tabela "Atualizações e pacotes"
  │                └── Desktop/Periféricos → Tabela "Modo Desktop"
  │
  └── A tabela resolveu?
        ├── SIM → Fechou. Anote o que funcionou.
        └── NÃO → 1. journalctl -b -p 3 (erros do boot atual)
                   2. dmesg -T | tail -50 (últimas 50 ocorrências)
                   3. Leve essas saídas para o capítulo aprofundado
                   4. Se nada der → Recovery USB, preserve /home
```

Guarde este fluxograma. Ele é o **plano B de qualquer plano B** — quando a mente trava, o fluxo te carrega.

## Os comandos-âncora

Cada uma das oito áreas tem um "comando-âncora": o primeiro comando que você digita porque ele sozinho aponta o caminho. Decore-os ou anote-os:

| Área | Comando-âncora | O que ele te diz |
|---|---|---|
| Boot | `lsblk -f \| grep -E 'rootfs\|steamos'` | Qual partição está montada como `/`, slots A/B |
| Rede | `nmcli device show wlan0` | IP, gateway, DNS, estado da interface |
| Desempenho | `sensors` | Temperatura (junction/edge), potência, throttling |
| Controles | `sudo evtest /dev/input/event5` | Eventos crus de cada botão/eixo |
| Armazenamento | `df -h && du -sh ~/.local/share/Steam/steamapps/*` | Onde está o consumo |
| Áudio/Vídeo | `wpctl status` | Sink ativo, volume, dispositivos |
| Updates/Flatpak | `flatpak repair` | Conserta OSTree antes de qualquer suspeita |
| Desktop | `echo $XDG_SESSION_TYPE` | Wayland ou X11 — primeira variável de qualquer bug visual |

Quando nada faz sentido, rode o comando-âncora da área suspeita. Ele é a "tomada onde você conecta o resto do diagnóstico".

## Procedimentos de emergência

Três procedimentos que resolvem quando a tabela não resolveu:

### 1. Reset completo de firmware (EC + BIOS)

```
1. Desconecte o carregador e TODOS os periféricos (dock, microSD, USB)
2. Segure o botão de energia por 15 segundos (reset do EC)
3. Solte, espere 5 s
4. Conecte o carregador original
5. Segure Volume+ e ligue (entra na BIOS)
6. Na BIOS, escolha "Load Defaults" se disponível, salve e saia
7. Deixe o Deck ligar normalmente
```

Este procedimento limpa estados erráticos tanto do EC (controlador de bateria/botão) quanto da BIOS (ordem de boot, estado de dispositivos), e deve ser tentado **antes** de abrir o aparelho suspeitando de hardware.

### 2. Boot pela recuperação com preservação de dados

```
1. Insira o USB de recuperação (preparado conforme cap. 91)
2. Segure Volume− e ligue → escolha o USB
3. No shell, NÃO reinstale — primeiro:
   a. Confira as partições: lsblk -f
   b. Verifique /home: fsck -f /dev/nvme0n1p8 (ajuste conforme seu modelo)
   c. Verifique rootfs: fsck -f /dev/nvme0n1p5
4. Se o fsck corrigiu erros, remova o USB e reinicie
5. Se não corrigiu, reinstale o SO preservando /home (opção "Reinstall")
```

A diferença entre este passo e "desistir e reinstalar do zero" é que você **usa o shell de recuperação para diagnóstico**, não para recomeçar. O `fsck` a partir do USB é a última ferramenta não-destrutiva antes da reinstalação.

### 3. Restauração de fábrica preservando dados

```
1. Boot pela recuperação USB
2. Escolha "Reinstall SteamOS" (não "Re-image")
3. Na tela de opções, marque "Keep user data" (preserva /home)
4. Confirme e aguarde
5. Após reinstalar, o sistema volta limpo; seus saves e arquivos em /home permanecem
```

Este procedimento zera a imagem do sistema (slots A/B) mas preserva seus dados pessoais. É a "bomba atômica seletiva": mata o sistema, salva os civis (saves, docs, configs).

:::atencao
**"Re-image" ≠ "Reinstall".** Re-image sobrescreve TUDO, inclusive `/home`. Só use quando o problema for nos dados ou você tiver backup completo. A maioria dos casos pede Reinstall com "Keep user data".
:::

## Quando parar

Há um ponto em que continuar diagnosticando é contraproducente. Sinais de que você deve parar e partir para a recuperação:

- **Dois ou mais subsistemas com problema ao mesmo tempo** (Wi-Fi sumiu E o áudio parou E o boot está lento). Isso sugere corrupção na imagem, não bug pontual.
- **O problema resiste à troca de slot A/B** — se nem a versão anterior do sistema funciona, o problema está nos dados ou no hardware.
- **Você já gastou mais de 45 minutos** sem chegar a um diagnóstico claro. O custo de reinstalar (com `/home` preservado) é menor que o custo de ficar debugando o desconhecido.
- **Dados já estão com backup.** Se você tem backup recente (cap. 104), reinstalar é indolor. Sem backup, a reinstalação é arriscada — priorize o backup antes.

## Kit de emergência offline

O que levar com você — fisicamente ou em arquivo — para quando o Deck estiver offline ou não der boot:

1. **Esta seção impressa/PDF no celular** (a tabela mestra + fluxograma).
2. **USB de recuperação** etiquetado, com a imagem correta para seu modelo (LCD ou OLED).
3. **Lista dos seus Flatpaks** (`flatpak list --app --columns=application > flatpaks.txt`).
4. **Lista dos pacman no overlay** (`pacman -Qqe > pacman.txt`).
5. **Backup recente de `/home`** em disco externo (rsync ou btrfs send).

Com esses cinco itens, o pior cenário (reinstalação completa) vira uma tarefa de 30 minutos, não uma tragédia.

:::nota
Este capítulo fecha o módulo de referência rápida do curso. Use-o como camada final: os capítulos 93-94 (diagnóstico aprofundado) te ensinaram a pensar; este capítulo te dá o mapa para agir rápido. Juntos, são o "manual de sobrevivência" do Steam Deck.
:::

## Resumo

- A tabela mestra condensa as 8 áreas em uma página consultável.
- O fluxograma de resgate começa no sintoma e termina em comando, passando por no máximo 3 decisões.
- Cada área tem um comando-âncora — o primeiro que você digita para orientar o diagnóstico.
- Três procedimentos de emergência: reset EC+BIOS, shell de recuperação com `fsck`, e reinstalação com "Keep user data".
- Sinais para parar de remendar: múltiplos subsistemas, resistência à troca A/B, > 45 min sem diagnóstico, backup pronto.
- Kit offline: tabela impressa, USB recovery, listas de apps, backup.

## Exercícios

1. Leia a tabela mestra linha por linha e marque as que você já enfrentou. Das marcadas, em quantas a causa provável bateu com a sua experiência real?
2. Copie o fluxograma de resgate à mão (ou em um arquivo separado). Teste-o mentalmente com um problema que você já teve: ele te levaria ao lugar certo?
3. Prepare seu "kit de emergência offline": gere as listas de Flatpaks e pacman, localize o USB de recuperação (ou crie um), e salve esta seção como PDF no seu celular.
4. Execute cada um dos comandos-âncora (8 no total) em sequência, registrando a saída. Eles rodam sem erro? Você sabe interpretar o que cada um retorna?
5. **Desafio.** Simule um cenário de emergência: imagine que o Deck parou de dar boot. Percorra o fluxograma com o aparelho desligado e execute os passos 1–4 do "Reset completo de firmware". Ao religar, tudo normal? Documente o que você fez e o que observou — esse registro é o seu próprio "manual de emergência" personalizado.
Videoconferência no Deck esbarra num limite físico: o aparelho não tem câmera embutida. Para participar de uma reunião com vídeo, você precisa de uma câmera USB externa — e aí entra a segunda camada de complexidade, a de software. O Zoom, o Meet e o Teams rodam no Deck, mas cada um interage de um jeito diferente com o PipeWire, o som e a captura de vídeo. Esta seção foca no Zoom, que tem cliente Flatpak oficial e é o caso mais completo.

:::objetivos
- Instalar o Zoom via Flatpak no SteamOS
- Conectar uma câmera externa e validar que o kernel a detectou
- Conceder as permissões de webcam e microfone que o Zoom exige
- Entrar numa reunião e ajustar áudio/vídeo para o hardware do Deck
:::

## Preparando o hardware: a câmera

Antes de instalar qualquer aplicativo, confirme que o Deck enxerga a câmera. Conecte a câmera USB e rode:

```terminal
$ lsusb
Bus 003 Device 002: ID 046d:085e Logitech, Inc. BRIO Ultra HD Webcam
Bus 003 Device 004: ID 28de:1205 Valve Software Steam Deck Controller
$ ls /dev/video*
/dev/video0  /dev/video1
```

A saída mostra duas coisas: o `lsusb` lista a câmera Logitech Brio no barramento 003, e `/dev/video0` e `/dev/video1` são os dispositivos Video4Linux criados pelo driver UVC. O UVC (USB Video Class) é o driver genérico que o kernel carrega para quase toda webcam — ele funciona com periféricos de logitech, Microsoft e genéricos, sem firmware proprietário.

:::atencao
Câmeras que precisam de firmware proprietário (como a Razer Kiyo Pro Ultra ou algumas da Elgato) aparecem no `lsusb` mas criam `/dev/video*` sem imagem real. O kernel do SteamOS não carrega firmware não-livre por design. Teste com outra câmera UVC genérica se a imagem ficar preta.
:::

## Instalando o Zoom

O Zoom tem cliente Flatpak oficial:

```terminal
$ flatpak install us.zoom.Zoom
Looking for matches…
Found ref ‘app/us.zoom.Zoom/x86_64/stable’ in remote ‘flathub’ (system).
Do you want to install it? [Y/n]: Y
Installing… done
$ flatpak run us.zoom.Zoom
```

Na primeira vez, o Zoom pede permissão de câmera e microfone. Conceda. Mas, como no Discord, a sandbox pode bloquear o acesso mesmo com o pedido aceito. Verifique as permissões:

```terminal
$ flatpak info --show-permissions us.zoom.Zoom | grep -E 'sockets|device'
sockets=x11;wayland;pulseaudio;cups;
device=all;
```

A linha `device=all` é a chave: ela dá ao Zoom acesso a todos os dispositivos, incluindo `/dev/video*`. É permissiva demais do ponto de vista de segurança, mas é o que faz a câmera aparecer imediatamente. Se a sua versão não listar `device=all`, use o Flatseal para adicionar `/dev/video0` e `/dev/video1` à seção de dispositivos.

## A reunião e o ajuste fino

Entre numa reunião de teste e ajuste três coisas, nessa ordem:

1. **Vídeo**: confirme que a câmera mostra imagem. Se ficar preta, é problema de firmware ou de permissão de dispositivo.
2. **Áudio de entrada**: o Zoom consome o PipeWire. Se o microfone não capta, cheque se o device "default" do Zoom aponta para a fonte certa — no Deck, às vezes aponta para o microfone embutido que não existe.
3. **Áudio de saída**: o som da reunião vai para o alto-falante. Com fone Bluetooth, troque o dispositivo de saída manualmente.

```terminal
$ flatpak run --socket=pulseaudio us.zoom.Zoom
```

A flag `--socket=pulseaudio` é redundante se a permissão já vier no Flatpak, mas não custa incluí-la — ela garante o áudio mesmo em builds antigas do pacote.

:::dica
O Zoom consome muita CPU no Deck, especialmente com vídeo em 720p e fundo virtual ativado. Desligue o "virtual background" (fundo virtual), que usa o processador para segmentar a imagem em tempo real, e reduza a qualidade de envio para 360p se a bateria estiver no fim.
:::

## Alternativas: Meet e Jitsi sem instalar nada

Se o Zoom der trabalho, o Meet e o Jitsi rodam direto no navegador, sem Flatpak extra. O Meet no Chrome detecta câmera e microfone com pouca fricção; o Jitsi (`meet.jit.si`) é o caminho mais rápido para uma chamada sem cadastro.

```terminal
$ flatpak run com.google.Chrome 'https://meet.jit.si/deck-reuniao-ana'
```

Para o Meet/Jitsi no navegador, a câmera aparece via o mesmo UVC, mas o navegador media a captura pelo portal de permissão do Flatpak. Se o Firefox não mostrar a câmera, é o mesmo conflito de `device` que se resolve no Flatseal — [ver a seção sobre permissões e Flatseal](#/cap-033/sec-08).

## Resumo

- O Deck não tem câmera embutida; é preciso uma webcam USB com driver UVC genérico.
- `lsusb` e `ls /dev/video*` confirmam que o kernel detectou a câmera antes de mexer em qualquer aplicativo.
- O Zoom Flatpak pede `device=all`, o que habilita a câmera imediatamente, mas é permissivo.
- Fundo virtual e alta resolução consomem bateria e CPU; reduza para 360p quando necessário.
- Meet e Jitsi no navegador são alternativas rápidas sem instalar Flatpak adicional.

## Exercícios

1. Conecte uma webcam USB e confirme com `lsusb` e `ls /dev/video*` que ela foi detectada pelo kernel.
2. Instale o Zoom e confira as permissões com `flatpak info --show-permissions us.zoom.Zoom`. A linha `device=all` está presente?
3. Entre numa reunião de teste do Zoom e ajuste vídeo, entrada e saída de áudio. Anote qual dispositivo cada campo selecionou.
4. Teste a mesma câmera no Meet via Chrome e no Jitsi via Firefox. Compare o resultado.
5. **Desafio.** Use o celular como webcam via DroidCam (app Android + cliente no Deck) e conecte-o ao Zoom. Explique por que o DroidCam resolve o problema de firmware proprietário das câmeras incompatíveis.
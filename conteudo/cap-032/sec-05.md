Screenshots de jogo, ajustes em texturas, criação de thumbnails para a Steam: o Deck gera mais imagens do que parece. O GIMP é o editor que resolve tudo isso sem custo, e sua versão Flatpak roda nativa no Arch do SteamOS. A interface ocupa bem a tela de 800p, mas com alguns ajustes ela fica confortável até no trackpad.

:::objetivos
- Instalar o GIMP via Flathub e verificar a versão
- Recortar, redimensionar e exportar uma imagem pelo terminal
- Configurar o layout da interface para a tela do Deck
- Automatizar edições em lote com o modo script do GIMP
:::

## Instalação e versão

O GIMP está no Flathub como `org.gimp.GIMP` (repare que "GIMP" está em maiúsculas no App ID):

```terminal
$ flatpak install org.gimp.GIMP
Looking for matches…
Found similar ref(s) for 'org.gimp.GIMP' in remote 'flathub' (system).
Use this remote? [Y/n]: Y

        ID                                          Branch          Op           Remote           Download
 1. [✓] org.gimp.GIMP                              stable          i            flathub         120,8 MB / 121,2 MB
 2. [✓] org.gimp.GIMP.Locale                       stable          i            flathub          18,3 MB / 18,4 MB

Installation complete.

$ flatpak run org.gimp.GIMP --version
GIMP 2.10.38
```

O GIMP 2.10 é a série estável atual. O GIMP 3.0, com GTK 3 e filtros não-destrutivos, está em migração, mas o Flathub ainda distribui a linha 2.10 por estabilidade.

## Recortando e redimensionando pelo terminal

Embora a maioria use a interface gráfica, o GIMP tem um modo batch que opera por linha de comando — útil para scripts de automação. Para recortar uma imagem e redimensionar em uma tacada:

```terminal
$ flatpak run org.gimp.GIMP -i -b '
(define (processa-img)
  (let* ((img (car (gimp-file-load RUN-NONINTERACTIVE "/home/deck/Downloads/captura.png" "captura.png")))
         (drawable (car (gimp-image-get-active-layer img))))
    (gimp-image-crop img 1280 720 0 0)
    (gimp-image-scale img 640 360)
    (gimp-file-save RUN-NONINTERACTIVE img drawable "/home/deck/Downloads/miniatura.png" "miniatura.png")
    (gimp-image-delete img)))
(processa-img)
(gimp-quit 0)'
batch command executed successfully
```

Isso é Scheme, a linguagem de script do GIMP. Você não precisa escrever isso do zero toda vez: o GIMP grava macros que você pode reutilizar. Para o uso diário, a interface é mais produtiva — mas para processar 50 screenshots de uma vez, o batch é imbatível.

## Adaptando a interface para 800p

A tela do Deck tem 1280×800 pixels. O GIMP, com suas múltiplas janelas flutuantes no modo tradicional, fica claustrofóbico. A solução é ativar o **modo janela única**:

```terminal
$ flatpak run org.gimp.GIMP --no-splash
```

Depois de abrir, vá em Janelas > Modo de janela única (ou `[[Ctrl+J]]`). Toda a interface — caixa de ferramentas, camadas, pincéis — se encaixa numa única janela, que você maximiza. O GIMP lembra essa configuração para a próxima sessão.

:::dica
No Deck, a roda de rolagem não existe, mas o GIMP aceita zoom com `[[Ctrl+scroll]]` no trackpad (deslize com dois dedos). Para pan (arrastar a tela), segure a [[barra de espaço]] e arraste com o trackpad ou com o dedo se estiver usando touch. São dois atalhos que substituem bem o mouse.
:::

## Exportando para o formato certo

O GIMP salva no formato nativo `.xcf`, mas o que você quer quase sempre é PNG para upload na Steam ou JPEG para compartilhar. A exportação é o caminho padrão:

```terminal
$ flatpak run org.gimp.GIMP ~/Downloads/captura.xcf
# Dentro do GIMP: Arquivo > Exportar como…
# Atalho: Shift+Ctrl+E
```

O GIMP Flatpak tem acesso ao seu diretório `~/Downloads` (pelo `filesystems=xdg-download` padrão), mas para exportar para outras pastas você pode precisar liberar permissões com o Flatseal. Felizmente o exportador do GIMP enxerga a mesma árvore de diretórios que o VLC — acesso completo ao disco, porque é um aplicativo de edição.

:::atencao
Não confunda "Salvar" (`[[Ctrl+S]]`) com "Exportar" (`[[Shift+Ctrl+E]]`). Salvar gera um `.xcf` com camadas preservadas; Exportar produz um PNG/JPEG final, achatado. Se você só deu "Salvar" e mandou o arquivo para alguém, a pessoa recebe um `.xcf` que só o GIMP abre.
:::

## Processamento em lote realista

Um cenário comum no Deck: você tirou 30 screenshots no modo jogo e quer reduzi-las a 640×360 para enviar ao Discord. Em vez de abrir uma a uma, use o modo batch com um script salvo:

```terminal
$ for img in ~/Pictures/Screenshots/*.png; do
    flatpak run org.gimp.GIMP -i -b "(batch-resize \"$img\" 640 360)" -b "(gimp-quit 0)"
done
```

O `batch-resize` é uma função Scheme que você define uma vez e salva no diretório de scripts do GIMP (`~/.var/app/org.gimp.GIMP/config/GIMP/2.10/scripts/`). Isso transforma o Deck numa miniatura de estação de edição em lote.

## Resumo

- O GIMP instala com `flatpak install org.gimp.GIMP` e está na versão 2.10.x estável.
- O modo batch (`-i -b`) opera o GIMP por scripts Scheme, útil para processar várias imagens de uma vez.
- O modo janela única (`[[Ctrl+J]]`) adapta a interface multi-janela à tela de 800p do Deck.
- Salvar (`[[Ctrl+S]]`) gera `.xcf` com camadas; Exportar (`[[Shift+Ctrl+E]]`) gera PNG/JPEG final.
- Scripts personalizados em `~/.var/app/org.gimp.GIMP/config/GIMP/2.10/scripts/` automatizam tarefas repetitivas.

## Exercícios

1. Instale o GIMP e abra um screenshot do modo jogo. Recorte apenas a região do jogo e exporte como PNG.
2. Ative o modo janela única (`Janelas > Modo de janela única`) e organize as caixas de ferramentas e camadas à sua preferência. Feche e reabra o GIMP para confirmar que a configuração persiste.
3. Escreva um script Scheme mínimo que carrega uma imagem e a redimensiona para 640×360. Salve na pasta de scripts e execute pelo terminal com `-i -b`.
4. Processe 5 screenshots em lote usando um loop `for` no terminal, redimensionando todos para metade do tamanho original.
5. **Desafio.** Combine o GIMP com um script shell que monitore a pasta de screenshots do Steam (`~/.local/share/Steam/userdata/<id>/760/remote/<appid>/screenshots/thumbnails/`) e, ao detectar um arquivo novo, gere automaticamente uma versão com marca d'água.
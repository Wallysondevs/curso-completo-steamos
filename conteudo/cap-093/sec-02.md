Ligar o aparelho e ver só a tela preta é dos sustos mais comuns — e, na maioria das vezes, o sistema não morreu: ele apenas não conseguiu desenhar nada na saída de vídeo. A distinção crucial é entre "o aparelho não liga" e "o aparelho ligou mas não exibe". Esta seção ensina a separar os dois casos e a recuperar a imagem quando o problema está no caminho entre o kernel e o monitor.

:::objetivos
- Distinguir aparelho desligado de aparelho ligado sem imagem
- Testar a saída de vídeo e o cabo antes de mexer no sistema
- Diagnosticar falha do driver de GPU no boot
- Recuperar imagem com parâmetros de kernel como `nomodeset`
:::

## O aparelho liga de verdade?

Antes de culpar o software, descubra se há vida no hardware. Um Steam Deck ligado e saudável emite sinais que você pode observar sem ver nada na tela: a ventoinha acelera e para, o LED de energia acende ou pisca, e o aparelho vibra ou aquece levemente.

```terminal
$ lsusb -t
/:  Bus 01.Port 1: Dev 1, Class=root_hub, Driver=xhci_hcd/2p, 480M
```

Se você consegue acessar a máquina por outra via — por exemplo, plugando-a num dock com teclado e vendo o LED do teclado acender, ou acessando-a por SSH — o sistema está **ligado e funcionando**, e o problema está só na trilha de vídeo. Esse é o melhor cenário: o diagnóstico vira um problema de saída, não de boot.

:::dica
Tela preta em modo dock com monitor externo costuma ser ordem de detecção do HDMI. Desconecte o dock, ligue o aparelho na tela interna, e só então plugue o HDMI depois que o sistema subir. O monitor externo quase sempre "volta" nessa ordem.
:::

## Cabo, porta e ordem de inicialização

A etapa mais barata é a física. Teste, nessa ordem, o que custa zero:

- Outro cabo HDMI (muitos cabos baratos não negociam a resolução que o Deck pede).
- Outra porta do monitor ou da TV, e outro monitor se houver.
- Com o carregador original plugado — sem carga, alguns aparelhos não negociam vídeo externo.

```terminal
$ xrandr --query 2>/dev/null | grep -E 'connected|disconnected'
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis) 400mm x 250mm
HDMI-A-0 disconnected (normal left inverted right x axis y axis)
```

Se o `xrandr` mostra `eDP-1 connected` (a tela interna) mas `HDMI-A-0 disconnected`, o monitor externo não foi reconhecido pelo driver — um problema de detecção, não de tela. Detecção de HDMI no boot é notoriamente chata; religar o monitor com o aparelho já ligado muitas vezes dispara a detecção.

## Quando o problema é o driver de GPU

Se o aparelho liga, o teclado responde, mas **nenhuma** tela mostra imagem, a suspeita cai sobre o driver de vídeo. O Steam Deck usa GPU AMD com o driver `amdgpu` no kernel, e o modo jogo roda em cima do compositor `gamescope`; quando um deles falha ao subir, você fica sem framebuffer — preto total, embora o sistema esteja de pé por baixo.

```terminal
$ sudo dmesg | grep -iE 'amdgpu|drm|modeset' | tail -20
[    3.204118] [drm] amdgpu kernel modesetting enabled.
[    3.211876] amdgpu 0000:04:00.0: firmware: failed to load amdgpu/gc_11_0_1_mes.bin (-2)
[    3.211899] amdgpu 0000:04:00.0: Direct firmware load for amdgpu/gc_11_0_1_mes.bin failed with error -2
```

Aqui está a pista de ouro: `failed to load amdgpu/...mes.bin`. O driver precisa de um **firmware** do chip gráfico que não foi encontrado — ou o pacote de firmware não está instalado, ou foi removido numa atualização. Sem o firmware, o `amdgpu` não consegue inicializar a aceleração e o boot para numa tela preta.

:::nota
No SteamOS o firmware da GPU AMD vem embutido no sistema (no pacote `linux-firmware` nas distribuições convencionais). Uma atualização interrompida no meio pode deixar esses binários pela metade, e o sintoma clássico é exatamente este: `amdgpu` carrega, pede o firmware, e cai.
:::

## Recuperando a imagem com parâmetros do kernel

Quando o driver com aceleração falha, o recurso de emergência é forçar o kernel a usar o caminho de vídeo mais simples possível, sem aceleração de GPU. No menu do GRUB, edite a entrada de boot (tecla `e`) e adicione `nomodeset` à linha que começa com `linux`.

```terminal
linux /boot/vmlinuz-6.1.52-valve root=UUID=... ro quiet splash nomodeset
```

O parâmetro `nomodeset` desliga o **Kernel Mode Setting** (KMS) — a troca de modo de vídeo feita dentro do kernel, requisito do driver moderno. Sem ele, o sistema cai no modo de compatibilidade básico do firmware e você recupera a imagem para poder diagnosticar e corrigir com calma (geralmente reinstalando o firmware de GPU ou revertendo o kernel).

:::perigo
`nomodeset` é uma muleta de resgate: a imagem volta, mas sem aceleração, então o modo jogo e a decodificação de vídeo ficam lentos ou nem abrem. Use-o para chegar ao sistema e consertar a causa, nunca como configuração permanente.
:::

Depois de consertar, remova o `nomodeset` da linha de boot (é uma edição temporária do GRUB, que não persiste) e reinicie para confirmar que o driver volta a carregar firme.

## Resumo

- Tela preta separa-se em "não liga" e "ligou mas não exibe"; o segundo caso tem sistema vivo por baixo.
- Testar cabo, porta e ordem de detecção do HDMI é a etapa mais barata e resolve muitos modos dock.
- `xrandr` distingue monitor conectado de reconhecido; `disconnected` é detecção, não tela.
- Falha de `amdgpu` com `failed to load firmware` indica firmware de GPU ausente ou corrompido.
- `nomodeset` no GRUB recupera a imagem sem aceleração para permitir o reparo.
- A edição do GRUB é temporária e deve ser revertida após corrigir a causa.

## Exercícios

1. Com o aparelho em modo desktop, rode `xrandr --query` e anote a saída de cada conector: `connected`, `disconnected` ou `unknown`.
2. Simule o diagnóstico: desconecte o monitor externo e relate, em duas frases, como você distinguiria "aparelho desligado" de "ligado sem imagem" usando apenas sinais físicos.
3. Examine `sudo dmesg | grep -iE 'amdgpu|firmware'` e identifique a versão do driver e qualquer mensagem de firmware ausente na sua máquina.
4. Descubra qual kernel está em uso (`uname -r`) e verifique no GRUB se existe uma entrada de kernel anterior disponível como plano B.
5. **Desafio.** Sem consultar a seção 3, formule a explicação de por que um *boot loop* (reinício infinito logo após o logo) costuma ter causa diferente da tela preta pura, e proponha que ferramenta você usaria para distinguir os dois casos.

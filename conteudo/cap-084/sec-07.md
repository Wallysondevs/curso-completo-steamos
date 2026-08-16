Trocar o analógico é a operação mais delicada deste capítulo, não pela força exigida, mas pela fragilidade do que está ao redor: cabos flat que rasgam, presilhas de conector que quebram e uma tela que se furou é irreversível. A boa notícia é que o stick do Deck é um módulo completo — você troca a peça inteira, não solda potenciômetros avulsos. Com paciência e a ordem certa, é um trabalho de precisão, não de força.

:::objetivos
- Remover o módulo de analógico original com segurança
- Soltar e reconectar os cabos flat e o conector do stick
- Instalar o módulo hall effect no suporte correto
- Calibrar o novo stick pelo SteamOS e pelo `evtest`
- Reinstalar tampas (caps) e validar o resultado físico
:::

## Preparando a face frontal

Diferente da troca de SSD (que se resolve pela traseira), o analógico fica na face frontal, exigindo que você separe as carcaças. Com os oito parafusos já removidos e a bateria desconectada, abra o Deck e destaque com cuidado os cabos que ligam a face frontal à placa — em especial o flat da tela e do touchpad — antes de levantar completamente a metade de cima.

```terminal
$ sudo systemctl mask --now eda-svc 2>/dev/null; echo "padrão registrado"
```

Antes de qualquer sintoma, tenha em mente o diagnóstico: o `evtest` da seção anterior identificou qual stick driftou (`ABS_X`/`ABS_Y` com repouso longe de zero). Anote qual dos lados — esquerdo ou direito — precisa ser trocado. Muitos kits vendem em par, mas você pode trocar apenas o defeituoso se o outro estiver saudável.

:::perigo
Os cabos flat (FPC) do Deck são finos como papel de cigarro. Nunca puxe pela fita — use a pinça na parte rígida do terminal. Uma dobra ou um rasgo num flat da tela pode significar substituir o display inteiro, o reparo mais caro do aparelho.
:::

## Removendo o módulo original

Com a face frontal separada, localize o stick defeituoso. Ele é um módulo plástico preso por **três parafusos** a uma pequena placa-filha (daughterboard), ligado à placa-mãe por um cabo flat. Remova os parafusos e o flat, e o módulo sai inteiro. O potenciômetro desgastado fica dentro do módulo — você não precisa (nem deve) abri-lo.

```terminal
$ ls /dev/input/by-path/ | grep -i -E 'steam|deck|joystick'
pci-0000:00:08.1-platform-jupiter-event-joystick
```

O caminho `by-path` confirma o nó do joystick no barramento. Depois da troca, o mesmo nó deve reaparecer (o kernel trata o novo stick como o mesmo dispositivo, já que o módulo é eletricamente equivalente). Isso ajuda a validar no software que tudo está conectado de novo.

## Instalando o módulo hall effect

O hall effect entra no mesmo lugar, com os mesmos três parafusos e o mesmo flat. A diferença está no alinhamento do ímã com o sensor: o módulo é pré-calibrado de fábrica, então encaixe reto e sem forçar. Recoloque o flat com o conector destravado (levante a presilha), insira a fita até a linha de referência e trave a presilha.

```terminal
$ sudo udevadm trigger --subsystem-match=input && udevadm settle
```

Após remontar e religar, o comando acima força o udev a reescanear os dispositivos de input e aguarda (`udevadm settle`) até que os nós estejam prontos. É a forma limpa de garantir que o sistema "viu" o novo stick sem reiniciar de novo.

:::dica
Antes de fechar a carcaça, faça um teste funcional "com o paciente aberto": ligue o Deck, mexa o stick e veja o cursor/`evtest` respondendo. Testar agora evita descobrir um flat mal encaixado só depois de remontar tudo.
:::

## Calibrando o novo stick

O SteamOS calibra o centro automaticamente na inicialização, mas refinar a zona morta compensa a instalação. No modo Desktop ou nas configurações do jogo, verifique se o repouso lê próximo de zero; se houver *jitter*, aumente levemente a zona morta até eliminar o ruído sem sacrificar a resposta.

```terminal
$ evtest /dev/input/event3
Event: type 3 (EV_ABS), code 0 (ABS_X), value 1
Event: type 3 (EV_ABS), code 0 (ABS_X), value -2
Event: type 3 (EV_ABS), code 0 (ABS_X), value 0
```

O `evtest` é o seu medidor final: um hall effect bem instalado deixa o repouso oscilando entre valores mínimos (`1`, `-2`, `0`), muito abaixo do drift que motivou a troca. Gire o stick em círculos completos e confira se os quatro quadrantes respondem com valores crescentes e decrescentes suaves.

## Remontando e os caps

Recoloque os caps (as tampas de borracha) dos sticks — muitas vezes elas saem junto com a face e precisam ser reposicionadas sobre o eixo novo. Encaixe a face frontal, religue os flats, feche as presilhas em ordem inversa (partindo de onde abriu) e aparafuse os oito parafusos, lembrando da separação entre curtos e longos.

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'percentage|state'
    percentage:          78%
    state:               charging
```

Ao final, religue com o carregador (para sair do Battery Storage Mode) e confirme que a bateria volta a carregar normalmente. Se `state` mostrar `charging` e a porcentagem subir, o circuito de energia retornou ao normal após todo o procedimento.

## Resumo

- O stick é um módulo completo preso por três parafusos e um cabo flat; você troca a peça inteira.
- Cabos flat se soltam pela presilha do conector, nunca puxando pela fita.
- O hall effect entra no mesmo encaixe, com alinhamento do ímã pré-calibrado de fábrica.
- `udevadm trigger` reescaneia os inputs e `evtest` valida o repouso perto de zero.
- Teste com a carcaça aberta antes de remontar, e religue com carregador para sair do Battery Storage Mode.

## Exercícios

1. Identifique qual dos dois sticks apresenta drift, usando `evtest` e comparando o repouso de `ABS_X`/`ABS_Y` em cada lado.
2. Localize o nó do joystick com `ls /dev/input/by-path/ | grep -i joystick` e registre o caminho completo.
3. Liste, na ordem, os passos de remoção do módulo: quais parafusos soltar, qual conector destravar e como puxar o flat.
4. Após (ou simulando) a troca, rode `sudo udevadm trigger --subsystem-match=input` e explique o que ele faz e por que o `udevadm settle` vem em seguida.
5. **Desafio.** Relacione a resolução do conversor ADC do sensor hall effect com o que o `evtest` mostra na prática: por que um ADC de mais bits resulta em passos menores entre os valores e numa mira teoricamente mais suave, e onde a zona morta entra nessa equação?

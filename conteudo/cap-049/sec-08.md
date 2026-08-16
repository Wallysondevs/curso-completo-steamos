Cada emulador tem seu próprio conjunto de opções gráficas e de CPU, mas o Steam Deck impõe um denominador comum: energia, calor e duração de bateria. Um jogo de PS2 a 60 FPS drena 16 W e esquenta; o mesmo jogo a 30 FPS gasta 7 W e passa horas. Esta seção mostra como ajustar o TDP, a taxa de quadros, o FSR e o gamemode para cada emulador, casando desempenho com autonomia de forma consciente.

:::objetivos
- Compreender o impacto de cada emulador no consumo do Deck
- Configurar limite de TDP e de FPS por emulador
- Usar FSR embutido para upscaling sem GPU extra
- Aplicar gamemode e kernel de real-time para reduzir latência
- Montar perfis de energia por emulador para portátil e dock
:::

## Onde a energia vai embora

A APU do Steam Deck consome até 15 W divididos entre CPU e GPU. Cada emulador puxa para um lado:

| Emulador | Gargalo principal | Consumo típico sem trava |
|---|---|---|
| PCSX2 | CPU média, GPU baixa–média | 8–12 W |
| Dolphin | CPU baixa, GPU baixa–média | 6–10 W |
| RPCS3 | CPU alta, GPU baixa | 12–15 W |
| Cemu | CPU média, GPU depende do graphic pack | 8–14 W |
| Xemu | CPU baixa, GPU baixa | 4–7 W |

O RPCS3 é o vilão: consome a APU toda. O Xemu é o santo: dificilmente incomoda. Para os outros, o ajuste de TDP e FPS libera autonomia sem perder jogabilidade.

## TDP e FPS no Deck

O Steam Deck expõe o controle manual de TDP no painel de performance (botão `[[...]]`). Você regula quanto a APU pode puxar: 5 W força o modo econômico, 10 W é equilibrado, 15 W é sem limites. A FPS cap trava a taxa de quadros emulada.

```terminal
$ echo "GOVERNOR=powersave" > /tmp/gamemode-config
```

A sequência ótima é: primeiro travar o FPS no emulador (via FPS cap), depois reduzir o TDP até onde o FPS começa a cair, e voltar uma casa. Assim você encontra o ponto de consumo mínimo para o desempenho desejado.

:::dica
No modo portátil, 30 FPS + TDP 7 W costuma dar horas a mais de bateria do que 60 FPS + TDP 12 W, e a diferença visual num jogo de PS2 é pequena o bastante para que a maioria prefira a duração extra.
:::

## FSR e upscaling na camada do Deck

O Steam Deck inclui **FSR** (FidelityFX Super Resolution) no compositor do gamescope. Você roda o emulador em resolução interna menor (ex.: 540p) e o FSR faz upscaling para a tela de 800p, ganhando FPS com perda visual mínima.

```terminal
$ flatpak run net.pcsx2.PCSX2 --backend=vulkan --internal-resolution=1x
[Graphics] Internal: 640×448 (1x) → Output: 800p via FSR
```

A combinação funciona assim para cada nível de exigência:

| Meta | Resolução interna | FSR | TDP sugerido |
|---|---|---|---|
| Autonomia máxima | 1x (nativa) | ON | 5–7 W |
| Equilíbrio portátil | 2x | OFF | 8–10 W |
| Qualidade dock TV | 3x | OFF | 12–15 W |

O FSR não faz mágica — ele introduz um leve borrão —, mas em trânsito com a bateria no vermelho é a diferença entre continuar jogando e desligar.

:::atencao
Nem todo emulador combina bem com FSR. Em jogos com texto pequeno (RPGs japoneses, caixas de diálogo), o borrão do FSR pode legendar a experiência. Nesses casos, prefira o upscaling interno do emulador (2x) em vez do FSR.
:::

## Gamemode e latência

O SteamOS usa o `gamemode` — um daemon que ajusta o escalonador do kernel para priorizar o jogo em execução. Para emuladores, que são aplicações sensíveis a interrupções, isso reduz a variação de frame time:

```terminal
$ gamemoderun flatpak run net.rpcs3.RPCS3
[gamemode] Applied CPU governor: performance
```

No terminal, `gamemoderun` é o prefixo mágico. Ele eleva o governor da CPU para `performance`, trava a GPU em frequência mínima adequada e ajusta o *nice level* do processo. A diferença de latência sentida no controle é sutil mas mensurável, especialmente em jogos de ritmo (luta, plataforma).

## Perfis para portátil e dock

A configuração ótima muda quando você conecta o Deck a uma TV via dock:

- **Portátil (800p)**: FPS cap 30 ou 60, TDP contido entre 7–10 W, FSR quando necessário.
- **Dock (1080p TV)**: TDP liberado, resolução interna mais alta (3x–4x), sem preocupação com bateria.

```terminal
$ flatpak run net.pcsx2.PCSX2 --internal-resolution=3x
```

O perfil do PCSX2 a 3x na TV equivale a um PS2 renderizando em HD nativo, e a APU do Deck sobra nessa situação porque está plugada à rede elétrica.

## Resumo

- Cada emulador tem perfil de consumo próprio: Xemu é o mais leve e RPCS3 o mais pesado.
- A combinação FPS cap + TDP reduzido multiplica a autonomia com perda visual controlada.
- O FSR do gamescope faz upscaling de resoluções baixas e compensa a economia de energia.
- `gamemoderun` aplica governador de CPU e ajuste de prioridade que reduz a latência de emulação.
- Perfis distintos para portátil (bateria) e dock (TV) otimizam o uso do Deck por cenário.

## Exercícios

1. Rode um jogo de PS2 no PCSX2 e meça o FPS e o consumo (watts) no overlay do Deck em três níveis de TDP diferentes.
2. Ative o FSR com resolução interna 1x e depois com 2x; anote a diferença visual em texto e HUD.
3. Execute o mesmo jogo com e sem `gamemoderun` e compare o frame time médio.
4. Crie um perfil de "portátil" (30 FPS + TDP baixo) e um de "dock" (60 FPS + TDP livre) e salve num arquivo de notas.
5. **Desafio.** Use `mangohud` para monitorar o consumo de cada núcleo da CPU e explique por que o RPCS3 satura mais núcleos que o Xemu, com base no que você aprendeu sobre o Cell/SPU na [seção sobre RPCS3](#/cap-049/sec-05).
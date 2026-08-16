Tela preta e crash no momento do launch são os dois sintomas que mais assustam e, por ironia, os que mais entregam pistas no log. A diferença entre eles é cirúrgica: tela preta geralmente significa que a camada gráfica não conseguiu renderizar o primeiro quadro, enquanto o crash imediato indica que algo quebrou antes mesmo de a janela de desenho nascer. Esta seção ensina a separar um do outro e atacar a causa certa.

:::objetivos
- Distinguir tela preta de crash no launch por observação e por log
- Diagnosticar quando a GPU não é detectada pelo Vulkan
- Aplicar `DXVK_ASYNC=1` e entender quando ele ajuda
- Testar a versão GE do Proton como alternativa de renderização
- Ler erros de shader e de criação de dispositivo no log
:::

## Por que a tela fica preta

No Steam Deck, o Proton renderiza via Vulkan. Quando o jogo pede para criar o contexto gráfico e a resposta demora ou falha, você não vê uma janela quebrada — vê nada: a tela preta. As duas causas mais comuns são **compilação de shaders** no primeiro boot e **falha de detecção da GPU** pelo Vulkan.

O primeiro caso é benigno. Jogos grandes compilam milhares de shaders na primeira execução, e o Deck mostra a barra de "compiling Vulkan shaders". Durante o jogo, novos shaders também causam micro-engasgos. É aí que o `DXVK_ASYNC` entra.

```bash
DXVK_ASYNC=1 %command%
```

Essa variável permite que o DXVK desenhe frames mesmo quando um shader ainda não compilou, evitando o travamento total na tela preta. O custo é visual: pode aparecer textura faltando por uma fração de segundo, até o shader terminar. Para single-player é ótimo; em multiplayer competitivo, o *pop-in* de textura pode atrapalhar.

## Quando a GPU não aparece

Se o log mostra o renderizador de software `llvmpipe` em vez da GPU AMD, o Vulkan não viu o hardware. Confirme listando os dispositivos Vulkan disponíveis:

```terminal
$ vulkaninfo --summary 2>/dev/null | grep -A2 deviceName
	deviceName        = AMD Radeon Graphics (RADV VANGOGH)
	apiVersion        = 1.3.204
$ vkcube
```

O comando `vulkaninfo` lista os adaptadores Vulkan. No Deck, o esperado é o `RADV` (driver Vulkan livre da Mesa) reportando a APU Van Gogh. Se só aparecer `llvmpipe`, o driver gráfico não está ativo — no Deck isso é raro, mas acontece após uma atualização de sistema que precisa de reboot.

:::nota
`vkcube` é um minijogo que desenha um cubo girando para provar, visualmente, que o Vulkan está funcional. Ele faz parte dos utilitários de teste `vulkan-tools`. Se o cubo aparece, o problema não é o driver — é o jogo ou o Proton.
:::

## O crash que fecha tudo

Diferente da tela preta, o crash de launch costuma acontecer **antes** do primeiro frame. O log, de novo, é quem conta a história. Ative o log e rode o jogo uma única vez, depois concentre a leitura no final do arquivo:

```terminal
$ PROTON_LOG=1
$ tail -30 ~/steam-405100.log
err:   seh:setup_exception_record stack overflow 2048 bytes in thread 0114 eip 000000018000f3a0
wine: Unhandled page fault on read access to 0x0000000000000100 at address 0x000000018000f3a0
wine: Unhandled exception 0xc0000005
```

O `Unhandled exception` seguido de um código hexa (aqui `0xc0000005`, uma violação de acesso) é o veredito do Windows de que o processo morreu. Dependendo do código, a causa varia — mas, no Proton, a primeira suspeita costuma ser a **versão do Proton** incompatível com aquele título.

Teste trocar de versão em Propriedades → Compatibilidade. A Valve mantém o Proton estável na linha 8.x/9.x, mas muitos títulos só se comportam com o **GE-Proton**, uma versão comunitária mantida por GloriousEggroll que inclui patches e codecs extras.

:::dica
O Proton GE também resolve a maioria dos problemas de **codecs patenteados** que fazem vídeos e cutscenes não tocarem — assunto da [seção de FMV](#/cap-042/sec-05). Muitas vezes a troca para GE resolve dois sintomas de uma vez.
:::

## Mudo o Proton certo para cada sintoma

Nem toda falha pede GE. Use a tabela como guia rápido para decidir por onde começar.

| Sintoma | Primeira tentativa |
|---|---|
| Tela preta com áudio | `DXVK_ASYNC=1` |
| Tela preta total, sem áudio | Confere `vulkaninfo` / reboot do driver |
| Crash imediato sem mensagem | Troca versão do Proton |
| Crash com `0xc0000005` | Proton GE ou versão Experimental |
| Vídeos sem imagem | Proton GE |
| Vulkan não acha GPU | `vulkaninfo`, atualizar Mesa, reboot |

:::atencao
`DXVK_ASYNC=1` **só funciona** no Proton GE e em versões antigas/forks do DXVK. Nas versões modernas do Proton oficial a opção foi removida do upstream e é simplesmente ignorada. Se você setar e nada mudar, essa é a explicação — use o Proton GE para ter acesso a ela.
:::

## Reduzindo o espaço de teste

Um truque que economiza horas: force o jogo a usar uma API gráfica mais simples ou uma resolução menor, só para ver se o problema some. Muitos títulos aceitam argumento direto nas opções de launch:

```bash
PROTON_USE_WINED3D=1 %command%
```

Essa variável desliga o DXVK e obriga o Proton a usar o WineD3D, o tradutor Direct3D→OpenGL embutido no Wine. É **mais lento**, então não é solução — é diagnóstico. Se com `PROTON_USE_WINED3D=1` o jogo abre (mesmo lerdo), o culpado é o DXVK/GPU; se continua preto, o problema é outro, mais fundo.

```terminal
$ PROTON_USE_WINED3D=1 PROTON_LOG=1 ls ~ | grep steam-
steam-405100.log
$ grep -i 'wined3d\|dxvk\|opengl' ~/steam-405100.log | head
info:  WineD3D: Using OpenGL renderer
info:  OpenGL vendor: Mesa
```

A linha `Using OpenGL renderer` confirma que o caminho OpenGL foi ativado, isolando o DXVK da equação.

## Resumo

- Tela preta indica falha de renderização do primeiro quadro; crash indica falha anterior, visível no log.
- `DXVK_ASYNC=1` evita travas de compilação de shader, mas só no Proton GE em versões modernas.
- `vulkaninfo --summary` e `vkcube` confirmam se a GPU foi detectada pelo Vulkan.
- `0xc0000005` no log é violação de acesso; a primeira suspeita é a versão do Proton.
- `PROTON_USE_WINED3D=1` é ferramenta de diagnóstico, não solução de desempenho.
- Trocar para Proton GE resolve uma ampla gama de problemas de renderização e codecs.

## Exercícios

1. Rode `vulkaninfo --summary 2>/dev/null | grep deviceName` no seu Deck e registre qual dispositivo Vulkan aparece.
2. Ative `PROTON_LOG=1`, force o jogo problemático e cheque o `tail -30` do log. Ele fecha com `Unhandled exception` ou com erro de `D3D11`/`VkDevice`?
3. Teste `PROTON_USE_WINED3D=1 %command%` num jogo que abre tela preta e confirme no log se o renderizador virou OpenGL. O jogo abriu?
4. Instale o Proton GE via ProtonUp-Qt e selecione-o para um título com tela preta. Compare o comportamento com e sem `DXVK_ASYNC=1`.
5. **Desafio.** Monte um experimento controlado: mesmo jogo, quatro condições (Proton estável com DXVK, estável com WineD3D, GE sem async, GE com async) e registre, para cada uma, o sintoma e a linha-chave do log. Relacione cada sintoma à camada responsável.

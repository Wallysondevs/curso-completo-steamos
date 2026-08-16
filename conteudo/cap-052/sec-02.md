Existe um tipo de romset que não é jogo e, ainda assim, costuma ser a causa número um de "o jogo abre e fecha na hora". É a BIOS: o firmware de sistema que rodava na placa antes do jogo propriamente dito. Placas como Neo Geo, Sega System 16, Irem ou as da Capcom CPS-2 dependiam de um chip de boot que inicializava o hardware e, em alguns casos, decodificava os dados. Sem ele, o jogo tem os dados gráficos e de som, mas não tem quem ligue a máquina.

:::objetivos
- Entender o papel da BIOS em placas de arcade
- Identificar quais jogos dependem de BIOS e quais são autocontidos
- Localizar e instalar corretamente os arquivos de BIOS no RetroArch
- Diagnosticar erros causados por BIOS ausente ou errada
- Reconhecer BIOS regionais e como alterná-las
:::

## O que a BIOS faz na placa

Nos consoles domésticos a BIOS fica embutida no aparelho e você nunca pensa nela. No arcade, a situação se inverte: o operador comprava a placa com o firmware já gravado, e os cartuchos (como no Neo Geo MVS) ou as placas-filhas (como nos jogos CPS-2) traziam só o jogo. Como o emulador simula o hardware inteiro, ele precisa que você forneça **também** esse firmware — separado.

:::info
**BIOS** (*Basic Input/Output System*) aqui é o firmware de inicialização da placa, não o BIOS de PC. No contexto de emulação de arcade, o termo é usado para qualquer ROM de sistema obrigatória fornecida como romset auxiliar.
:::

O romset da BIOS segue as mesmas regras de qualquer outro: é um `.zip` com *short name* específico, cujos arquivos internos precisam bater o CRC esperado pelo núcleo.

## As BIOS mais comuns e seus short names

A tabela abaixo resume as dependências que você vai encontrar com mais frequência no RetroArch.

| Short name | Placa / família | Quem precisa |
|---|---|---|
| `neogeo` | Neo Geo (MVS/AES) | Todos os jogos Neo Geo em MAME e FBNeo |
| `qsound` | Capcom CPS-2 (som QSound) | Jogos CPS-2, para o áudio |
| `cpzn1` / `cpzn2` | Capcom ZN-1 / ZN-2 | Jogos baseados em hardware de PS1 |
| `pgm` | IGS PolyGame Master | Jogos PGM (Knights of Valour, etc.) |
| `skns` | Super Kaneko Nova System | Jogos Gals Panic etc. |
| `konamigv` | Konami GX | Jogos Konami de laser |

Algumas famílias, como as placas Capcom CPS-1, são completamente autocontidas e **não** pedem BIOS: o jogo traz tudo embutido.

## Onde colocar e como conferir

O RetroArch centraliza as BIOS no diretório `system/`, mas os núcleos de arcade também aceitam que elas fiquem **na mesma pasta das ROMs**. O comportamento depende do núcleo e da opção "system files in content directory". O caminho mais à prova de erro é colocar o `.zip` da BIOS junto dos jogos.

```terminal
$ ls -la ~/lab/arcade/
-rw-r--r--  ana  2.8M  neogeo.zip
-rw-r--r--  ana  12M  mslug.zip
-rw-r--r--  ana  7.1M  sfa3.zip
```

Quando a BIOS está no lugar e íntegra, o jogo carrega sem mensagens. Quando não está, o núcleo costuma reportar no log o arquivo exato que faltou — é o melhor ponto de partida para o diagnóstico.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i -E "bios|missing|required"
[libretro ERROR] mslug: required system rom neogeo.zip not found
[libretro ERROR] mslug: sm1.sm1 (CRC xxxx) not found in neogeo.zip
```

A mensagem aponta dois níveis: o romset `neogeo.zip` ausente e, dentro dele, o arquivo `sm1.sm1` que faltou. Esse segundo nível é o que pega: ter um `neogeo.zip` qualquer não basta, ele precisa conter os arquivos exatos que o jogo pede.

## BIOS regionais e a chave do Neo Geo

Algumas BIOS têm variantes por região: o Neo Geo, por exemplo, tinha versões japonesa, europeia e americana, além de uma opção "Universe BIOS" criada pela comunidade que destrava seleção de região, modo arcade/console e *dip switches* em tempo real.

O FBNeo e o MAME tratam a seleção de região de formas ligeiramente diferentes. No FBNeo, a opção fica dentro das *Core Options* do próprio núcleo; no MAME libretro, costuma ficar nas opções de BIOS.

```terminal
$ flatpak run org.libretro.RetroArch 2>&1 | grep -i "neogeo bios"
[INFO] neogeo: bios options: use default, japan, europe, usa, unibios
```

:::dica
Para a maioria dos jogos Neo Geo, a **UniBIOS** é a escolha mais confortável: permite alternar região e entre os modos MVS (fliperama) e AES (console doméstico) sem trocar de arquivo, além de liberar trapaças e painel de serviço.
:::

## Resumo

- BIOS de arcade é firmware de sistema fornecido como romset auxiliar, não um jogo.
- `neogeo.zip` é a dependência mais comum, exigida por todos os jogos da família Neo Geo.
- Colocar a BIOS na mesma pasta das ROMs é o caminho mais confiável no RetroArch.
- O log do núcleo aponta tanto o romset ausente quanto o arquivo interno que faltou.
- BIOS regionais (e a UniBIOS) permitem alterar região e modo de operação.

## Exercícios

1. Execute um jogo Neo Geo sem o `neogeo.zip` e leia o log verbose; anote o arquivo interno que o núcleo reclamou.
2. Liste o conteúdo de um `neogeo.zip` com `unzip -l` e identifique o arquivo `sm1.sm1` e o `sfix.sfix`, explicando a função de cada um.
3. Compare o CRC de um `neogeo.zip` que você tem com o esperado pela versão do seu núcleo e diga se são compatíveis.
4. Confira, na tabela da seção, quais jogos suas ROMs exigem BIOS e separe as pastas de "autocontidos" e "dependem de BIOS".
5. **Desafio.** Configure um jogo CPS-2 (que usa QSound) e explique por que o áudio falha silenciosamente quando `qsound.zip` está errado, enquanto o vídeo continua funcionando normalmente.

Todo emulador standalone pede uma coisa antes de rodar jogo algum: os arquivos de sistema do console original. São a BIOS, o firmware e, dependendo da plataforma, chaves de criptografia ou fontes internas. Sem eles, o emulador nem inicia; com os arquivos errados, ele inicia e falha de forma confusa. Esta seção organiza o que cada emulador exige e onde colocar cada coisa num Steam Deck, porque metade dos problemas de "o jogo não abre" se resolve aqui, antes de qualquer ajuste de vídeo.

:::objetivos
- Entender por que emuladores exigem arquivos do console original
- Identificar quais arquivos cada emulador deste capítulo pede
- Saber os diretórios corretos de BIOS/firmware no SteamOS
- Obter os arquivos legalmente a partir do seu próprio hardware
- Diagnosticar o erro clássico de BIOS ausente ou incorreta
:::

## Por que o emulador não vem completo

Um emulador é uma reimplementação do hardware; os arquivos que a máquina original embarcava — a BIOS do PS2, o firmware do PS3, as keys (chaves criptográficas) do Wii — são software proprietário da Sony, Nintendo ou Microsoft. Por isso nenhum emulador pode distribuí-los junto. Essa separação é o que mantém os projetos longe de processos judiciais e obriga você a extrair esses arquivos do seu próprio console.

A regra de ouro: **dumpe da sua máquina ou do seu disco**. Baixar BIOS pronta da internet é violação de copyright e, fora isso, costuma vir corrompida ou renomeada de forma errada, gerando bugs difíceis de rastrear.

## O que cada emulador pede

| Emulador | Arquivo(s) exigido(s) | Pasta típica |
|---|---|---|
| PCSX2 | BIOS do PS2 (ex.: `SCPH-70012.bin`) | `~/.var/app/net.pcsx2.PCSX2/config/PCSX2/bios/` |
| Dolphin | Nenhum obrigatório (IPL opcional p/ boot do menu) | `~/.var/app/org.DolphinEmu.dolphin-emu/data/dolphin-emu/` |
| RPCS3 | Firmware do PS3 (arquivo `PS3UPDAT.PUP`) | `~/.var/app/net.rpcs3.RPCS3/config/rpcs3/dev_hdd0/` |
| Cemu | `keys.txt` e firmware/seed do Wii U | `~/.var/app/net.kuribo64.cemu/data/cemu/` |
| Xemu | BIOS de Xbox (como `mcpx_1.0.bin` + `Complex_4627.bin`) | `~/.var/app/app.xemu.xemu/data/xemu/` |
| Xenia | Nada especial (roda por cima do sistema) | — |

Repare que o Dolphin é o mais indulgente: para a maioria dos jogos ele nem exige a IPL (o "menu" do GameCube); os títulos carregam direto. O RPCS3 é o mais chato: pede o firmware completo do PS3, que precisa ser instalado **por dentro do emulador**, e não simplesmente copiado para uma pasta.

:::atencao
No SteamOS, os caminhos acima são os do Flatpak, dentro de `~/.var/app/`. Tutoriais de Windows e Linux comum citam pastas como `C:\...` ou `~/.config/PCSX2`, que **não existem** no seu Deck. Sempre varie o comando conforme o formato instalado.
:::

## Extraindo a BIOS do seu PS2

O método mais confiável para o PS2 é usar um *homebrew* (programa caseiro) rodando no próprio console, tipicamente via cartão de memória com Free McBoot. A ferramenta clássica é o `BIOS Dumper`, que grava uma cópia exata do firmware no pendrive.

```terminal
$ ls ~/Downloads/ps2dump/
SCPH-70012.bin
dumper.log
```

Depois de extrair, você confere a integridade pelo tamanho esperado: a BIOS de um PS2 tem cerca de 4 MB. Arquivos de poucos kilobytes são, na prática, atalhos inválidos.

```terminal
$ ls -l ~/Downloads/ps2dump/SCPH-70012.bin
-rw-r--r-- 1 ana ana 4194304 Oct 12 10:12 SCPH-70012.bin
```

O valor `4194304` equivale exatamente a 4 MiB — sinal forte de que o dump foi íntegro. Linhas de tamanho muito menor indicam gravação interrompida.

## Firmware do PS3 e keys do Wii U

O RPCS3 segue outro fluxo. Você baixa o arquivo `PS3UPDAT.PUB` do site da Sony (ou extrai do próprio PS3) e, dentro do emulador, usa *File → Install Firmware* para que ele seja expandido no diretório virtual `dev_hdd0`. Não adianta jogar o arquivo solto numa pasta qualquer: o RPCS3 precisa processar a instalação.

```terminal
$ file ~/Downloads/PS3UPDAT.PUP
PS3UPDAT.PUP: PS3 update file (version 4.90)
```

Já o Cemu pede o arquivo `keys.txt`, que contém os títulos-chave usados para decriptar jogos e updates. Ele fica na raiz da pasta de dados do Cemu e é um texto simples, uma chave por linha.

```terminal
$ head -3 ~/.var/app/net.kuribo64.cemu/data/cemu/keys.txt
D7B00402659BA2ABD2CB0DB27FA2B656 # Wii U Common Key
...
```

:::nota
Os nomes e formatos exatos desses arquivos mudam entre versões dos emuladores. Sempre confira a wiki oficial de cada projeto — a do Dolphin, do PCSX2 e do RPCS3 são mantidas com primor e listam os arquivos esperados, os hashes e o procedimento de dump. Esse é o primeiro lugar a consultar diante de qualquer erro.
:::

## O erro clássico e como diagnosticar

Quando a BIOS falta ou está no lugar errado, o sintoma mais comum no PCSX2 é a tela de seleção de BIOS vazia na primeira execução. O RPCS3 simplesmente recusa o jogo com uma mensagem sobre firmware. Em todos os casos, o log do emulador aponta o dedo para o arquivo que ele não achou.

```terminal
$ flatpak run net.pcsx2.PCSX2 2>&1 | grep -i bios
Bios Found: (0) empty
```

A linha `Bios Found: (0) empty` confirma que nenhuma BIOS foi detectada na pasta. A correção é copiar o arquivo para o diretório certo e reiniciar o emulador — ou, se o Flatpak não enxergar pastas externas, usar o `flatpak override` para dar acesso de leitura ao local onde o dump está.

## Resumo

- Emuladores não distribuem BIOS/firmware por licenciamento; você deve extrair do seu próprio hardware.
- PCSX2 exige BIOS de PS2, RPCS3 exige firmware instalado por dentro, Cemu exige `keys.txt`.
- Dolphin roda a maioria dos jogos sem a IPL; Xenia não exige arquivos extra.
- No SteamOS, os arquivos vão em `~/.var/app/` na subpasta de cada Flatpak, não nos caminhos de PC.
- Erros de BIOS se manifestam como lista vazia ou recusa de firmware, confirmáveis pelo log do emulador.

## Exercícios

1. Liste o conteúdo de `~/.var/app/` e identifique a pasta de dados onde cada emulador guardaria sua BIOS.
2. Confira o tamanho da sua BIOS de PS2 com `ls -l` e verifique se bate com os ~4 MiB esperados.
3. Abra o RPCS3 e percorra o caminho *File → Install Firmware*; anote quais arquivos ele aceita como firmware.
4. Use `grep -i bios` no log do PCSX2 e descreva o que a saída indica sobre o estado atual da BIOS.
5. **Desafio.** A wiki do Dolphin lista o *IPL dump* como opcional. Explique, a partir do que você aprendeu sobre boot no capítulo 1, por que o menu do GameCube é dispensável para rodar jogos, mas a BIOS do PS2 não é.

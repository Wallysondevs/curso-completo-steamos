O KRunner é o cérebro de busca do KDE: uma barra simples que abre com duas teclas e resolve quase qualquer coisa — abrir aplicativo, rodar comando, fazer conta, converter unidade, encontrar arquivo. Num Steam Deck, onde digitar com trackpad é lento, ele é o caminho mais curto entre o que você quer e o resultado. Vale cada minuto para dominá-lo.

:::objetivos
- Abrir e navegar no KRunner com eficiência
- Usar plugins de busca (aplicativos, comandos, cálculos, arquivos)
- Entender como o KRunner se integra ao comando `krunner`
- Personalizar a aparência e os atalhos do KRunner
:::

## O que o KRunner enxerga

O KRunner não é um único buscador: é um **executor plugável**. Cada capacidade — encontrar aplicativo, calcular, converter moeda, listar janelas abertas — é um plugin separado, e todos respondem à mesma caixa de texto. Quando você digita, ele consulta os plugins ativos e ordena os resultados por relevância.

Para ver o que está disponível no seu Deck, abra o KRunner e comece a digitar. Ou pergunte ao sistema quais plugins existem:

```terminal
$ krunner 2>&1 & 
[1] 4321
```

O comando `krunner` lança uma instância da barra de busca diretamente. Em condições normais ele já está rodando em segundo plano (um daemon), e o comando apenas traz a janela para a frente — não abre uma segunda cópia redundante. Isso é diferente de abrir pelo atalho [[Alt+F2]] apenas na forma de disparo, não no efeito.

:::info
O KRunner tem dois atalhos padrão no Plasma: [[Alt+F2]] e [[Alt+Space]]. O primeiro é o clássico do KDE; o segundo é mais confortável no Deck porque não exige contorcionismo de dedos. Você pode ter os dois ativos ao mesmo tempo — um mesmo daemon, dois gatilhos.
:::

## Buscando aplicativos e comandos

O uso mais comum é digitar o nome de um aplicativo. Digite `konsole` e o KRunner oferece abrir o terminal; digite uma palavra solta e ele sugere buscar no menu, na web ou em documentos.

```terminal
$ krunner foo
```

Mas o KRunner brilha de verdade quando você o usa como **launcher de comando**. Digite um comando diretamente e ele executa:

- `konsole` → abre o terminal
- `systemsettings kcm_keys` → abre as configurações de teclado
- `firefox https://kernel.org` → abre o site no navegador

O terceiro exemplo mostra um recurso pouco conhecido: o KRunner aceita argumentos. Passar uma URL para o atalho do navegador faz o KRunner abrir aquela página. Isso transforma a barra de busca numa linha de comando gráfica.

:::dica
Digite a abreviação de um comando e segure: o KRunner mostra o comando completo numa linha de sugestão antes de você apertar Enter. Para comandos como `systemsettings kcm_keys`, isso evita digitar o nome inteiro — comece com `sys` e escolha na lista de sugestões.
:::

## Cálculos, conversões e plugins utilitários

Além de abrir coisas, o KRunner resolve operações na hora. Os plugins de cálculo e conversão são dos mais usados e funcionam sem instalar nada:

```terminal
$ krunner "42*7"
```

Na prática você digita `42*7` e o primeiro resultado é `294`. O mesmo vale para conversões:

- `100 usd em brl` → conversão de moeda (usa taxas online)
- `1 hora em minutos` → 60
- `15 celsius em fahrenheit` → 59

A sintaxe é flexível: o KRunner interpreta linguagem natural para unidades. Isso é especialmente útil no Deck, onde digitar um zero a mais ou a menos é comum — deixar a máquina fazer a conta é mais seguro.

```terminal
$ krunner "sqrt(144)"
12
```

:::nota
A conversão de moeda depende de conexão com a internet, porque as taxas vêm de um serviço online. Sem rede, o KRunner ainda converte unidades físicas (comprimento, temperatura, tempo), mas não moeda. Vale ter isso em mente num dispositivo portátil que nem sempre está online.
:::

## Personalizando o KRunner

O KRunner é configurável: você escolhe quais plugins ficam ativos, muda o atalho e ajusta a posição da janela. Pelo painel:

```terminal
$ systemsettings kcm_krunner
```

O módulo `kcm_krunner` lista os plugins com descrições e caixas de ativação. Desligar plugins que você não usa (como "Sessões" ou "Locais") deixa os resultados mais limpos e rápidos. Também é aqui que se muda o atalho de abertura — útil se [[Alt+Space]] estiver conflitando com algum jogo.

Para quem prefere o arquivo, as preferências do KRunner vivem no `krunnerrc`:

```terminal
$ cat ~/.config/krunnerrc
[General]
FreeFloating=true
```

A chave `FreeFloating=true`, por exemplo, faz o KRunner aparecer como janela flutuante central em vez de barra colada no topo — visual mais agradável na tela pequena do Deck. Edite essas chaves com `kwriteconfig6` e reinicie o KRunner para aplicar.

:::atencao
Depois de editar `krunnerrc` à mão, o KRunner em execução pode não reler o arquivo imediatamente. Force com `kquitapp5 krunner` seguido de `krunner &` — o primeiro encerra o daemon, o segundo o relança com a nova configuração.
:::

## Resumo

- O KRunner é um executor plugável: aplicativos, comandos, cálculos e conversões numa só barra.
- Abre com [[Alt+F2]] ou [[Alt+Space]], ambos disparando o mesmo daemon.
- Aceita argumentos: `firefox https://...` abre uma URL específica no navegador.
- Resolve contas (`42*7`) e conversões (`15 celsius em fahrenheit`) sem instalar nada.
- `systemsettings kcm_krunner` gerencia plugins e atalho; `krunnerrc` guarda as preferências.
- `kquitapp5 krunner && krunner &` recarrega a configuração após edição manual.

## Exercícios

1. Abra o KRunner com [[Alt+Space]] e digite `kcm_keys` — confirme que ele localiza o módulo de teclado.
2. Use o KRunner para calcular `0.07 * 1800` e depois converta `32 celsius em fahrenheit`.
3. Abra uma página específica no navegador digitando `firefox https://store.steampowered.com` no KRunner.
4. Inspecione `~/.config/krunnerrc` e descreva o efeito de cada chave presente no arquivo.
5. **Desafio.** Desative um plugin que você nunca usa pelo `kcm_krunner`, reinicie o daemon com `kquitapp5 krunner && krunner &`, e verifique que os resultados de busca ficaram mais enxutos.

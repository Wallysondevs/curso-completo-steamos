O Proton GE, de *GloriousEggroll*, é o fork comunitário mais popular do Proton. Mantido por Thomas Crider (o "GloriousEggroll", também mantenedor do Nobara Project), ele combina os patches da Valve com correções extras que a Valve ainda não aceitou — ou que talvez nunca aceite por questões legais, como os codecs patenteados.

:::objetivos
- Entender o que o Proton GE inclui além do Proton oficial da Valve
- Identificar por que certos codecs e patches não entram no Proton oficial
- Baixar e instalar uma versão do Proton GE via terminal
- Registrar a versão no diretório `compatibilitytools.d`
:::

## O que o GE acrescenta

O Proton GE é essencialmente o Proton da Valve com uma camada a mais. Ele incorpora commits do Wine *upstream* ainda não liberados, builds mais recentes do DXVK e do VKD3D-Proton, e correções específicas para jogos que a Valve não priorizou. O principal diferencial prático, porém, são os **codecs patenteados**.

Muitos jogos japoneses — sobretudo visual novels e RPGs com vídeos de abertura — usam o codec de vídeo WMV (Windows Media Video) ou o áudio AAC em situações específicas. Esses codecs carregam patentes e royalties, então a Valve não pode distribuí-los legalmente em todos os países onde o Steam opera. O Proton GE, mantido por uma pessoa física fora da Valve, inclui essas bibliotecas.

A consequência visível é concreta: um jogo que no Proton oficial abre com uma tela preta no lugar do vídeo de abertura, ou com as cenas pré-renderizadas sem som, costuma exibir esses vídeos normalmente no GE, porque o codec que faltava passa a existir. Se você nunca reparou nisso, é porque a maioria dos jogos ocidentais usa H.264 ou VP9 — codecs que a Valve já distribui — enquanto uma fração dos títulos japoneses insiste em formatos proprietários mais antigos.

```terminal
$ ls ~/.steam/steam/compatibilitytools.d/
GE-Proton9-23
```

:::info
A numeração do GE é independente da Valve. `GE-Proton9-23` significa a 23ª build do GE baseada na linha do Proton 9. O número sobe com frequência — não estranhe ver versões na casa das dezenas, pois o Crider publica builds novas quase toda semana.
:::

## O que o GE não é

Antes de instalar, é importante alinhar expectativas. O Proton GE **não** é mais rápido que o oficial na maioria dos jogos — as diferenças de desempenho são marginais e concentradas em títulos com problemas específicos. Ele também não passa pelo mesmo processo de QA da Valve, então uma build nova pode regredir onde a anterior funcionava.

- Use o GE **quando um jogo não funciona** no Proton oficial (vídeo quebrado, tela preta, crash)
- Não use o GE por padrão, para tudo
- Guarde a versão anterior ao testar uma nova, pois regressões acontecem

## Instalando pelo terminal

A forma mais direta é baixar o tarball do GitHub e extraí-lo em `compatibilitytools.d`:

```terminal
$ mkdir -p ~/.steam/steam/compatibilitytools.d
$ cd ~/.steam/steam/compatibilitytools.d
$ curl -LO "https://github.com/GloriousEggroll/proton-ge-custom/releases/download/\
> GE-Proton9-23/GE-Proton9-23.tar.gz"
$ tar -xzf GE-Proton9-23.tar.gz && rm GE-Proton9-23.tar.gz
$ ls na pasta
GE-Proton9-23
```

Depois de extrair, é obrigatório reiniciar o Steam para que ele detecte a nova ferramenta de compatibilidade. Sem reiniciar, o menu Propriedades → Compatibilidade não mostra a versão recém-instalada.

Se reiniciar o Steam é inconveniente (por exemplo, porque há downloads em andamento que você não quer pausar), existe um truque: matar apenas o processo `steamwebhelper` força o cliente a redescobrir as ferramentas de compatibilidade sem interromper os downloads. O comando `pkill -f steamwebhelper` seguido de alguns segundos de espera costuma bastar, embora o caminho oficial e garantido continue sendo o reinício completo.

```terminal
$ journalctl -u steam --since "1 min ago" | grep -i compat
Mar 18 15:01:33 steamdeck steam[1241]: Discovered compatibility tool: GE-Proton9-23
```

:::atencao
A ferramenta **ProtonUp-Qt** automatiza exatamente esse processo com uma interface gráfica e pode ser instalada no SteamOS pelo Discover. Se você prefere não mexer com `curl` e `tar`, é o caminho mais seguro. O resultado final é o mesmo: uma pasta nova dentro de `compatibilitytools.d`.
:::

Existe ainda um projeto que melhora o áudio de vídeos pré-renderizados em vários jogos, mas isso foge ao escopo desta seção — [veja a seção sobre codecs e compatibilidade de mídia](#/cap-038/sec-07) para entender onde cada componente se encaixa.

Vale reforçar que o GE está disponível para qualquer distribuição Linux com Steam, não só para o SteamOS. A pasta `compatibilitytools.d` é um recurso do próprio cliente Steam, então o procedimento desta seção funciona igual no Ubuntu, no Arch ou no Fedora. No SteamOS, porém, há uma vantagem extra: o filesystem `~/` é persistente entre atualizações do sistema, então uma versão GE instalada continua disponível mesmo depois de um update grande do SteamOS, ao contrário do que acontece com ferramentas instaladas no sistema imutável.

## Resumo

- O Proton GE é o fork comunitário de GloriousEggroll, baseado no Proton da Valve com patches extras.
- Seu principal diferencial são codecs patenteados (WMV, AAC) que a Valve não pode distribuir.
- A numeração é independente (`GE-Proton9-23` = 23ª build da linha 9).
- O GE não é mais rápido por padrão; use-o apenas quando o jogo quebra no oficial.
- A instalação é manual, em `compatibilitytools.d`, e exige reiniciar o Steam.

## Exercícios

1. Liste o diretório `~/.steam/steam/compatibilitytools.d` e verifique quais versões do GE você já tem.
2. Instale uma versão do GE pelo terminal usando `curl` e `tar`, conforme o passo a passo da seção, e reinicie o Steam.
3. Confirme no `journalctl -u steam` a mensagem `Discovered compatibility tool` para a versão recém-instalada.
4. Teste um jogo com cenas de vídeo (visual novel ou RPG japonês) na Stable e depois no GE; registre se o vídeo quebrado foi corrigido.
5. **Desafio.** Instale duas versões do GE lado a lado (ex.: `-23` e `-25`), migre apenas um jogo problemático para a nova e valide que os demais continuam na antiga antes de apagar a versão velha.
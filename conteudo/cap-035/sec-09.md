Ao longo deste capítulo você viu nove categorias de aplicativos, cada uma brilhando isoladamente no Steam Deck. Mas o valor real aparece quando elas trabalham juntas — e o habilitador silencioso de tudo isso é o dock. Com um dock USB-C (o oficial da Valve ou um hub compatível), o Deck deixa de ser um portátil e vira uma estação de trabalho completa: monitor, teclado, mouse, mesa digitalizadora, armazenamento externo e múltiplos periféricos num clique.

:::objetivos
- Configurar o dock e um monitor externo como estação de trabalho criativa
- Encadear captura, edição, ilustração e render num fluxo integrado
- Gerenciar o armazenamento e a organização dos projetos criativos
- Entender os limites térmicos e de desempenho da APU em uso prolongado
:::

## O dock como estação de trabalho

O dock resolve a principal limitação do Deck para trabalho criativo: a tela pequena e a falta de periféricos. Com ele conectado, você tem:

- **Saída de vídeo HDMI/DisplayPort** para monitor externo (até 4K60 ou 8K, dependendo do dock);
- **Portas USB-A** para teclado, mouse, mesa digitalizadora e armazenamento;
- **Ethernet** para rede cabeada (importante para subir vídeos grandes);
- **Alimentação** — o dock passa energia, então o Deck carrega enquanto trabalha.

A detecção do monitor externo é automática. Vá em Configurações do sistema → Tela e monitor para escolher a disposição (espelhado ou estendido) e a resolução nativa do monitor. Para trabalho criativo, use o monitor como tela principal e desligue ou use a tela do Deck como secundária para referências.

```terminal
$ ls /sys/class/drm/ | grep -E 'card[0-9]-'
card0-DP-1
card0-eDP-1
```

`card0-DP-1` é a saída DisplayPort/HDMI (o monitor externo) e `card0-eDP-1` é a tela interna do Deck (`eDP` = embedded DisplayPort). Ver esses dois conectores confirma que o sistema enxerga as duas saídas.

:::dica
Para acompanhar a temperatura e o clock da APU durante tarefas pesadas (render no Blender, export no Kdenlive, stream no OBS), use o `nvtop` ou a sobreposição do próprio Steam no modo Gaming. O `sensors` também mostra a temperatura dos núcleos:

```terminal
$ flatpak install io.github.syllo.nvtop
$ nvtop
```
:::

## Um fluxo criativo integrado

Vejamos um cenário real que amarra tudo o que este capítulo ensinou. Suponha que você quer produzir um vídeo sobre um desenho seu, publicado no YouTube:

1. **Krita (seção 4):** esboce e pinte a arte numa mesa digitalizadora conectada ao dock. Salve o `.kra` e exporte um `.png` de capa.
2. **Spectacle (seção 7):** capture a tela do processo em etapas — 5 a 6 capturas anotadas com setas do esboço à arte final.
3. **OBS Studio (seção 8):** grave o time-lapse da pintura, com a fonte "Captura de Janela" apontando para o Krita, usando o encoder AMD para não pesar.
4. **Blender (seção 5):** renderize uma abertura 3D simples com o título do vídeo, em Cycles com 64 samples.
5. **Kdenlive (seção 6):** monte tudo na timeline — abertura 3D, as capturas do Spectacle como slides, o time-lapse do OBS — e exporte a 1080p.
6. **VLC (seção 1) ou Kodi (seção 2):** confira o resultado final em tela cheia antes de publicar.

Nenhum desses passos exige outro computador. O Deck, no dock, executa a cadeia inteira da concepção à publicação.

## Organização e armazenamento dos projetos

Projetos criativos geram arquivos grandes e variados: `.kra` dezenas de megabytes, `.blend` com texturas, vídeos de gigabytes. Sem organização, o SSD de 512 GB (ou 1 TB) enche rápido. Uma estrutura mínima que funciona:

```terminal
$ mkdir -p ~/Projetos/{artes,render,edicao-video,gravacoes,capturas}
$ ls -d ~/Projetos/*
/home/deck/Projetos/artes
/home/deck/Projetos/artes/render
/home/deck/Projetos/capturas
/home/deck/Projetos/edicao-video
/home/deck/Projetos/gravacoes
```

Regras práticas que evitam dor de cabeça:

- **Separe fontes de produtos.** Arquivos de origem (`.kra`, `.blend`, clipes brutos) e resultados exportados (`.png`, `.mp4`) em pastas diferentes. Você raramente precisa dos intermediários depois de publicado.
- **Use o microSD para arquivos frios.** Projetos finalizados e clipes brutos antigos podem morar no cartão microSD, liberando o SSD para jogos e o sistema.
- **Monitore o espaço.** O comando `df -h` mostra o uso de cada partição; `du -sh ~/Projetos/*` mostra o peso de cada subpasta.

:::atencao
Excluir o arquivo de origem depois de publicar é irreversível — se você só guardou o MP4 exportado, não consegue mais editar o projeto, corrigir um erro ou reexportar em outra resolução. Antes de apagar `.kra`, `.blend` ou clipes de vídeo, pergunte-se: "se eu precisar mudar algo daqui a seis meses, vou conseguir?" Arquive no microSD em vez de apagar.
:::

## Limites térmicos e de desempenho em uso longo

O Deck não foi projetado para render de horas seguidas, mas aguenta — com ressalvas. A APU opera num envelope térmico de até 15 W (sustentável) com picos de 25 W por curtos períodos. Tarefas como render no Blender ou export no Kdenlive mantêm os quatro núcleos em 100% por minutos, elevando a temperatura para a faixa de 85–95 °C.

O comportamento esperado sob carga prolongada:

- **Thermal throttling:** quando a temperatura se aproxima do limite (100 °C), o sistema reduz o clock para evitar danos. O render fica mais lento, não mais quente.
- **Barulho da ventoinha:** normal em carga alta. Se o Deck estiver em cima da mesa, deixe a saída de ar (parte de cima) desobstruída.
- **Bateria:** em uso pesado no dock, o consumo pode exceder o que a fonte fornece em cargas extremas com hubs sem alimentação própria. Use sempre a fonte original do Deck, de 45 W.

```terminal
$ sensors | grep -E 'Tctl|Tccd|edge|Composite'
Tctl:         +88.0°C
Tccd1:        +87.0°C
```

`Tctl` (control temperature) é a leitura agregada da APU. Na faixa de 85–90 °C sob carga total, o sistema está dentro do esperado — quente, mas seguro. Acima de 95 °C por períodos longos, reduza a carga (menos samples no Cycles, proxies no Kdenlive, bitrate menor no OBS).

:::info
Se o trabalho criativo virar rotina diária, considere um **cooling pad** (base com ventoinhas) sob o Deck, ou posicione-o em pé com o suporte para melhorar a circulação de ar. São soluções baratas que reduzem alguns graus em cargas prolongadas e dão folga ao throttling.
:::

## Resumo

- Com dock + monitor + periféricos, o Deck vira uma estação de trabalho criativa completa.
- Um fluxo integrado usa Krita, Spectacle, OBS, Blender, Kdenlive e VLC/Kodi em sequência, sem outro computador.
- Organize projetos em pastas separadas por tipo e arquive arquivos pesados no microSD; monitore com `df -h` e `du -sh`.
- Nunca apague arquivos de origem após publicar; arquive antes de abrir mão de um projeto.
- Sob carga prolongada, a APU atinge 85–95 °C com throttling responsivo; use a fonte de 45 W e deixe a ventilação livre.

## Exercícios

1. Conecte o Deck ao dock e a um monitor externo. Configure a disposição da tela (estendido) e confirme os dois conectores de vídeo com `ls /sys/class/drm/ | grep 'card0-'`.
2. Crie a estrutura de pastas sugerida (`~/Projetos/{artes,render,edicao-video,gravacoes,capturas}`) e mova qualquer arquivo criativo que você tenha para o lugar correto.
3. Monitore a temperatura da APU com `sensors` enquanto você roda uma tarefa pesada (um render no Blender ou um export no Kdenlive). Registre a temperatura máxima observada.
4. Produza uma peça simples usando pelo menos três aplicativos do capítulo em cadeia (ex.: desenhe no Krita, capture com Spectacle e monte no Kdenlive). Publique o resultado na pasta `~/Projetos/edicao-video`.
5. **Desafio.** Crie um "mini-pipeline" completo: arte no Krita → abertura 3D no Blender → time-lapse com OBS → montagem com Kdenlive → conferência no VLC. Documente o tempo de cada etapa e identifique qual delas é o gargalo. Que ajuste (proxies, menos samples, encoder por hardware) reduziria o tempo total?
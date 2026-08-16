Este capítulo é diferente dos anteriores: ele não ensina um tema novo, ele te dá um mapa curto para sair de qualquer encrenca. Quando o Deck trava, some o Wi-Fi, o disco enche ou o jogo vira um slideshow, a última coisa que você quer é folhear 100 capítulos procurando o parágrafo certo. Aqui, cada seção é uma tabela **sintoma → causa provável → comando ou passo de solução**, organizada para você encontrar o caminho em segundos.

O diferencial em relação ao capítulo sobre método de diagnóstico é a velocidade: lá você aprendeu a *pensar* como quem investiga; aqui você *consulta* como quem precisa resolver agora. As duas abordagens se complementam. Quando a tabela resolve em uma linha, ótimo; quando não resolve, a causa provável aponta para o capítulo onde o tópico foi tratado em profundidade.

:::objetivos
- Consultar rapidamente a causa provável de um sintoma pela tabela de cada área
- Executar o comando de diagnóstico correto sem decorar sintaxe
- Saber interpretar a pista que cada sintoma esconde sobre o subsistema defeituoso
- Reconhecer quando um problema exige procedimento de emergência em vez de ajuste fino
- Navegar entre este índice e os capítulos aprofundados sem se perder
:::

## Como usar este capítulo

As tabelas seguem sempre o mesmo formato de três colunas: **Sintoma** (o que você percebe), **Causa provável** (a explicação mais frequente, na ordem de probabilidade) e **Solução** (o comando ou a sequência de passos). Leia a coluna da esquerda de cima para baixo até encontrar algo parecido com o que está acontecendo; depois siga a linha até a direita.

Algumas regras de leitura que valem para todas as seções:

- **A primeira causa da tabela é a mais comum.** Se o sintoma tem quatro causas, elas estão ordenadas da mais para a menos provável. Teste nessa ordem.
- **`sudo` é obrigatório** quando o comando mexe em arquivos do sistema ou em `/sys`. Os exemplos já incluem quando necessário.
- **Reinicie entre tentativas que mexem em kernel ou drivers.** Muitos problemas somem com um reboot limpo e voltam se você apenas recarregou o serviço.
- **Use `journalctl` como segunda opinião.** Toda área tem um serviço que loga o que deu errado; a seção 9 mostra como cruzar todas as pistas.

```terminal
$ sudo dmesg -T | tail -30
[Sat Aug  9 14:02:11 2025] wlan0: deauthenticating from ... (Reason: 6=CLASS2_FRAME_FROM_NONAUTH_STA)
[Sat Aug  9 14:02:19 2025] BTRFS warning (device nvme0n1p8): csum failed root 256 inode 41984 off 0
```

O trecho acima — que você verá expandido na seção 2 — é o tipo de pista que transforma um "não sei o que é" em "vou olhar a seção X". Aprenda a ler `dmesg` como um talão de ocorrências: o último bloco quase sempre descreve o problema mais recente.

:::dica
Imprima ou salve a **tabela consolidada da seção 9** no seu celular. Quando o Deck travar a ponto de não deixar você abrir o navegador, ter a tabela fora do aparelho é a diferença entre resolver em 2 minutos e ficar preso.
:::

## O que este índice resolve — e o que ele não resolve

Este capítulo cobre os **problemas de operação**: coisas que quebram no uso diário por configuração, atualização, falha de driver ou esgotamento de recurso. Ele é um atalho, não um substituto da investigação.

Ele **não** cobre, por exemplo, dano físico de hardware (tela rachada, ventoinha com rolamento gasto, bateria estufada) — esses casos estão nos capítulos de reparo e manutenção física do curso. Tampouco cobre decisões de projeto (qual handheld comprar) ou otimização proativa (como tirar mais FPS de um jogo que já funciona). A regra de ouro para saber se você está no lugar certo:

- O aparelho **funcionava e parou** → índice rápido (este capítulo).
- O aparelho **nunca fez o que você quer** → capítulo de configuração daquele recurso.
- O aparelho **caiu, molhou ou esquenta demais fisicamente** → capítulo de reparo e manutenção.

## As nove áreas do índice

Cada uma das próximas seções agrupa sintomas por subsistema, de modo que você chega na tabela certa sem adivinhar:

1. **Boot e inicialização** — não liga, tela preta, boot loop, trava no logo.
2. **Rede** — Wi-Fi sumiu, Bluetooth não pareia, internet lenta.
3. **Desempenho** — FPS caiu, throttling, aquecimento, stutter.
4. **Controles** — drift, botão morto, touchpad errático, giroscópio.
5. **Armazenamento** — disco cheio, microSD corrompido, jogos sumiram.
6. **Áudio e vídeo** — sem som, tela distorcida, saída HDMI/USB-C.
7. **Atualizações e pacotes** — update quebrou, flatpak não abre, pacman travou.
8. **Modo Desktop** — Plasma travou, periféricos não reconhecidos, modo x11/wayland.
9. **Consolidada + emergência** — todas as tabelas num só lugar e o fluxograma de resgate.

Cada seção também aponta, na última linha de cada tabela ou num bloco `:::nota`, para os capítulos do curso onde aquele subsistema foi detalhado — para você aprofundar quando o sintoma for raro ou a causa não bater com o padrão.

:::atencao
Antes de aplicar qualquer solução que envolva `sudo`, **faça backup dos seus saves e dados importantes**. Este capítulo prioriza soluções conservadoras, mas um comando executado no lugar errado (por exemplo, `mkfs` na partição de dados em vez de no microSD) é irreversível.
:::

## Resumo

- Este capítulo é um mapa sintoma → causa → solução, organizado em nove tabelas por subsistema.
- As causas dentro de cada tabela estão ordenadas da mais para a menos provável.
- `dmesg` e `journalctl` são as ferramentas-âncora para confirmar qualquer diagnóstico.
- O índice cobre problemas de operação, não dano físico nem decisões de projeto.
- O problema que "funcionava e parou" é o caso clássico deste capítulo; o que "nunca funcionou" pertence aos capítulos de configuração.

## Exercícios

1. Pense no último problema que você teve com o Steam Deck e procure-o nas tabelas das seções seguintes. Em qual seção ele está? A causa provável listada bate com o que você descobriu na prática?
2. Execute `sudo dmesg -T | tail -30` agora mesmo. Leia cada linha e tente mapear os erros (se houver) para uma das nove áreas deste índice.
3. Em cada uma das seções a seguir, anote qual é o "comando-âncora" (o primeiro comando de diagnóstico que resolve ou redireciona a maioria dos casos). Compare com o que você usaria por instinto.
4. **Desafio.** Crie um arquivo `~/lab/meu-indice.md` copiando as três linhas de tabela que você mais usa. Adicione, para cada uma, a sua própria observação sobre o que funcionou (ou não) no seu aparelho. Depois de um mês de uso, revise e veja se as causas prováveis batem com a sua realidade.

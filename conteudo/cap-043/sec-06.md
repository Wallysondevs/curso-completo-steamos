A Amazon Prime Gaming distribui jogos todo mês para assinantes Prime — e muitos deles são resgatáveis na GOG, na Epic ou como instaladores diretos da Amazon. O Steam Deck não tem cliente Amazon Games, mas com Heroic, Lutris e algumas manobras de navegador, você monta uma biblioteca paralela que cresce todo mês sem gastar um centavo além da assinatura Prime.

:::objetivos
- Resgatar jogos mensais da Prime Gaming pelo navegador do Steam Deck
- Identificar qual plataforma cada jogo usa (GOG, Epic, Amazon Games)
- Instalar jogos Amazon Games com o Lutris e o Legendary
- Lidar com o launcher da Amazon Games App via Proton
- Automatizar o resgate mensal com scripts e lembretes
:::

## O modelo Prime Gaming: três caminhos

A Prime Gaming não é uma loja unificada — é um portal de resgate que distribui chaves para outras plataformas. Cada jogo da lista mensal segue um de três caminhos:

1. **Chave GOG** — você recebe um código que resgata no site da GOG. Depois de resgatado, o jogo aparece na sua biblioteca GOG. Instale via Heroic ou Lutris.
2. **Chave Epic Games Store** — link direto para resgate na Epic. O jogo vai para sua conta Epic. Instale via Heroic.
3. **Amazon Games App** — jogo exclusivo do launcher da Amazon. Baixa via instalador próprio da Amazon e roda com Proton.

```terminal
$ ls ~/Downloads/amazon/
prime-gaming-december-2025.txt    hollow-knight-amazon.exe
```

O primeiro passo é sempre o navegador: acesse [gaming.amazon.com](https://gaming.amazon.com), faça login com sua conta Amazon e veja a lista de jogos disponíveis no mês.

:::dica
Use o Firefox ou Chrome no Modo Desktop do Steam Deck. O site da Prime Gaming funciona bem no Firefox. Adicione a página como atalho na Steam para acessar rapidamente todo mês — assim você não esquece de resgatar os jogos.
:::

## Resgatando e instalando chaves GOG

A maioria dos jogos da Prime Gaming vem como chave GOG. O fluxo:

1. No site da Prime Gaming, clique em "Resgatar" no jogo desejado
2. Copie o código GOG exibido
3. Acesse [gog.com/redeem](https://www.gog.com/redeem), cole o código e confirme
4. O jogo aparece na sua biblioteca GOG
5. No Heroic, faça login na GOG e o jogo estará disponível para instalar

```terminal
$ legendary list-games --platform gog
Available GOG games:
  * Hollow Knight (1207664643)
  * Dead Cells (1428404963)
  * The Falconeer (1956875390)
```

Se estiver usando o Lutris, o fluxo é o mesmo — o Lutris sincroniza com sua conta GOG e mostra os novos jogos automaticamente.

:::atencao
Códigos GOG expiram. Cada chave tem uma data de validade impressa na página de resgate da Prime Gaming. Resgate no mesmo mês em que o jogo é oferecido para não perder. Você pode resgatar pelo celular também — a chave GOG fica vinculada à sua conta, não ao dispositivo.
:::

## Resgatando jogos da Epic via Prime Gaming

Alguns jogos da Prime Gaming são resgatados diretamente na Epic Games Store. O processo é similar: você clica em "Resgatar" na Prime Gaming e é redirecionado para a Epic, onde precisa confirmar a vinculação de contas (uma vez só). Depois de vinculadas, jogos futuros da Epic são resgatados com um clique.

No Steam Deck, o Heroic detecta os novos jogos na próxima sincronização:

```terminal
$ legendary list-games
Available games:
  * Star Wars: Squadrons (abc123...)
  * Fallout: New Vegas (def456...)
  * [... + 3 novos jogos da Prime Gaming resgatados hoje]
```

## Amazon Games App via Proton

Para jogos exclusivos do launcher Amazon Games (sem chave GOG nem Epic), a única opção é instalar o próprio Amazon Games App dentro de um prefixo Proton.

O processo é similar ao do GOG Galaxy: baixe o instalador do Amazon Games App do site oficial, adicione-o como jogo não-Steam, force Proton Experimental e execute. Depois de instalado, mude o destino do atalho para o executável do launcher dentro do prefixo.

```terminal
$ find ~/.steam/steam/steamapps/compatdata/ -name "Amazon Games.exe" 2>/dev/null
/home/deck/.steam/steam/steamapps/compatdata/9876543210/pfx/drive_c/Program Files (x86)/Amazon Games/Amazon Games.exe
```

O launcher da Amazon Games é pesado (Electron) e consome cerca de 600 MB de RAM mesmo ocioso. Feche-o depois de instalar o jogo — você pode lançar o executável do jogo diretamente, sem o launcher, desde que o prefixo esteja correto.

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/9876543210/pfx/drive_c/Program\ Files\ \(x86\)/Amazon\ Games/Games/
Hollow Knight/   The Messenger/
```

Crie um atalho não-Steam separado para cada jogo Amazon, apontando diretamente para o `.exe` do jogo dentro do prefixo. Assim você evita carregar o launcher toda vez.

:::perigo
O Amazon Games App exige login periódico e pode perder a sessão. Se o jogo não abrir, lance o launcher primeiro para reautenticar. Jogos Amazon exclusivos são os mais frágeis da sua biblioteca — a Amazon pode descontinuar o launcher ou mudar a DRM a qualquer momento.
:::

## Automatizando o resgate mensal

A Prime Gaming renova os jogos toda primeira quinta-feira do mês. Para não esquecer, crie um lembrete e um script que lista as novidades:

```bash
#!/bin/bash
# check-prime.sh — verifica novos jogos Prime Gaming
echo "=== Prime Gaming — $(date +%B\ %Y) ==="
echo "Acesse: https://gaming.amazon.com"
echo ""
echo "Últimos jogos resgatados:"
cat ~/Documents/prime-gaming-resgatados.txt | tail -10
```

O resgate em si não é automatizável por script (a Amazon usa CAPTCHA e autenticação multifator), mas você pode manter um registro do que já resgatou:

```terminal
$ echo "2025-01-02: Hollow Knight (GOG)" >> ~/Documents/prime-gaming-resgatados.txt
$ echo "2025-01-02: Dead Cells (Epic)" >> ~/Documents/prime-gaming-resgatados.txt
$ cat ~/Documents/prime-gaming-resgatados.txt
2025-01-02: Hollow Knight (GOG)
2025-01-02: Dead Cells (Epic)
```

Com o tempo, esse arquivo vira um inventário da sua biblioteca Prime Gaming — útil quando você formatar o Deck e quiser reinstalar tudo.

## Resumo

- A Prime Gaming distribui jogos via chave GOG, chave Epic ou Amazon Games App — cada caminho tem seu método de instalação
- Chaves GOG são resgatadas em gog.com/redeem e instaladas via Heroic ou Lutris
- Chaves Epic são resgatadas com um clique (conta vinculada) e instaladas via Heroic/Legendary
- O Amazon Games App roda via Proton como jogo não-Steam; prefira atalhos diretos para o `.exe` do jogo depois de instalado
- Mantenha um registro `prime-gaming-resgatados.txt` para rastrear sua biblioteca

## Exercícios

1. Acesse gaming.amazon.com no Modo Desktop e resgate todos os jogos gratuitos do mês. Classifique cada um como GOG, Epic ou Amazon Games App.
2. Resgate uma chave GOG da Prime Gaming e instale o jogo via Heroic. Confirme que ele aparece na sua biblioteca GOG dentro do Heroic.
3. Instale o Amazon Games App como jogo não-Steam via Proton. Depois instale um jogo de dentro dele e crie um atalho Steam direto para o `.exe` do jogo.
4. Use `legendary list-games` para verificar se os jogos resgatados na Epic aparecem. Compare com a lista do Heroic.
5. **Desafio.** Crie um script que varre `~/.steam/steam/steamapps/compatdata/` em busca de executáveis de jogos Amazon Games instalados, gera automaticamente arquivos `.desktop` para cada um e os copia para `~/.local/share/applications/`. Teste adicionando-os à Steam.
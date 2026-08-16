O cenário mais comum de todos é o Deck e um PC gamer convivendo na mesma casa. Você joga no PC, continua no Deck, e os arquivos que realmente importam — saves, configs, uma ROM aqui, uma captura ali — precisam ir e voltar sem virarem trabalho de gerente de TI. Esta seção amarra os métodos anteriores num fluxo prático, com atenção especial a saves e à biblioteca da Steam.

:::objetivos
- Desenhar um fluxo recorrente de transferência Deck ↔ PC
- Sincronizar saves entre Deck e PC (manual e automático)
- Entender cloud saves da Steam e suas limitações
- Transferir jogos não-Steam e bibliotecas de ROMs
- Montar um cronograma de backup simples

:::

## O papel do cloud save da Steam

Para jogos da Steam, o **Steam Cloud** já sincroniza saves automaticamente entre Deck e PC — desde que o jogo o suporte e você esteja online. Verifique por jogo: página da biblioteca → "suporte a Cloud" ou no menu do jogo. É a solução de save mais simples, mas tem furos:

- Nem todo jogo suporta Cloud.
- Jogos não-Steam (GOG, Epic via Heroic, emuladores) ficam de fora.
- Saves de emulador (RetroArch, Dolphin) vivem em `~/Emulation` e não tocam a nuvem da Steam.

## Sincronizando saves de emuladores e não-Steam

Para o que a Steam Cloud não cobre, o Syncthing é o rei do "configure uma vez, esqueça":

```terminal
# compartilhar a pasta de saves entre Deck e PC
Deck:  ~/Emulation/saves   ⇄   PC: D:\saves (ou ~/saves)
```

Com o compartilhamento bidirecional ativo, qualquer save de RetroArch escrito no Deck aparece no PC em minutos, e vice-versa. Para jogos não-Steam individuais, você pode criar compartilhamentos específicos ou usar o Heroic, que tem sincronização de saves própria para GOG/Epic.

## rsync para transferências manuais e backups

Quando não quer um serviço rodando, o `rsync` sobre SSH faz o trabalho sob demanda e de forma retomável:

```terminal
# do PC: puxar a pasta de saves do Deck (backup)
$ rsync -avP deck@192.168.1.42:~/Emulation/saves/ ./backup-saves/

# do PC: empurrar ROMs para o Deck
$ rsync -avP ./roms/ deck@192.168.1.42:~/Emulation/roms/
```

Um cron no PC que roda `rsync` à noite é um backup "bom o bastante" sem dependência de serviço extra no Deck.

## Transferindo a biblioteca de jogos

Duas notas sobre jogos em si:

- **Jogos Steam**: não copie a pasta manualmente em geral; deixe o Steam baixar ou use o recurso de mover entre bibliotecas/disco. Copiar a pasta `steamapps` crua pode quebrar manifestos.
- **ROMs e não-Steam**: aqui, `rsync` ou pendrive brilham. Para bibliotecas grandes, o método físico (HD externo) costuma ganhar de qualquer rede.

```terminal
# mover um jogo Steam entre bibliotecas (no Deck, via cliente Steam)
Configurações → Armazenamento → mover o jogo para disco externo
```

## Um cronograma simples

- **Diário (automático)**: Steam Cloud + Syncthing para saves.
- **Semanal**: `rsync` de `~/Emulation/saves` e `~/Documents` para o PC/NAS/pendrive.
- **Mensal**: espelho completo de ROMs e mídia para um HD externo.

A constância importa mais que a sofisticação. Um backup semanal de saves, por simples que seja, já te salva de perder centenas de horas de progresso.

## Pontos-chave

- Steam Cloud resolve saves de jogos Steam *que o suportam*; o resto fica por sua conta.
- Syncthing sincroniza saves de emuladores e não-Steam sem você pensar.
- `rsync -avP` cobre transferências manuais e backups retomáveis.
- Não copie `steamapps` na mão; use o gerenciamento de bibliotecas do Steam.
- Para bibliotecas gigantes, mídia física (HD externo) ainda vence a rede.

## Exercícios

1. Identifique no Steam quais dos seus jogos suportam Cloud e quais não.
2. Configure o Syncthing para espelhar `~/Emulation/saves` entre Deck e PC.
3. Faça um backup manual com `rsync -avP` da pasta de saves para o PC.
4. Mova um jogo Steam para uma biblioteca em disco externo pelo cliente Steam.
5. **Desafio.** Monte um cron (no PC ou no Deck) que rode o `rsync` de saves diariamente e verifique o log.

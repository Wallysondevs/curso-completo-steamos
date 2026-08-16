Antes de qualquer operação destrutiva — reset ou reinstalação — o backup é a etapa que separa a perda definitiva de um contratempo temporário. O Steam Deck pode sincronizar saves com a nuvem da Valve, mas nem tudo sobe automaticamente: capturas de tela, configurações de emuladores, arquivos da área de trabalho e saves de jogos fora da Steam ficam apenas no aparelho. Esta seção cobre o que salvar e como, para que você possa apagar o disco sem arrependimento.

:::objetivos
- Identificar o que o Steam Cloud salva e o que fica só local
- Exportar saves e configurações de jogos não-Steam e emuladores
- Executar um backup completo do `/home/deck` com `rsync`
- Verificar a integridade do backup antes de prosseguir
:::

## O que o Steam Cloud cobre e o que não cobre

A sincronização em nuvem da Valve se aplica apenas a jogos que a implementam — e muitos títulos, especialmente indies e jogos antigos, não usam o recurso. Além disso, o Steam Cloud guarda saves, mas não configurações locais, layouts de controle, capturas de tela, nem saves de emuladores instalados via Flatpak ou manualmente.

```terminal
$ ls ~/.local/share/Steam/userdata/
12345678/
```

Cada pasta numerada dentro de `userdata` corresponde a um usuário Steam que logou no aparelho. Dentro dela, subpastas numeradas (os appIDs dos jogos) guardam saves e configurações locais. Fazendo backup dessa estrutura, você captura tudo — inclusive o que a nuvem não pega.

:::atencao
Não confie cegamente no ícone de "nuvem" ao lado do jogo na biblioteca. Entre no jogo, crie um save novo, saia e aguarde a sincronização manualmente (`Steam → Configurações → Cloud`). Só então considere o save seguro.
:::

## Mapeando o que precisa ser salvo

Além da pasta da Steam, o `/home/deck` contém configurações de sistema, temas, Flatpaks e arquivos pessoais. Mapear o que ocupa espaço e o que é crítico ajuda a decidir entre backup completo ou seletivo.

```terminal
$ du -sh ~/.[!.]* ~/* 2>/dev/null | sort -h
4.0K    /home/deck/.bashrc
8.0K    /home/deck/.config
12M     /home/deck/Downloads
45G     /home/deck/.local/share/Steam
2.1G    /home/deck/.var
```

Os diretórios `.var` (dados de Flatpaks), `.config` (configurações de aplicativos) e `Downloads` (arquivos baixados) são candidatos obrigatórios ao backup. Já `.cache` pode ser omitido — ele será regenerado pelo sistema.

:::dica
Emuladores instalados via EmuDeck guardam saves em pastas específicas dentro de `/home/deck/Emulation/`. Se você usa EmuDeck, inclua essa pasta inteira no backup; ela não tem relação com o Steam Cloud.
:::

## Backup com rsync para mídia externa

O método mais confiável é o `rsync` para um cartão microSD ou pendrive USB-C formatado como ext4 ou exFAT. O comando copia tudo preservando permissões e estrutura, e numa segunda execução sincroniza só o que mudou.

```terminal
$ mount | grep -E 'sd[a-z]|mmcblk'
/dev/sda1 on /run/media/deck/BACKUP type ext4 (rw,relatime)
$ rsync -avh --progress /home/deck/ /run/media/deck/BACKUP/home-deck/
```

A barra final em `/home/deck/` garante que o conteúdo vá para dentro do destino, não criando uma subpasta `deck` dentro de `BACKUP/home-deck/`. O `--progress` mostra o avanço e o `-a` preserva permissões, donos e timestamps.

:::nota
Se o cartão estiver formatado como exFAT (padrão de fábrica de muitos SDs), o `rsync` copia os dados mas perde permissões Unix — para arquivos normais isso não importa, mas para scripts e executáveis pode quebrar a execução após restauração. Prefira ext4 para backups.
:::

## Conferindo o backup antes de apagar

O erro clássico é rodar o `rsync`, ver a saída e assumir que tudo foi copiado. Conferir tamanho, quantidade de arquivos e abrir alguns itens críticos manualmente é o que separa um backup confiável de uma surpresa desagradável.

```terminal
$ diff <(du -sh /home/deck/) <(du -sh /run/media/deck/BACKUP/home-deck/)
45G     /home/deck/
44G     /run/media/deck/BACKUP/home-deck/
```

Uma diferença pequena é esperada (arquivos de sistema temporários, locks, sockets não copiáveis), mas uma discrepância grande pede investigação — talvez uma pasta tenha sido pulada por permissão ou o cartão esteja cheio.

```terminal
$ find /home/deck -type f | wc -l
48231
$ find /run/media/deck/BACKUP/home-deck -type f | wc -l
48210
```

A contagem de arquivos também deve ser próxima. Se faltarem milhares, revise os avisos do `rsync`: arquivos que não puderam ser lidos aparecem como `rsync: read errors`.

## Resumo

- O Steam Cloud não cobre tudo: screenshots, emuladores, configurações locais e saves de jogos sem suporte ficam só no aparelho.
- Mapeie o `/home/deck` com `du` para decidir entre backup completo ou seletivo.
- Use `rsync -avh` para mídia externa formatada como ext4; exFAT perde permissões Unix.
- Confira tamanho e contagem de arquivos com `diff` e `find | wc -l` antes de considerar o backup pronto.
- Só prossiga com o reset ou reinstalação depois de validar que os dados críticos abrem no destino.

## Exercícios

1. Liste o conteúdo da pasta `~/.local/share/Steam/userdata/` e identifique a subpasta do seu usuário.
2. Execute `du -sh ~/.[!.]* ~/*` e anote as cinco maiores pastas do seu home.
3. Faça um `rsync` de teste de uma pasta pequena (ex: `~/Downloads`) para um cartão SD e confira a integridade.
4. Compare a saída de `ls -la` entre origem e destino após o rsync: algum arquivo perdeu data ou permissão?
5. **Desafio.** Monte um script de backup que liste explicitamente o que será copiado, rode o rsync com log, e ao final imprima um resumo de tamanho e arquivos copiados — útil para repetir antes de qualquer reset futuro.
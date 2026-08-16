Nem todo save perdido foi sobrescrito por engano. Às vezes o arquivo está lá, com o nome certo, na pasta certa — mas o jogo não reconhece. O arquivo foi corrompido: um desligamento abrupto durante a escrita, um cartão microSD com setores defeituosos, um bug do jogo que escreveu zeros em 80% do arquivo. Esta seção ensina a detectar corrupção antes que o Steam Cloud sincronize o arquivo estragado para todos os seus dispositivos, e a usar checksums para ter certeza de que o backup que você guardou presta.

:::objetivos
- Detectar arquivos de save corrompidos ou truncados
- Gerar e verificar checksums com `sha256sum`
- Implementar verificação de integridade pré-sincronização
- Usar `par2` para criar códigos de correção de erros
- Recuperar saves parcialmente corrompidos
:::

## Como um save se corrompe

Um arquivo de save é escrito no disco como uma sequência de bytes. Se o processo de escrita for interrompido no meio — energia caiu, o jogo crashou, o sistema travou — o arquivo pode terminar truncado (faltando bytes no final) ou com setores contendo dados antigos de outro arquivo (no caso de mídia física defeituosa). O sistema de arquivos (ext4, Btrfs) tem journaling que protege os metadados, mas não o conteúdo do arquivo.

Os sintomas mais comuns:

- Jogo diz "save corrompido" ou "arquivo de save inválido".
- O jogo carrega o save mas você aparece em um lugar impossível do mapa.
- O jogo simplesmente não lista o save no menu de carregar.
- O Steam Cloud sincroniza normalmente (o arquivo não está vazio), mas o save não funciona.

```terminal
$ file ~/.local/share/Steam/steamapps/compatdata/1245620/pfx/drive_c/users/steamuser/Documents/Elden\ Ring/ER0000.sl2
/home/deck/.../ER0000.sl2: data
$ ls -la ~/.local/share/Steam/steamapps/compatdata/1245620/pfx/drive_c/users/steamuser/Documents/Elden\ Ring/ER0000.sl2
-rw-r--r-- 1 deck deck 149876 Abr 20 16:45 ER0000.sl2
```

O comando `file` diz "data" — o formato binário não é reconhecido pelo sistema. Não significa que está corrompido; significa que a detecção de corrupção não pode depender do sistema de arquivos. Você precisa de algo que examine o **conteúdo**.

## Checksums: a impressão digital do arquivo

Um checksum (ou hash criptográfico) é uma string de tamanho fixo calculada a partir dos bytes do arquivo. Mude um único bit, e o hash muda completamente. Comparar o hash antes e depois de uma transferência (ou antes e depois de uma sessão de jogo) detecta corrupção com precisão matemática.

```terminal
$ sha256sum ~/all-saves/proton/1245620/ER0000.sl2
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2  /home/deck/all-saves/proton/1245620/ER0000.sl2
```

Para verificar a integridade de múltiplos saves, gere um arquivo de checksums e guarde-o junto (ou separado) dos saves:

```terminal
$ find ~/all-saves/ -type f -not -name "*.sha256" -not -path "*/.stversions/*" \
    -exec sha256sum {} \; > ~/all-saves/manifest.sha256
$ head -3 ~/all-saves/manifest.sha256
a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2  /home/deck/all-saves/proton/1245620/ER0000.sl2
f9e8d7c6b5a4938271605f4e3d2c1b0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4  /home/deck/all-saves/proton/2254740/save.dat
...
```

Depois, para verificar tudo:

```terminal
$ sha256sum -c ~/all-saves/manifest.sha256 2>&1 | grep -v "OK$"
/home/deck/all-saves/proton/1245620/ER0000.sl2: FAILED
# Apenas um arquivo falhou. Investigue.
```

:::dica
Inclua a geração do `manifest.sha256` no script de backup da [seção anterior](#/cap-072/sec-07). Assim você sempre tem um snapshot dos hashes junto com os arquivos. Ao restaurar, execute `sha256sum -c manifest.sha256` e verifique se tudo bate antes de abrir qualquer jogo.
:::

## Detectando saves truncados e zerados

Dois tipos de corrupção são tão comuns que merecem detecção específica:

**Arquivo truncado:** menor que o tamanho esperado. Um save que sempre teve 149876 bytes e de repente aparece com 32768 bytes provavelmente foi truncado por um crash durante a escrita.

**Arquivo zerado:** contém apenas bytes `\x00` — resultado de o sistema alocar o inode mas nunca chegar a escrever conteúdo real (típico de desligamento forçado logo após criar o arquivo).

```terminal
$ cat check_save_integrity.sh
#!/bin/bash
SAVE_FILE="$1"
MIN_SIZE=1024  # 1 KB mínimo para um save legítimo

# 1. Tamanho mínimo
actual_size=$(stat --format='%s' "$SAVE_FILE" 2>/dev/null || echo "0")
if [ "$actual_size" -lt "$MIN_SIZE" ]; then
    echo "FALHA: $SAVE_FILE tem $actual_size bytes (< $MIN_SIZE mínimo)"
    exit 1
fi

# 2. Não pode ser só zeros
zero_bytes=$(tr -cd '\000' < "$SAVE_FILE" | wc -c)
if [ "$zero_bytes" -eq "$actual_size" ]; then
    echo "FALHA: $SAVE_FILE é 100% zeros — arquivo não foi escrito"
    exit 1
fi

# 3. Comparar com checksum conhecido (se existir)
if [ -f "$(dirname "$SAVE_FILE")/manifest.sha256" ]; then
    pushd "$(dirname "$SAVE_FILE")" > /dev/null
    if ! sha256sum -c manifest.sha256 --quiet 2>/dev/null | grep -q "$(basename "$SAVE_FILE").*OK"; then
        echo "FALHA: $SAVE_FILE não bate com o checksum esperado"
        popd > /dev/null
        exit 1
    fi
    popd > /dev/null
fi

echo "OK: $SAVE_FILE ($actual_size bytes, checksum verificado)"
$ ./check_save_integrity.sh ~/all-saves/proton/1245620/ER0000.sl2
OK: /home/deck/all-saves/proton/1245620/ER0000.sl2 (149876 bytes, checksum verificado)
```

## `par2`: correção de erros, não só detecção

Checksums detectam corrupção — mas não consertam. O `par2` (Parchive 2) cria arquivos de redundância que permitem **recuperar** dados corrompidos, até certo limite. Ele divide o arquivo original em blocos, calcula paridade e salva blocos de correção. Se uma parte do arquivo for danificada, os blocos de paridade reconstroem a parte perdida.

```terminal
$ sudo steamos-readonly disable
$ sudo pacman -S par2cmdline
$ sudo steamos-readonly enable
$ cd ~/all-saves/proton/1245620/
$ par2 create -r10 ER0000.sl2.par2 ER0000.sl2
Block size: 768
Source block count: 196
Redundancy: 10%
Recovery block count: 20
Recovery file count: 7

$ ls ER0000.sl2.par2*
ER0000.sl2.par2  ER0000.sl2.vol00+01.par2  ER0000.sl2.vol01+02.par2  ...
```

O `-r10` cria 10% de redundância: para um save de 150 KB, os arquivos `.par2` ocupam ~15 KB adicionais, e podem recuperar até 10% do arquivo original danificado. Para verificar e reparar:

```terminal
$ par2 verify ER0000.sl2.par2
Target: "ER0000.sl2" - found.
All files are correct, repair is not required.
$ # Simule corrupção (substitua 100 bytes por zeros no meio do arquivo):
$ dd if=/dev/zero of=ER0000.sl2 bs=1 count=100 seek=50000 conv=notrunc
$ par2 verify ER0000.sl2.par2
Target: "ER0000.sl2" - damaged. Found 196 data blocks, 1 are damaged.
You have 20 recovery blocks available.
Repair is possible.
$ par2 repair ER0000.sl2.par2
Repair is required.
1 data block(s) repaired.
$ echo $?
0
```

:::atencao
`par2` só consegue reparar até o percentual de redundância que você configurou. Com `-r10`, danos acima de 10% do arquivo são irrecuperáveis. Aumentar a redundância aumenta o tamanho dos arquivos `.par2` na mesma proporção: `-r50` dobra o espaço ocupado. Para saves de jogos, 10-15% é um bom equilíbrio.
:::

## Integrando verificações ao fluxo de sincronização

O momento mais perigoso é logo após o jogo fechar e antes do Steam Cloud subir o save. Se o jogo crashou e corrompeu o save, você tem uma janela de segundos para impedir que a versão corrompida vá para a nuvem. Um script de hook pode interceptar isso:

```terminal
$ cat ~/check-before-sync.sh
#!/bin/bash
# Hook pós-jogo: execute este script antes de deixar o Steam sincronizar

APPID="$1"
SAVE_DIR="$HOME/.local/share/Steam/userdata/207304170/$APPID/local/"

if [ ! -d "$SAVE_DIR" ]; then
    echo "Diretório de save não encontrado para AppID $APPID"
    exit 0
fi

for save in "$SAVE_DIR"/*; do
    [ -f "$save" ] || continue
    size=$(stat --format='%s' "$save")
    # Arquivo menor que 100 bytes em save grande = truncado
    if [ "$size" -lt 100 ]; then
        echo "PERIGO: $save tem $size bytes — possível truncamento"
        echo "Abortando sincronização. Verifique manualmente."
        exit 1
    fi
    # Zero-byte check
    if [ "$size" -gt 0 ] && [ "$(tr -cd '\000' < "$save" | wc -c)" -eq "$size" ]; then
        echo "PERIGO: $save está zerado — arquivo não foi escrito"
        exit 1
    fi
done
echo "Todos os saves passaram na verificação."
```

Esse script, integrado ao fluxo de fechamento do jogo (via script wrapper que chama `steam -applaunch` e depois `check-before-sync.sh`), pode salvar seu save de ser substituído por lixo na nuvem.

## Resumo

- Corrupção acontece por escrita interrompida, mídia defeituosa ou bug do jogo; o sistema de arquivos não protege contra isso.
- `sha256sum` gera e verifica hashes: mude um bit do arquivo e a verificação falha.
- Arquivos truncados têm tamanho anormalmente pequeno; arquivos zerados são 100% bytes `\x00`.
- `par2` cria códigos de correção de erros que permitem recuperar até o percentual de redundância configurado.
- Interceptar o save entre o crash do jogo e a sincronização com o Steam Cloud impede que a versão corrompida se propague.

## Exercícios

1. Gere um `manifest.sha256` para todos os arquivos em `~/all-saves/`. Depois edite um arquivo de save qualquer (adicione um byte) e execute `sha256sum -c`. O que acontece?
2. Escreva um script que percorra todos os saves e sinalize arquivos com menos de 100 bytes (possível truncamento) ou 100% bytes zeros. Teste com um arquivo zerado criado com `dd if=/dev/zero`.
3. Instale o `par2` e crie arquivos de paridade com `-r10` para seus três saves mais importantes. Simule corrupção com `dd` (sobrescreva uma região do arquivo) e execute `par2 repair`.
4. Execute o script `check-before-sync.sh` manualmente para um jogo que você acabou de fechar. Todos os saves passam? Se não, qual falhou e por quê?
5. **Desafio.** Combine `inotifywait` com `sha256sum`: monitore o diretório de save de um jogo e, sempre que o arquivo de save for fechado após escrita (`CLOSE_WRITE`), calcule o hash e compare com o hash anterior. Se o arquivo mudou mas encolheu mais de 50%, soe um alerta. Esse monitor pode pegar corrupção antes mesmo de o jogo exibir a tela de "save corrompido".
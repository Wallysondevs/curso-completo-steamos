Você instalou 40 mods, três runtimes, dois patches e um script extender. O jogo abria ontem e hoje fecha silenciosamente. O prefixo Wine não é mágico — é um diretório com arquivos de estado que podem corromper, conflitar ou simplesmente ficar velhos demais. Saber diagnosticar e reparar é tão importante quanto saber instalar.

:::objetivos
- Diagnosticar prefixos corrompidos usando logs do Proton e verificação de estrutura
- Restaurar prefixos a partir de backups manuais e automáticos
- Recriar prefixos preservando saves e configurações essenciais
- Identificar conflitos entre componentes Wine e mods
- Implementar uma estratégia de backup incremental para prefixos
:::

## Sinais de que o prefixo está doente

Um prefixo saudável responde a comandos. Um prefixo doente manifesta sintomas específicos:

1. **Silent crash**: o jogo fecha sem mensagem antes mesmo da splash screen.
2. **No wineprefix found**: `protontricks` não encontra o AppID.
3. **Component already installed loop**: você instala `vcrun2022` e o ProtonTricks insiste que não está instalado.
4. **Wine configuration error**: `winecfg` não abre ou exibe caixas de erro em branco.
5. **Missing DLL errors em cascata**: instalar uma DLL revela que três outras estão faltando.

O primeiro passo é sempre verificar a integridade estrutural:

```terminal
$ APPID=489830
$ PREFIX="$HOME/.steam/steam/steamapps/compatdata/$APPID/pfx"

## Os três arquivos .reg devem existir e ter tamanho > 0
$ ls -la "$PREFIX"/*.reg
-rw-r--r-- 1 deck deck 1.2M Mar 15 14:22 system.reg
-rw-r--r-- 1 deck deck 892K Mar 15 14:22 user.reg
-rw-r--r-- 1 deck deck  16K Mar 15 14:22 userdef.reg

## O drive_c deve ter estrutura Windows mínima
$ ls "$PREFIX/drive_c/"
Program Files/  Program Files (x86)/  ProgramData/  users/  windows/
```

Se qualquer um desses arquivos estiver vazio (0 bytes) ou ausente, o prefixo está corrompido.

## Usando logs do Proton para diagnóstico

O Proton escreve logs detalhados quando ativado. Para prefixos problemáticos, o log frequentemente revela a causa raiz:

```terminal
$ PROTON_LOG=1 steam steam://run/489830
$ grep -E 'err:|fixme:|warn:' ~/steam-489830.log | tail -30
fixme:ntdll:NtQuerySystemInformation info_class SYSTEM_PERFORMANCE_INFORMATION
err:module:import_dll Loading library msvcp140.dll failed
err:module:import_dll Library MSVCP140.dll (which is needed by L"C:\\...") not found
warn: LoadLibrary failed
```

Neste exemplo, `msvcp140.dll` ausente indica que o Visual C++ 2022 precisa ser reinstalado. A solução:

```terminal
$ protontricks 489830 vcrun2022
```

Outros padrões comuns nos logs:

| Erro no log | Significado | Solução |
|---|---|---|
| `err:module:import_dll MSVCP140.dll not found` | Falta Visual C++ Runtime | `protontricks APPID vcrun2022` |
| `err:module:import_dll XINPUT1_3.dll not found` | Falta DirectX 9 | `protontricks APPID d3dx9` |
| `fixme:d3d:wined3d_swapchain` | Problema de renderização | Troque para Proton Experimental |
| `err:winediag:nodrv_CreateWindow` | Driver gráfico não detectado | Reinicie o compositor (Gamescope) |
| `err:virtual:virtual_setup_exception` | Prefixo corrompido | Restaure do backup |
| `fixme:file:NtLockFile` | Arquivo de save bloqueado | Feche outras instâncias do jogo |

:::dica
O log do Proton cresce rápido e pode ter milhares de linhas. Use `grep -E 'err:'` primeiro — `fixme` são avisos de funcionalidade não implementada e raramente indicam problemas fatais.
:::

## Procedimento de restauração

Se o diagnóstico indicar corrupção irreparável, restaure do backup:

```terminal
## 1. Mova o prefixo atual para quarentena (não delete ainda)
$ mv ~/.steam/steam/steamapps/compatdata/489830 \
     ~/.steam/steam/steamapps/compatdata/489830.corrompido

## 2. Copie o backup mais recente
$ cp -r ~/backups/prefix-skyrim-20250314 \
     ~/.steam/steam/steamapps/compatdata/489830

## 3. Teste
$ protontricks -c 'wine winecfg' 489830
## Se winecfg abrir, o prefixo está saudável
```

Se você não tem backup (acontece), o plano B é recriar o prefixo e restaurar só os saves:

```terminal
## 1. Salve os saves do prefixo antigo
$ mkdir -p ~/backups/saves-skyrim
$ find ~/.steam/steam/steamapps/compatdata/489830.corrompido/pfx/drive_c/users/steamuser/Documents \
  -name "*.ess" -o -name "*.skse" | xargs -I{} cp {} ~/backups/saves-skyrim/

## 2. Delete o prefixo (o Proton recriará na próxima execução)
$ rm -rf ~/.steam/steam/steamapps/compatdata/489830

## 3. Execute o jogo uma vez para recriar o prefixo limpo
$ steam steam://run/489830

## 4. Copie os saves de volta
$ cp ~/backups/saves-skyrim/* \
  ~/.steam/steam/steamapps/compatdata/489830/pfx/drive_c/users/steamuser/Documents/My\ Games/Skyrim\ Special\ Edition/Saves/
```

:::perigo
Recriar o prefixo elimina todas as configurações do Wine, mods instalados e runtimes. Após a recriação, você precisa reinstalar `vcrun2022`, `dotnet48` etc. e reexecutar os instaladores de mods. Faça isso como último recurso — sempre prefira o backup.
:::

## Estratégia de backup incremental com rsync

Backups manuais são melhores que nada, mas tendem a envelhecer. Um script com `rsync` mantém um espelho atualizado:

```bash
#!/bin/bash
# ~/bin/backup-prefix.sh — Backup incremental de todos os prefixos Steam
BACKUP_DIR="$HOME/backups/prefixos"
mkdir -p "$BACKUP_DIR"

for prefix in "$HOME/.steam/steam/steamapps/compatdata/"*/; do
    appid=$(basename "$prefix")
    # Pula entradas não numéricas
    [[ "$appid" =~ ^[0-9]+$ ]] || continue

    echo "==> Backup do prefixo $appid..."
    rsync -a --delete "$prefix" "$BACKUP_DIR/$appid/"
done

echo "==> Backup concluído em $(date)"
```

Rode-o manualmente antes de grandes mudanças, ou agende no cron:

```terminal
$ crontab -e
$ ## Adicione:
$ 0 3 * * 0 /home/deck/bin/backup-prefix.sh
```

Isso executa o backup todo domingo às 3h da manhã.

## Conflitos entre componentes Wine

Instalar muitos componentes pode criar conflitos entre versões nativas e built-in de DLLs. O `winecfg` mostra as substituições ativas na aba "Libraries". O ideal é manter o mínimo de overrides:

```terminal
## Liste as DLL overrides do prefixo
$ protontricks 489830 winecfg
## Vá na aba Libraries e revise a lista

## Para resetar todas as overrides (cuidado!)
$ rm "$PREFIX/user.reg"
$ protontricks 489830 wineboot -u
```

Overrides comuns que causam conflito: `d3d11=native` (quebra o DXVK), `dinput8=native` (necessário para mods, mas incompatível com certos jogos), `xinput1_3=native` (use `builtin` para jogos com suporte a controle via Steam Input).

## Resumo

- Prefixos corrompidos mostram sintomas como silent crash, erros de DLL em cascata e falha ao abrir `winecfg`.
- Logs do Proton (`PROTON_LOG=1`) revelam a causa raiz; filtre por `err:` primeiro.
- Restaure do backup preferencialmente; recriar o prefixo elimina mods e runtimes.
- Salve saves de `drive_c/users/steamuser/Documents` antes de qualquer operação destrutiva.
- `rsync` incremental mantém backups atualizados; cron automatiza a tarefa.
- Overrides de DLL no `winecfg` devem ser mínimos; `d3d11=native` quebra DXVK.

## Exercícios

1. Ative `PROTON_LOG=1` para um jogo que funciona perfeitamente e inspecione o log. Quantas linhas de `fixme` e `err` aparecem?
2. Simule uma corrupção de prefixo (renomeie `system.reg`), observe o erro e restaure do backup.
3. Extraia os saves de três jogos diferentes a partir de prefixos Wine. Cada jogo salva no mesmo local? Documente as diferenças.
4. Escreva e execute um script `rsync` para backup incremental. Verifique que a segunda execução é instantânea (sem mudanças).
5. **Desafio.** Provoque um conflito de DLL no `winecfg` (adicione `d3d11=native`), observe o efeito em três jogos diferentes, remova a override e verifique a recuperação.
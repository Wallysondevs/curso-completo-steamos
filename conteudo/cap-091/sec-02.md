Antes de qualquer botão de volume ou pendrive, existe uma etapa que decide se sua recuperação vai funcionar: obter a imagem correta. Baixar de um site de terceiros, de um mirror não oficial ou de uma versão errada pode transformar um problema de boot em um problema pior — ou simplesmente desperdiçar uma hora de download para um arquivo corrompido que o Deck nem reconhece. A fonte da verdade é a Valve, e o caminho é mais curto do que parece.

:::objetivos
- Localizar a imagem oficial de recovery no site da Valve
- Compreender os dois formatos de compactação disponíveis e qual baixar
- Verificar a integridade do arquivo antes de gravar
- Saber onde encontrar versões históricas do sistema para diagnóstico
:::

## Onde está a imagem oficial

A página oficial de download vive em `store.steampowered.com/steamos/download`, na seção do Steam Deck. Ela exige que você aceite o contrato de licença (EULA) antes de liberar o arquivo — um clique que muita gente pula sem ler, mas que vale uma mirada rápida porque o texto explica exatamente o que a Valve se compromete (e não se compromete) a fazer com o software.

```terminal
$ curl -sI https://store.steampowered.com/steamos/download/?ver=steamdeck | head -5
HTTP/1.1 200 OK
content-type: text/html; charset=UTF-8
cache-control: no-store
```

A página entrega um arquivo com nome no formato `steamdeck-recovery-N.img.bz2` (ou `.zip`), onde `N` é um número de versão inteiro que sobe a cada liberação — no momento da escrita deste capítulo, a versão corrente é a `4`. O nome do arquivo não carrega a versão do SteamOS dentro dele (a imagem sempre instala a última build estável), então guarde a data do download para referência.

:::nota
O link "Download the recovery image here" da página de suporte redireciona para esse mesmo arquivo. A Valve costuma manter o download do Deck separado do download do SteamOS para PCs de mesa — certifique-se de estar na seção do Steam Deck, não na do "SteamOS (para PC)".
:::

## bz2 ou zip: qual baixar

A imagem vem compactada para economizar banda — cerca de 2,5 GiB comprimidos contra 7,7 GiB descompactados. A mesma imagem é oferecida em dois formatos, e a escolha depende do seu sistema operacional atual:

| Formato | Compactação | Melhor para |
|---|---|---|
| `.img.bz2` | bzip2 (melhor taxa) | Linux e usuários que vão gravar com `dd` ou `bmaptool` |
| `.img.zip` | zip (universal) | Windows (Explorer descompacta nativo) e macOS |

No Linux, o `.bz2` é o caminho natural: o `bzip2` já vem instalado e a descompactação é feita em uma linha. No Windows, o `.zip` evita instalar ferramentas extras — o próprio Explorer descompacta clicando com o botão direito e escolhendo "Extrair tudo".

```terminal
$ ls -lh steamdeck-recovery-4.img.bz2
-rw-r--r-- 1 ana ana 2.5G Feb 20 09:12 steamdeck-recovery-4.img.bz2
$ bzip2 -dk steamdeck-recovery-4.img.bz2
$ ls -lh steamdeck-recovery-4.img
-rw-r--r-- 1 ana ana 7.7G Feb 20 09:21 steamdeck-recovery-4.img
```

O `-d` descompacta e o `-k` mantém o arquivo `.bz2` original, caso você precise gravar de novo mais tarde. Sem o `-k`, o `bzip2` apaga o compactado após expandir — economiza disco, mas obriga a baixar de novo se algo der errado na gravação.

## Verifique antes de gravar

Uma imagem corrompida por download interrompido pode gravar sem erro aparente e depois falhar no meio da restauração. O tempo que você investe verificando agora é minúsculo perto do transtorno de um Deck que reinicia no meio da reimagem. A página da Valve publica um hash SHA256 ao lado do download; compare com o arquivo baixado.

```terminal
$ sha256sum steamdeck-recovery-4.img.bz2
9f3c6f1a4b8e2d0c7a5e3b1f9d8c6a2e4b0f7d5c3a1e9b8f6d4c2a0e8b6d4f2a  steamdeck-recovery-4.img.bz2
```

Se o hash não bater, o arquivo está truncado ou foi adulterado — apague e baixe de novo. Um hash confirmado é o primeiro sinal de que a recuperação inteira tem chance de terminar bem.

:::atencao
Não grave a imagem enquanto o download está em andamento e não grave o arquivo compactado (`.bz2` ou `.zip`) como se fosse a imagem. Gravar `.bz2` direto no pendrive produz um dispositivo que não dá boot. Descompacte sempre primeiro.
:::

## O repositório de versões históricas

Para diagnóstico de regressão ou restauração de uma build específica, a Valve mantém um índice público em `steamdeck-images.steamos.cloud/recovery`. Lá você encontra não só os `steamdeck-recovery-N` genéricos, mas também imagens "repair" com versão embutida no nome, como `steamdeck-repair-20250521.10-3.7.7.img.bz2`.

```terminal
$ curl -s https://steamdeck-images.steamos.cloud/recovery/ | grep -oE 'steamdeck-[a-z]+-[0-9.]+' | sort -u
steamdeck-oobe-repair-20260618.10-3.8.10
steamdeck-oobe-repair-20260707.10-3.8.14
steamdeck-recovery-1
steamdeck-recovery-2
steamdeck-recovery-3
steamdeck-recovery-4
steamdeck-repair-20231117.11-3.5.6
steamdeck-repair-20250521.10-3.7.7
```

A nomenclatura conta uma história: `repair` com data e versão são imagens de reparo pontuais, `recovery` sem versão são as imagens "sempre atuais" que a página de download oferece, e `oobe-repair` são versões voltadas a restaurar o assistente de primeira inicialização (OOBE, *out-of-box experience*). Para a grande maioria dos casos, a imagem `recovery` corrente da página de download é a escolha certa.

:::info
Versões históricas usam o esquema de release do SteamOS: `3.5.6`, `3.7.7`, `3.8.14`. Se um jogo ou acessório parou de funcionar depois de um update, restaurar para a imagem `repair` da versão anterior é uma forma de confirmar que a mudança veio do sistema, e não do hardware.
:::

## Resumo

- A imagem oficial está em `store.steampowered.com/steamos/download`, na seção do Steam Deck, mediante aceite do EULA.
- O arquivo vem como `.img.bz2` ou `.img.zip`, ambos com ~2,5 GiB compactados e ~7,7 GiB descompactados.
- `bzip2 -dk` descompacta mantendo o original; no Windows o Explorer extrai `.zip` nativamente.
- Verifique o hash SHA256 publicado pela Valve antes de gravar; hash divergente exige novo download.
- O índice `steamdeck-images.steamos.cloud/recovery` lista imagens históricas `repair` e `oobe-repair` para diagnóstico de regressão.

## Exercícios

1. Acesse a página de download da Valve e anote o nome exato do arquivo oferecido hoje, junto com o hash SHA256 publicado. Eles mudam ao longo do tempo — compare com o que está descrito aqui.
2. Descompacte a imagem com `bzip2 -dk` (ou extraia o `.zip`) e confirme com `ls -lh` que o tamanho final bate com o esperado.
3. Calcule `sha256sum` do arquivo `.img` descompactado e explique por que a Valve publica o hash do compactado, não do descompactado.
4. Liste o diretório de imagens históricas e identifique qual é a imagem `repair` mais recente com `3.7` no nome.
5. **Desafio.** Sem gravar em pendrive, monte a imagem com `losetup` e use `parted -l` para conferir se a tabela de partições é GPT ou MBR e quantos GiB cada partição ocupa. Relacione isso com o layout A/B descrito na seção 1.
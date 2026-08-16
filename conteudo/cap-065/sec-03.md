Com o Sunshine rodando no host, o próximo passo é instalar o Moonlight no Steam Deck. O Moonlight é um cliente disponível em múltiplas plataformas, e no Deck a forma mais simples é via Flatpak/Discover. Esta seção cobre a instalação, os atalhos de linha de comando e como adicionar o Moonlight ao modo Gaming como um atalho Steam.

:::objetivos
- Instalar o Moonlight no Steam Deck via Discover (Flatpak)
- Conhecer a versão AppImage e quando usá-la
- Usar a linha de comando `moonlight` para testes e automação
- Adicionar o Moonlight como atalho no modo Gaming
- Explorar as opções de linha de comando úteis no Deck
:::

## Instalação via Discover (Flatpak)

No modo Desktop do Steam Deck, abra o **Discover** (loja de aplicativos KDE), busque por "Moonlight" e instale. O pacote é `com.moonlight_stream.Moonlight` do Flathub.

Alternativamente, pelo terminal:

```terminal
$ flatpak install flathub com.moonlight_stream.Moonlight
```

Após a instalação, o Moonlight aparece no menu de aplicativos. Para abrir:

```terminal
$ flatpak run com.moonlight_stream.Moonlight
```

A interface gráfica é simples: uma lista de hosts detectados automaticamente (via mDNS/broadcast na rede local), um campo para adicionar hosts manualmente, e configurações de streaming.

## AppImage (alternativa)

O Moonlight também distribui AppImage para Linux, que não depende do Flatpak e pode ser mais leve:

```terminal
$ wget https://github.com/moonlight-stream/moonlight-qt/releases/latest/download/Moonlight-x86_64.AppImage
$ chmod +x Moonlight-x86_64.AppImage
$ ./Moonlight-x86_64.AppImage
```

A AppImage é auto-contida e não requer instalação. Útil se você tem problemas com Flatpak ou quer uma versão específica. Mas o Discover é o caminho recomendado para atualizações automáticas.

## Linha de comando: `moonlight`

O Moonlight Flatpak inclui um utilitário de linha de comando, acessível assim:

```terminal
$ flatpak run --command=moonlight com.moonlight_stream.Moonlight
```

Para facilitar, crie um alias no `~/.bashrc`:

```bash
alias moonlight='flatpak run --command=moonlight com.moonlight_stream.Moonlight'
```

Comandos essenciais:

```terminal
# Listar hosts detectados
$ moonlight list

# Parear com um host (precisa do PIN gerado no Sunshine)
$ moonlight pair <ip-do-host>

# Fazer streaming do desktop
$ moonlight stream <ip-do-host> --desktop

# Stream de um aplicativo específico
$ moonlight stream <ip-do-host> --app "Cyberpunk 2077"

# Stream com configurações de qualidade
$ moonlight stream <ip-do-host> --desktop --bitrate 50000 --fps 60 --resolution 1920x1080

# Desparear
$ moonlight unpair <ip-do-host>
```

### Opções relevantes para o Deck

| Opção | Descrição | Valor típico Deck |
|-------|-----------|-------------------|
| `--resolution` | Resolução do stream | `1280x800` (nativa) |
| `--fps` | Quadros por segundo | `60` ou `90` |
| `--bitrate` | Bitrate em Kbps | `30000`–`80000` |
| `--codec` | Codec de vídeo | `hevc` (preferido) |
| `--hwdecode` | Forçar decodificação por hardware | (default on) |
| `--surround` | Áudio surround | `--surround` se fones suportam |
| `--mute` | Silenciar áudio local | Útil para testes |
| `--quit-after` | Fechar após inatividade (segundos) | Ex.: `--quit-after 60` |
| `--view-only` | Não enviar input (espectador) | Para monitorar o host |
| `--no-video` | Apenas áudio | Música/podcast remoto |

## Adicionando Moonlight ao modo Gaming

O maior truque: fazer o Moonlight aparecer como jogo Steam, executável direto do modo Gaming.

### Método 1: Adicionar jogo não-Steam

1. Abra o Steam no modo Desktop.
2. Clique em **Games** → **Add a Non-Steam Game to My Library**.
3. Procure "Moonlight" na lista (se não aparecer, clique **Browse** e navegue até `/var/lib/flatpak/exports/bin/com.moonlight_stream.Moonlight`).
4. Selecione e adicione.

### Método 2: Atalho direto para um jogo específico

Crie um script em `~/bin/stream-cyberpunk.sh`:

```bash
#!/bin/bash
flatpak run --command=moonlight com.moonlight_stream.Moonlight \
  stream 192.168.1.100 --app "Cyberpunk 2077" \
  --resolution 1280x800 --fps 60 --bitrate 50000 --codec hevc
```

Torne executável e adicione como non-Steam game:

```terminal
$ chmod +x ~/bin/stream-cyberpunk.sh
```

Assim, cada jogo transmitido vira um atalho separado na sua biblioteca Steam.

### Método 3: Moonlight Decky Plugin

Se você tem o Decky Loader instalado, busque pelo plugin "MoonDeck" ou "Moonlight" na loja de plugins. Esses plugins integram o Moonlight diretamente ao overlay do modo Gaming (botão QAM), permitindo iniciar streams sem sair da interface Steam.

## Verificando decodificação por hardware

O Deck decodifica H.264 e HEVC em hardware. Confirme:

```terminal
$ vainfo
libva info: VA-API version 1.20.0
libva info: Trying to open /usr/lib/dri/radeonsi_drv_video.so
      VAProfileH264High               : VAEntrypointVLD
      VAProfileHEVCMain               : VAEntrypointVLD
```

Os entrypoints `VAEntrypointVLD` confirmam que a decodificação via VA-API está disponível.

Para verificar se o Moonlight está usando decodificação por hardware, inicie um stream e, em outro terminal no Deck, rode:

```terminal
$ nvtop
# ou
$ radeontop
```

A GPU deve mostrar atividade de decodificação (`DEC` ou `VCN`), não de renderização 3D. A CPU deve ficar baixa (< 20%).

## Resumo

- Instale o Moonlight pelo Discover (Flatpak) no modo Desktop do Deck.
- A linha de comando `moonlight` permite automação e scripts de conexão direta.
- Adicione ao modo Gaming como jogo não-Steam ou via script por jogo.
- Plugins Decky (MoonDeck) integram o Moonlight ao overlay do modo Gaming.
- O APU do Deck decodifica H.264 e HEVC em hardware via VA-API.

## Exercícios

1. Instale o Moonlight no Deck via Discover e abra a interface gráfica. Quantos hosts ele detectou automaticamente?
2. Crie o alias `moonlight` no seu `~/.bashrc` e execute `moonlight list`. O que aparece?
3. Execute `vainfo` no Deck e liste os codecs suportados com `VAEntrypointVLD`. HEVC Main 10 (10-bit) está disponível?
4. Adicione o Moonlight como jogo não-Steam na sua biblioteca Steam. Inicie o modo Gaming e confirme que ele aparece.
5. **Desafio.** Escreva um script `stream-jogo.sh` que aceite o nome do jogo como argumento (`./stream-jogo.sh "Elden Ring"`) e faça streaming para o Deck com resolução 1280x800, 60 fps, HEVC e 50 Mbps. Teste com um jogo leve no host.
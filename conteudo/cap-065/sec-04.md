Com Sunshine no host e Moonlight no Deck, é hora de parear — o equivalente a "logar" o cliente no servidor. O pareamento usa PIN: o Sunshine gera um código de 4 dígitos, você insere no Moonlight e a conexão fica autorizada permanentemente. Depois, é só clicar no host e iniciar o primeiro stream.

:::objetivos
- Gerar o PIN de pareamento no Sunshine
- Parear o Moonlight com o host
- Entender onde o pareamento é armazenado
- Fazer o primeiro stream de teste (desktop)
- Validar latência inicial e qualidade da imagem
:::

## Gerando o PIN no Sunshine

No navegador do host, acesse `https://localhost:47990`, faça login e vá na aba **PIN**. Clique em **Generate PIN** — aparece um código de 4 dígitos.

Alternativamente, via API:

```terminal
# No host
$ curl -sk -X POST https://localhost:47990/api/pin \
  -u "seu-usuario:sua-senha" \
  -H "Content-Type: application/json" \
  -d '{}'
```

O PIN expira em alguns minutos. Se não for usado, precisa gerar outro.

## Pareando pelo Moonlight (GUI)

No Deck, abra o Moonlight. A interface gráfica escaneia a rede automaticamente: o host Sunshine aparece com nome, IP e ícone.

1. Clique no host desejado.
2. O Moonlight mostra o campo de PIN.
3. Digite os 4 dígitos e confirme.
4. O Moonlight exibe "Paired successfully" e o ícone do host muda para um cadeado aberto.

A partir daí, clicar no host abre a lista de aplicativos disponíveis (os configurados na aba Applications do Sunshine).

## Pareando pela linha de comando

```terminal
$ moonlight pair 192.168.1.100
Enter PIN: 1234
Paired successfully
```

Para listar hosts pareados:

```terminal
$ moonlight list
Host 192.168.1.100: Sunshine (Paired)
```

Para remover o pareamento:

```terminal
$ moonlight unpair 192.168.1.100
```

## Onde o pareamento é armazenado

Do lado do **Deck** (cliente), os certificados ficam em:

```terminal
$ ls ~/.cache/moonlight/
certs/
pairable.txt
```

Cada host pareado gera um par de certificados (`.key` e `.crt`) nessa pasta. Se você apagar a pasta `certs/`, perde todos os pareamentos e precisa re-parear.

Do lado do **host** (Sunshine), os clientes autorizados estão no arquivo de configuração:

- **Windows**: `C:\Program Files\Sunshine\config\sunshine.conf`
- **Linux**: `~/.config/sunshine/sunshine.conf`

Dentro do arquivo, a seção `[clients]` lista os UUIDs autorizados.

## Primeiro stream: desktop

O teste mais simples é transmitir o desktop do host:

```terminal
$ moonlight stream 192.168.1.100 --desktop --resolution 1280x800 --fps 60 --bitrate 30000
```

A tela do Deck mostra o desktop do host. Mexa o mouse, abra uma janela — a resposta deve ser quase instantânea.

### O que observar

1. **Latência visual**: abra um relógio com ponteiro de segundos no host e compare com o Deck. A diferença deve ser < 20 ms em rede cabeada.
2. **Artefatos**: áreas escuras ou com gradiente podem mostrar banding. Aumente o bitrate se perceber blocos.
3. **Áudio**: o som do host deve sair pelo Deck (não pelo host). Se sair nos dois, ajuste o Sunshine para silenciar o host durante o stream.
4. **Cursor**: o cursor do mouse deve responder suavemente. Se estiver "pulando", há perda de pacotes.

## Primeiro stream: jogo

Na GUI do Moonlight, clique no host e selecione um jogo da lista. Ou pela linha de comando:

```terminal
$ moonlight stream 192.168.1.100 --app "Steam Big Picture"
```

Isso abre o Steam Big Picture do host no Deck — uma experiência quase indistinguível de rodar nativo. De lá, lance qualquer jogo Steam da biblioteca do host.

Para jogos não-Steam, você pode adicionar o executável na aba Applications do Sunshine, ou simplesmente streamar o desktop e abrir o jogo manualmente.

### Atalhos durante o stream

| Combinação | Ação |
|------------|------|
| `Ctrl + Alt + Shift + Q` | Fechar o stream (Moonlight fecha) |
| `Ctrl + Alt + Shift + X` | Alternar modo janela/tela cheia |
| `Ctrl + Alt + Shift + M` | Alternar mouse entre capturado/solto |
| `Ctrl + Alt + Shift + Z` | Mostrar estatísticas de streaming (overlay) |
| `Ctrl + Alt + Shift + F` | Alternar fullscreen |
| `Ctrl + Alt + Shift + S` | Salvar frame atual como screenshot |

No Deck, esses atalhos podem ser mapeados para botões via Steam Input.

## Validando a conexão

Durante o stream, abra as estatísticas do Moonlight (`Ctrl+Alt+Shift+Z` ou ative nas configurações). O overlay mostra:

- **Incoming bitrate**: o bitrate real chegando no Deck.
- **Frame drops**: frames perdidos por rede. Ideal: 0%.
- **Decode time**: tempo médio de decodificação. No Deck, < 5 ms com HEVC.
- **Network latency**: ping entre cliente e servidor.
- **Total latency**: tempo total do frame, da captura à exibição. Ideal < 30 ms.

Se o `incoming bitrate` estiver muito abaixo do configurado, a rede está congestionada. Se `frame drops` > 0%, há perda de pacotes.

## Resumo

- O Sunshine gera PIN de 4 dígitos; o Moonlight usa para pareamento único e permanente.
- O pareamento é armazenado em certificados no Deck (`~/.cache/moonlight/certs/`) e na config do Sunshine.
- O primeiro stream deve ser o desktop, para validar latência, áudio e qualidade.
- Durante o stream, `Ctrl+Alt+Shift+Z` mostra o overlay com estatísticas de rede e decodificação.
- O stream de jogo funciona direto da lista de aplicativos do Sunshine ou via desktop.

## Exercícios

1. Gere um PIN no Sunshine e pareie o Moonlight do Deck. Anote onde o certificado foi armazenado no Deck (`ls ~/.cache/moonlight/certs/`).
2. Faça um stream do desktop do host com `moonlight stream --desktop --stats`. Anote os valores de network latency, decode time e frame drops.
3. Durante o stream, abra o `radeontop` no Deck em outro terminal (via SSH ou alternando janela). A atividade de decodificação (`VCN`) aparece? A CPU está alta?
4. Abra um relógio online com precisão de milissegundos no host e fotografe lado a lado com o Deck. Qual a latência visual estimada?
5. **Desafio.** Configure um aplicativo personalizado no Sunshine (aba Applications) para um jogo não-Steam. Adicione o comando de linha de comando correto e uma imagem de capa. Inicie-o pelo Moonlight.
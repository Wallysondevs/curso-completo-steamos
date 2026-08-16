Ter o Chiaki instalado é só o começo. A etapa que mais frustra novos usuários é o pareamento: o processo de autenticação entre o cliente e o console PlayStation. A Sony protege esse handshake com criptografia e tokens temporários, e um detalhe errado — como o Account ID trocado ou o PIN expirado — faz o registro falhar sem mensagens claras. Esta seção detalha o pareamento passo a passo para PS4 e PS5, incluindo o que fazer quando o processo emperra.

:::objetivos
- Realizar o pareamento completo entre Chiaki e PS4
- Realizar o pareamento completo entre Chiaki e PS5
- Entender as diferenças de autenticação entre os dois consoles
- Diagnosticar e corrigir falhas comuns de registro
- Gerenciar múltiplos consoles em um único Chiaki
:::

## O handshake de pareamento explicado

O processo de pareamento do Chiaki segue a mesma lógica do app oficial da Sony, mas como o código é aberto, você enxerga os bastidores. O fluxo é:

1. O Chiaki envia seu PSN Account ID para o console via broadcast ou IP direto.
2. O console retorna um desafio criptográfico e exibe um PIN de 8 dígitos na tela (ou no menu de Remote Play).
3. Você digita esse PIN no Chiaki.
4. O Chiaki resolve o desafio usando o PIN como parte da chave e estabelece uma sessão criptografada.
5. O console armazena um token de acesso permanente; a partir daí, o pareamento não precisa ser refeito.

O ponto crítico é o **PSN Account ID correto**. Se esse identificador estiver errado, o console nem chega a exibir o PIN — o pedido de pareamento é sumariamente rejeitado.

```terminal
## Estrutura do comando de registro do Chiaki (linha de comando):
$ chiaki --register --host <ip-do-console> --account-id <psn-account-id>
```

## Pareamento com PS4

No PS4, o Remote Play precisa estar explicitamente ativado em **Configurações > Configurações de Remote Play > Ativar Remote Play**. Além disso, o console precisa estar definido como **primário** para a sua conta. Sem esses dois pré-requisitos, o pareamento falha.

Passo a passo para parear o Chiaki com o PS4:

```terminal
$ flatpak run io.github.streetpea.Chiaki4Deck
```

Ao abrir o Chiaki4Deck, clique em "Add Console" (Adicionar Console). No campo de IP, digite o endereço do PS4 — algo como `192.168.1.150`. O campo PSN Account ID deve conter o identificador obtido na seção anterior. Clique em "Register".

Nesse momento, o PS4 exibe uma tela preta com um PIN de 8 dígitos. Você tem 300 segundos para digitá-lo no Chiaki antes que o código expire. Se o PIN não aparecer:

```terminal
## No PS4, navegue manualmente até:
## Configurações > Configurações de Remote Play > Adicionar dispositivo
```

Isso força o console a gerar um novo PIN. Digite os 8 dígitos no Chiaki e confirme. Se tudo correr bem, o status muda para "Registered" e o console aparece na lista principal.

```terminal
$ chiaki --discover
Discovered consoles on the network:
  1. PS4-1234567  (PS4)  192.168.1.150  Registered: yes
```

:::atencao
O PS4 exige que a conta que está pareando seja a conta principal do console. Se você tem múltiplas contas no PS4, certifique-se de que o PSN Account ID usado no Chiaki corresponde à conta que definiu o console como primário.
:::

## Pareamento com PS5

O processo para PS5 é similar, mas com uma diferença importante: o PS5 usa um protocolo de registro mais recente que exige uma chave de criptografia adicional derivada de informações do hardware. O Chiaki implementa isso transparentemente, mas versões muito antigas do aplicativo podem falhar.

No PS5, ative o Remote Play em **Configurações > Sistema > Remote Play > Ativar Remote Play**. O console precisa estar ligado (não em modo repouso) durante o pareamento.

```terminal
$ chiaki --register --host 192.168.1.151 --account-id 7a1b2c3d4e5f6g7h8i9j0k
[I] Registering with console at 192.168.1.151...
[I] Console identified as: PS5-9876543 (PS5)
[I] PIN displayed on console screen. Enter PIN: ********
[I] Pairing successful. Saved to ~/.config/chiaki/registry.json
```

Se o comando retornar `[E] Registration failed: PIN mismatch`, o mais provável é que o PIN tenha expirado ou sido digitado errado. Gere um novo PIN no console e tente novamente.

:::info
O PS5 oferece melhor qualidade de streaming que o PS4: suporta 1080p a 60 FPS com H.265, enquanto o PS4 base limita-se a 720p a 60 FPS (ou 1080p a 30 FPS no PS4 Pro). O Chiaki exibe essas capacidades na tela de configuração após o pareamento bem-sucedido.
:::

## Diagnóstico de falhas de pareamento

Se o registro falhar, o Chiaki não oferece mensagens muito descritivas — mas os logs do sistema contêm pistas. Execute o Chiaki pelo terminal para ver as mensagens de debug:

```terminal
$ flatpak run io.github.streetpea.Chiaki4Deck --log-level debug
[DEBUG] Attempting registration with 192.168.1.150...
[DEBUG] PSN Account ID: 7a1b2c3d4e5f6g7h8i9j0k
[ERROR] Registration failed: console unreachable (timeout)
```

As causas mais comuns e suas soluções:

| Sintoma | Causa provável | Solução |
|---|---|---|
| Timeout | Console inacessível na rede | Verificar IP, ping, firewall do roteador |
| PIN mismatch | PIN expirado ou digitado errado | Gerar novo PIN no console |
| Console not found | Broadcast bloqueado | Usar IP manual em vez de descoberta |
| Account ID rejected | PSN Account ID incorreto | Reobter Account ID pelo script |
| Already registered | Token anterior corrompido | Remover entrada em registry.json |

Para limpar um registro problemático e começar do zero:

```terminal
$ cat ~/.config/chiaki/registry.json
[
  {
    "name": "PS5-9876543",
    "host": "192.168.1.151",
    "psn_account_id": "7a1b2c3d4e5f6g7h8i9j0k",
    "remote_play_token": "ABCD1234..."
  }
]
```

Se o token estiver corrompido ou expirado, remova o arquivo ou edite-o manualmente para remover o objeto correspondente ao console problemático.

```terminal
$ rm ~/.config/chiaki/registry.json   ## Remove todos os registros
## Ou edite manualmente e remova apenas um console
```

Depois, repita o processo de registro — o console gerará um novo token.

## Gerenciando múltiplos consoles

O Chiaki suporta múltiplos consoles sem conflito. Cada entrada no `registry.json` é independente e o aplicativo exibe todos os consoles registrados na tela principal. Você pode ter um PS4 no quarto e um PS5 na sala, ambos configurados:

```json
[
  {
    "name": "PS4 Sala",
    "host": "192.168.1.150",
    "psn_account_id": "7a1b2c3d4e5f6g7h8i9j0k",
    "type": "ps4"
  },
  {
    "name": "PS5 Escritório",
    "host": "192.168.1.151",
    "psn_account_id": "7a1b2c3d4e5f6g7h8i9j0k",
    "type": "ps5"
  }
]
```

O Account ID é o mesmo para ambos porque pertence à sua conta PSN, não ao console. Apenas um console pode estar ativo por vez para streaming — se você tentar conectar a um segundo enquanto o primeiro está ativo, o Chiaki encerra a sessão anterior.

## Resumo

- O pareamento do Chiaki usa PSN Account ID + PIN de 8 dígitos para estabelecer um token criptografado permanente.
- O PS4 exige Remote Play ativado e console definido como primário para a conta em uso.
- O PS5 usa protocolo de registro mais recente com criptografia adicional, mas o Chiaki moderno lida com isso automaticamente.
- Falhas de registro são diagnosticadas executando o Chiaki pelo terminal com `--log-level debug`.
- Múltiplos consoles podem coexistir no `registry.json`; apenas um transmite por vez.

## Exercícios

1. Realize o pareamento completo entre o Chiaki e seu PS4 ou PS5. Registre cada passo em um bloco de notas, incluindo o IP do console e o Account ID usado.
2. Execute o Chiaki com logging debug (`--log-level debug`) e capture a saída durante um pareamento bem-sucedido. Identifique na saída as fases de descoberta, desafio e registro.
3. Provoque uma falha de pareamento: use um Account ID inválido. Qual mensagem de erro aparece? Compare com o log do console (se disponível).
4. Adicione um segundo console ao Chiaki (pode ser o mesmo PS4 registrado duas vezes com nomes diferentes) e verifique que ambos aparecem na tela principal.
5. **Desafio.** O arquivo `registry.json` armazena tokens em texto plano. Proponha uma estratégia de proteção desse arquivo usando permissões Linux, criptografia simétrica com `gpg` e um script que descriptografe o arquivo antes de iniciar o Chiaki.
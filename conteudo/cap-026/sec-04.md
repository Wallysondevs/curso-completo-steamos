Imprimir a partir de um Steam Deck soa incomum, mas no Modo Desktop o SteamOS é um sistema operacional completo, e cabe a você a decisão de mandar aquele documento, comprovante ou boarding pass para o papel. A impressão no Linux é dominada por um subsistema chamado **CUPS** (Common UNIX Printing System), que faz a ponte entre os aplicativos, o driver da impressora e o hardware. Entender o CUPS é o que separa "a impressora não funciona" de um problema resolvido em dois comandos.

:::objetivos
- Entender o papel do CUPS e do serviço que o sustenta
- Configurar uma impressora com a interface gráfica `system-config-printer`
- Instalar uma impressora pela linha de comando com `lpadmin`
- Ler o estado das impressoras e dos trabalhos com `lpstat`
:::

## CUPS, o spooler de impressão do Linux

No Linux, quando um aplicativo quer imprimir, ele não fala direto com a impressora. Ele entrega o trabalho a um **spooler** — uma fila — que o guarda e o despacha no momento certo, lidando com a impressora ocupada, papel acabado ou o cabo desconectado no momento errado. O spooler padrão do Linux é o CUPS, e ele roda como um serviço do systemd.

```terminal
$ systemctl status cups
● cups.service - CUPS Scheduler
     Loaded: loaded (/usr/lib/systemd/system/cups.service; enabled; preset: enabled)
     Active: active (running) since Sat 2025-08-16 14:06:02 -03; 3h 20min ago
TriggeredBy: ● cups.socket
             ● cups.path
       Docs: man:cupsd(8)
   Main PID: 912 (cupsd)
      Tasks: 1 (limit: 7684)
     Memory: 7.3M
        CPU: 894ms
     CGroup: /system.slice/cups.service
             └─912 /usr/bin/cupsd -l
```

Dois campos merecem destaque. O `TriggeredBy: cups.socket` mostra que o CUPS usa ativação por socket — o serviço sobe sob demanda quando alguém fala com ele, em vez de rodar ocioso. E o `enabled` garante que a impressão sobreviva ao reboot sem você precisar reiniciar nada manualmente.

O termo "scheduler" no nome oficial (`CUPS Scheduler`) vem da origem do CUPS como um agendador de trabalhos de impressão. Por de trás dele, a configuração vive em `/etc/cups/`, onde o arquivo `printers.conf` guarda as impressoras instaladas e o histórico dos trabalhos vai para `/var/log/cups/`.

:::nota
O CUPS hoje é mantido pela Apple (que adquiriu o projeto em 2007), e o suporte à impressão "de rede" via IPP (Internet Printing Protocol) acabou virando padrão universal — até impressoras do Windows e do macOS falam IPP. Isso significa que muitas impressoras modernas funcionam no Linux *sem driver proprietário*, apenas com o driver genérico IPP Everywhere.
:::

## Configurando via `system-config-printer`

O jeito mais amigável de adicionar uma impressora no Modo Desktop é o `system-config-printer`, uma interface gráfica que faz o papel de "adicionar impressora" sem exigir que você decore URIs e drivers. Ele descobre impressoras USB e de rede automaticamente.

```terminal
$ system-config-printer
```

Ao abrir, a janela lista as impressoras existentes (provavelmente vazia no primeiro uso) e oferece um botão "Add". O assistente varre a rede e o barramento USB, encontra a impressora, baixa o driver adequado dos repositórios do sistema e a instala como padrão. O valor desse assistente é a descoberta: ele traduz o que encontra numa **URI de dispositivo** (ex.: `usb://...`, `ipp://...`, `dnssd://...`) que o CUPS entende.

Atenção a um ponto: o `system-config-printer` é o front-end gráfico, mas o estado real das impressoras está sempre no CUPS por baixo. Qualquer coisa que você fizer na interface pode ser inspecionada depois na linha de comando — e vice-versa. Eles enxergam a mesma fila.

:::dica
Se a impressora é de rede e não aparece na descoberta, a causa mais comum é ela estar numa VLAN ou sub-rede diferente da do Deck, ou o multicast (mDNS/Bonjour) bloqueado no roteador. Nesses casos, adicione a impressora manualmente pela URI `ipp://<IP-da-impressora>/ipp/print` em vez de depender da descoberta.
:::

## Instalando uma impressora com `lpadmin`

A linha de comando expõe o mesmo caminho de forma explícita e repetível. O comando `lpadmin` cria ou modifica uma impressora, e a forma mínima de criar uma é:

```terminal
$ sudo lpadmin -p MinhaImpressora -E -v ipp://192.168.1.40/ipp/print -m everywhere
```

Vamos decompor cada opção:

- `-p MinhaImpressora` define o **nome** da fila (a identidade usada depois nos comandos de impressão).
- `-E` **habilita** a impressora e a aceita recebendo trabalhos (dois estados que o CUPS trata separadamente). Sem ele, a fila existe mas fica parada.
- `-v ipp://192.168.1.40/ipp/print` aponta para a **URI** do dispositivo — onde a impressora está.
- `-m everywhere` escolhe o **modelo de driver**; `everywhere` é o driver genérico IPP Everywhere, que funciona com a grande maioria das impressoras de rede modernas.

Para uma impressora USB, a URI muda (o CUPS monta algo como `usb://...`), e o modelo é especificado de forma diferente. O ponto essencial do `lpadmin` é que ele separa, com clareza, *o que a fila se chama*, *onde a impressora mora* e *com qual driver falar*.

:::atencao
`-p` (minúsculo) é o **nome da impressora**; `-P` (maiúsculo) é o **arquivo PPD** (o descritor de capacidades do driver). Trocar um pelo outro é um erro clássico. E `-E` também funciona como *flag de teste* em outros comandos do CUPS quando você quer forçar uma operação mesmo com a impressora desabilitada — o significado depende do contexto.
:::

## Lendo o estado com `lpstat`

Depois de instalar, o `lpstat` é o seu painel de leitura. Ele responde a três perguntas diferentes conforme as opções:

```terminal
$ lpstat -p -d
printer MinhaImpressora is idle.  enabled since Sat 2025-08-16 14:30:11 -03
no system default destination
```

- `-p` lista todas as impressoras e o estado de cada uma (`idle`, `disabled`, `printing`...).
- `-d` mostra qual é a **impressora padrão** do sistema — aqui, `no system default destination` avisa que nenhuma foi marcada como padrão, então os aplicativos podem perguntar toda vez.

Para tornar uma fila a padrão, use o próprio `lpadmin`:

```terminal
$ sudo lpadmin -d MinhaImpressora
$ lpstat -d
system default destination: MinhaImpressora
```

Com a impressora padrão definida, um `lp <arquivo>` já manda direto para ela, sem precisar nomear a fila. O `lpstat -p` detalhado também revela o motivo de uma fila parada: `disabled` com a razão entre aspas, como `"reason: paper tray empty"` — a ponte entre o sintoma e a solução.

## Resumo

- O CUPS é o spooler de impressão do Linux, controlado pelo serviço `cups` do systemd, que usa ativação por socket.
- `system-config-printer` é o assistente gráfico que descobre impressoras USB e de rede e instala o driver.
- `lpadmin -p <nome> -E -v <uri> -m everywhere` cria uma impressora de rede com o driver genérico IPP Everywhere.
- `-E` habilita e aceita a impressora para receber trabalhos; `-d` marca a fila como padrão.
- `lpstat -p -d` mostra o estado de cada impressora e qual é a padrão do sistema.

## Exercícios

1. Rode `systemctl status cups` e transcreva `Active`, `Loaded` e `TriggeredBy`.
2. Abra `system-config-printer` e adicione uma impressora (real ou de teste). Registre a URI que o assistente encontrou.
3. Crie uma impressora via `lpadmin -p ... -E -v ipp://... -m everywhere` e confirme com `lpstat -p`.
4. Marque a impressora como padrão com `lpadmin -d <nome>` e verifique com `lpstat -d`.
5. **Desafio.** Com uma impressora parada, desabilite-a com `cupsdisable <nome>`, rode `lpstat -p` para ver o estado `disabled`, depois reabilite com `cupsenable <nome>`. Explique a diferença entre "desabilitar" e "recusar trabalhos" (o comando `cupsreject`).

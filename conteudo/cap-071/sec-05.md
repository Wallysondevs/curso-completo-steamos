O Remote Play da Valve funciona, mas tem teto: codecs limitados, bitrate conservador. Para quem quer o máximo de qualidade no streaming local, a comunidade construiu uma alternativa aberta — **Sunshine** (servidor, no PC) e **Moonlight** (cliente, no Deck) — que chega perto do "nativo".

:::objetivos
- Compreender a história do protocolo GameStream e por que o Sunshine nasceu
- Instalar e configurar o Sunshine no PC host (Windows e Linux/Flatpak)
- Instalar o Moonlight no Steam Deck e emparelhar os dispositivos
- Explorar as vantagens sobre o Remote Play: HEVC, AV1, bitrate alto e baixa latência
- Dominar HDR, jogos fora da Steam e Wake-on-LAN
:::

## A história: do GameStream ao Sunshine

Moonlight começou como cliente **não-oficial** do GameStream, protocolo proprietário que a NVIDIA embutia nos drivers GeForce. Durante anos, bastava uma GPU GeForce e o Moonlight: os drivers expunham um servidor GameStream que Moonlight consumia perfeitamente.

Em 2023, a NVIDIA anunciou o **fim oficial do GameStream**. A comunidade respondeu criando o **Sunshine**, um servidor open-source que **reimplementa o protocolo do zero**, sem depender de hardware NVIDIA.

O melhor: o Moonlight continuou funcionando, pois não distingue servidor NVIDIA de Sunshine — o protocolo é o mesmo. Hoje:

- **Servidor**: Sunshine, em praticamente qualquer GPU (NVIDIA, AMD, Intel)
- **Cliente**: Moonlight, no Deck, TV, celular, navegador

O Sunshine usa encoders de hardware da GPU do host (**NVENC/NVDEC** e, mais recentemente, **AV1**) para comprimir vídeo com latência mínima; como o Moonlight fala codecs modernos, a qualidade supera o Remote Play em igualdade de rede.

:::info
**Por que "Sunshine"?** O luar (Moonlight) reflete a luz do sol (Sunshine) — nome justo para o projeto que passou a "iluminar" a transmissão quando a NVIDIA apagou o GameStream.
:::

## Instalando o Sunshine no PC host

O Sunshine é o servidor — roda no PC que **renderiza** o jogo, não no Deck.

### Em Windows

A instalação é direta: baixe o instalador do repositório oficial (*LizardByte/Sunshine* no GitHub), execute o `.exe` e aceite os prompts de firewall. Marque iniciar com o Windows, se preferir. O Sunshine roda como serviço em segundo plano.

Se a GPU for NVIDIA, o Sunshine usa NVENC — o mesmo encoder do GameStream. Em AMD ou Intel, usa AMF/VCE ou QSV. **Todos funcionam**, mas NVENC e o encoder AV1 das Radeon RX 7000 destacam-se em qualidade.

### Em Linux (Flatpak)

No Linux, o caminho recomendado pela comunidade é o **Flatpak**, que isola as dependências do servidor:

```terminal
## Instala o Sunshine a partir do Flathub
$ flatpak install flathub dev.lizardbyte.app.Sunshine

Looking for matches…
Required runtime for dev.lizardbyte.app.Sunshine/x86_64/stable
remote: flathub

 1. com.github.tchx84.Flatseal              stable      x86_64
 2. dev.lizardbyte.app.Sunshine             stable      x86_64

Which do you want to install (0 to abort)? [0-2]: 2

        ID                              Branch    Op   Remote
 1.     com.github.tchx84.Flatseal      stable    i    flathub
 2.     dev.lizardbyte.app.Sunshine     stable    i    flathub

Installation complete.
```

Depois de instalar, o Sunshine é configurado por uma **interface web** no host:

```terminal
## Inicia o Sunshine e exibe o endereço da interface web
$ flatpak run dev.lizardbyte.app.Sunshine & sleep 3

[Sunshine] Web UI available at: https://localhost:47990
[Sunshine] Local connections only. Password: (unset)
[Sunshine] Encoder pool: NVENC (NVIDIA RTX 4080) - H.264, HEVC, AV1
[Sunshine] Available displays: 1 (2560x1440 @ 144Hz)
```

A interface em `47990` é onde se ajusta resolução, bitrate, codecs e credenciais — o "painel de controle" do servidor.

:::atencao
**Navegador e certificado**: o Sunshine serve a UI em `https://localhost:47990` com certificado auto-assinado. O navegador vai reclamar de "conexão não segura"; é esperado, adicione a exceção. Na primeira execução, defina um nome de usuário e senha — essas credenciais protegem o painel, não o emparelhamento do Moonlight.
:::

## Instalando o Moonlight no Steam Deck

O Moonlight é Flatpak no Flathub, instalável pelo **Discover** ou terminal. Em modo Desktop:

```terminal
## Instala o Moonlight no Steam Deck
$ flatpak install flathub com.moonlight_stream.Moonlight

Looking for matches…
Required runtime for com.moonlight_stream.Moonlight/x86_64/stable
remote: flathub

 1. com.moonlight_stream.Moonlight         stable      x86_64

Which do you want to install (0 to abort)? [0-1]: 1

        ID                                     Branch    Op   Remote
 1.     com.moonlight_stream.Moonlight         stable    i    flathub

Installation complete.
```

Depois, confirme a versão instalada:

```terminal
$ flatpak run com.moonlight_stream.Moonlight --version
Moonlight Embedded 2.1.0 (Flatpak)
```

No Steam Deck, o fluxo:

1. Entre no **modo Desktop**
2. Abra o Moonlight — ele escaneia a rede e encontra o host com Sunshine
3. Selecione o host: o app pede um **PIN**
4. No PC host, acesse a UI do Sunshine, vá em **PIN** e digite o código exibido no Deck

O emparelhamento por PIN cria um vínculo permanente: o Deck não pede mais credenciais.

:::dica
**Moonlight no modo Gaming**: no Steam Desktop, use *Adicionar um jogo não-Steam* apontando para `flatpak run com.moonlight_stream.Moonlight`. Assim você abre o Moonlight direto do modo Gaming, sem ir ao Desktop.
:::

## Por que Moonlight+Sunshine supera o Remote Play

A Valve fez um trabalho honesto com o Remote Play, mas o Moonlight entrega **controle fino** que o Remote Play esconde:

| Aspecto | Remote Play da Valve | Moonlight + Sunshine |
|---------|----------------------|----------------------|
| Codecs | H.264 principalmente | H.264, HEVC/H.265, AV1 |
| Bitrate máximo | ~30-50 Mbps (conservador) | Até 150 Mbps configurável |
| Latência | Variável, auto-ajustada | Muito baixa, ajustável manualmente |
| Qualidade em rede boa | Boa | Próxima do nativo |
| Integração com Steam | Total (nativa) | Manual (atalho não-Steam) |
| Jogos fora da Steam | Complicado | Qualquer app/jogo do host |
| HDR | Parcial | Suportado (Deck OLED) |

O **HEVC/H.265** é o divisor de águas: mesma qualidade do H.264 com metade da banda — ou o dobro de qualidade na mesma banda. Numa rede Wi-Fi 5 GHz congestionada, é a diferença entre artefatos e imagem limpa.

O **AV1** dá o próximo salto. Em GPUs com encode AV1 (RTX 4000, RX 7000, Intel Arc), o Sunshine comprime com qualidade ainda maior. O Deck decodifica AV1 por hardware, sem custo de CPU.

:::atencao
**Bitrate alto não é grátis**: 150 Mbps exige Wi-Fi 5 GHz de qualidade ou, idealmente, cabo USB-C/Ethernet no Deck e cabo no PC. No Wi-Fi, comece em 30-40 Mbps e suba até aparecer latência ou perda de quadros; recue um pouco.
:::

### Suporte a HDR no Deck OLED

O modelo **OLED** do Deck tem tela HDR. Com Moonlight+Sunshine, transmite-se HDR do PC para o Deck, desde que o host tenha HDR ativo e o Sunshine e o Moonlight habilitem a opção. No Deck LCD, a tela não suporta HDR — o stream seria convertido para SDR.

### Jogando fora da Steam

A maior vantagem prática do Sunshine: virtualiza o desktop do host **inteiro**, não apenas jogos Steam. Você transmite:

- Jogos da Epic, GOG, Battle.net ou Xbox Game Pass
- Emuladores
- Qualquer aplicação do desktop

Basta adicionar "aplicações" no Sunshine apontando para o executável; o Moonlight as lista ao conectar, abrindo direto o jogo — sem a Steam.

### Wake-on-LAN: acordar o PC sem levantar da cama

Streaming local exige PC ligado. O **Wake-on-LAN (WoL)** resolve: um "pacote mágico" enviado pela rede acorda o PC em suspensão ou desligado.

Para usar com o Moonlight:

1. Habilite **Wake-on-LAN** na BIOS/UEFI e nas propriedades do adaptador de rede do PC host
2. Anote o **endereço MAC** do host
3. No Moonlight, ao encontrar o host offline, use a opção "wake" — o pacote mágico é enviado
4. Aguarde 10-30s para o PC iniciar e conecte normalmente

O WoL só funciona em **rede local** (não atravessa internet) e requer que a placa de rede continue alimentada com o PC "desligado".

:::exemplo
**Caso real**: ana tem um PC com RTX 4080 no escritório e joga na cama com o Deck OLED. Sunshine configurado com NVENC + AV1, WoL habilitado. No Moonlight, seleciona *Cyberpunk 2077* a 800p/60 FPS, bitrate 80 Mbps. Resultado: ray tracing no ultra, ~20ms de latência, 6+ horas de bateria — qualidade que a APU do Deck jamais alcançaria. Ao terminar, suspende o PC pelo Moonlight e dorme tranquilamente.
:::

## Resumo

- Moonlight nasceu como cliente do GameStream da NVIDIA; após o fim do protocolo, o Sunshine (servidor open-source) reimplementou-o sem depender de hardware específico
- O Sunshine roda em Windows (instalador) ou Linux (Flatpak) e é gerenciado pela UI em `https://localhost:47990`
- O Moonlight instala no Deck via Discover/Flatpak e pareia com o host por PIN validado na UI do Sunshine
- Sobre o Remote Play, o conjunto oferece HEVC/H.265, AV1, até 150 Mbps e menor latência — mas exige setup manual
- Recursos extras incluem HDR (Deck OLED), streaming de qualquer aplicação do desktop e Wake-on-LAN
- Com rede local de qualidade e GPU potente no host, o resultado é qualidade "quase nativa" com bateria de streaming

## Exercícios

1. Instale o Sunshine no PC host (Windows ou Linux) e acesse `https://localhost:47990`. Documente o encoder detectado (NVENC, AMF, QSV) e os codecs disponíveis.

2. Instale o Moonlight no Deck via Discover e faça o emparelhamento por PIN com o host. Registre quanto tempo levou até a conexão estabelecer após inserir o código.

3. No Sunshine, configure 30 Mbps com HEVC e teste 10 minutos num jogo AAA. Suba para 80 Mbps e compare: ganho visual, latência e perda de quadros. Documente os resultados.

4. Adicione ao Sunshine uma aplicação que **não** seja da Steam (jogo da Epic ou emulador) e valide que ela abre direto pelo Moonlight no Deck.

5. **Desafio integrador**: Monte a stack Moonlight+Sunshine completa e habilite Wake-on-LAN. Registre o passo a passo — do PC desligado ao jogo rodando no Deck — com tempos, codec, bitrate e configurações. Compare com o Remote Play da Valve nos mesmos jogos: latência, qualidade visual e bateria.

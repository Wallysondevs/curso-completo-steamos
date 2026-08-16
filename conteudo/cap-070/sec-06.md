Parsec e Steam Link não são as únicas opções. O ecossistema open source oferece alternativas poderosas: Moonlight+Sunshine (o herdeiro do NVIDIA GameStream) e Chiaki (streaming de PlayStation). Esta seção explora a instalação e configuração dessas ferramentas no SteamOS, com foco em cenários que nem o Parsec nem o Steam Link cobrem bem.

:::objetivos
- Instalar e configurar o Sunshine (servidor) e o Moonlight (cliente) no ecossistema Deck
- Instalar e configurar o Chiaki para streaming de PS4/PS5
- Comparar qualidade e latência dessas alternativas com Parsec e Steam Link
- Saber qual ferramenta escolher para cada situação específica
:::

## Moonlight + Sunshine: o sucessor open source

O Moonlight nasceu como cliente do NVIDIA GameStream, um protocolo proprietário de streaming da NVIDIA embutido nas GPUs GeForce. Quando a NVIDIA anunciou o fim do GameStream em 2023, o Sunshine — um servidor open source que implementa o mesmo protocolo — se tornou o par perfeito. Juntos, eles entregam a melhor qualidade de imagem entre todas as ferramentas de streaming, com latência comparável ao Parsec.

### Instalando o Moonlight (cliente) no Deck

O Moonlight está no Flathub e também no Discover:

```terminal
$ flatpak install flathub com.moonlight_stream.Moonlight
$ flatpak override --user --socket=wayland --socket=x11 --device=all --share=network com.moonlight_stream.Moonlight
```

### Instalando o Sunshine (servidor) no host

O Sunshine roda no host (Windows ou Linux) e expõe a mesma API do GameStream, mas usando codecs padrão. No Linux (host):

```terminal
# Ubuntu/Debian
$ sudo add-apt-repository ppa:ljfranklin/sunshine
$ sudo apt update && sudo apt install sunshine

# Arch (e SteamOS, se raiz desbloqueada)
$ yay -S sunshine

# Confirmar que o Sunshine está rodando:
$ systemctl --user status sunshine
● sunshine.service - Sunshine GameStream Server
     Active: active (running) since Sat 2025-08-16 15:00:00 UTC
```

A interface web de configuração do Sunshine fica em `https://localhost:47990`. Lá você ajusta codec, bitrate, resolução e mapeamento de controles — com granularidade maior que o Parsec.

### Por que Moonlight+Sunshine pode ser melhor que Parsec?

- **Qualidade de imagem superior.** O Sunshine usa NVENC/AMF/VAAPI com perfis de alta qualidade (não apenas baixa latência). O resultado é visível em jogos com muito detalhe estático (RPG, estratégia).
- **HDR funcional.** O Sunshine suporta HDR10 de ponta a ponta. Se você tem Deck OLED e host com GPU compatível, o streaming em HDR funciona — coisa que o Parsec ainda não entrega bem.
- **Totalmente open source.** Nada de contas, servidores de signaling proprietários ou limites de licença. Você controla tudo.
- **Clientes para tudo.** Moonlight roda em Android, iOS, tvOS, Linux, Windows, Raspberry Pi e até em browsers (via WebRTC).

A desvantagem: a configuração inicial é mais trabalhosa. O Sunshine precisa de pairing manual (um PIN de 4 dígitos na primeira conexão), e troubleshooting de codec exige ler logs.

```terminal
# Logs do Sunshine no host:
$ tail -f ~/.config/sunshine/logs/sunshine.log | grep -E 'codec|encoder|latency'
[INFO]  Encoder: h264_nvenc selected (quality preset)
[INFO]  Client latency: 3.2ms network + 4.1ms encode = 7.3ms total
```

### Pareando Moonlight com Sunshine

No Deck, abra o Moonlight. Ele escaneia a rede local por servidores Sunshine/GameStream. Selecione o host e anote o PIN de 4 dígitos. No host, acesse a interface web do Sunshine (`https://localhost:47990`) → PIN → digite o código. O par está feito.

```terminal
# No Deck, o pairing é salvo em:
$ cat ~/.var/app/com.moonlight_stream.Moonlight/data/moonlight/known_hosts.conf
192.168.1.100    abc123def456    Sunshine
```

## Chiaki: PlayStation no Deck

Chiaki é um cliente open source de Remote Play para PlayStation 4 e PlayStation 5. Se você tem um console Sony, pode transmitir seus jogos para o Deck com latência baixa e controles mapeados.

### Instalação

```terminal
$ flatpak install flathub re.chiaki.Chiaki
$ flatpak override --user --socket=wayland --socket=x11 --device=all re.chiaki.Chiaki
```

### Obtendo a credencial PSN (Account ID)

O Chiaki precisa do seu `account_id` da PSN (um número hexadecimal de 16 dígitos). Não é o seu nome de usuário — é um identificador interno. Para obtê-lo:

```terminal
# Usando a ferramenta auxiliar (Python):
$ pip install chiaki-psn
$ chiaki-psn get-account-id
Enter PSN username: seu_usuario
Account ID: 1a2b3c4d5e6f7g8h
```

Ou via script Python inline (sem instalar nada):

```terminal
$ python3 -c "
import urllib.request, json, base64
# Este método mudou; consulte a doc oficial do Chiaki para o fluxo atualizado
# A recomendação moderna é usar chiaki-psn ou o script psn-account-id.py do repositório
"
```

:::atencao
O método de obtenção do Account ID muda conforme a Sony atualiza sua API. Consulte sempre o README oficial do Chiaki em `https://github.com/streetpea/chiaki-ng` para o procedimento mais recente.
:::

### Configurando o Chiaki

Com o Account ID em mãos, abra o Chiaki, adicione um novo host (o IP do seu PS4/PS5 na rede) e insira o Account ID. O console precisa estar ligado ou em repouso com o Remote Play habilitado.

```terminal
# No PS5: Configurações → Sistema → Remote Play → Ativar Remote Play
# O PS5 precisa estar na mesma rede (ou com portas encaminhadas para acesso remoto)
```

O Chiaki detecta automaticamente a resolução e a taxa de quadros (até 1080p@60 no PS4 Pro/PS5). O mapeamento de controles é automático: o Deck é reconhecido como um DualSense.

### Qualidade e latência do Chiaki

Comparado ao Parsec (PC→Deck) e ao Steam Link (PC→Deck), o Chiaki (PS→Deck) tem características próprias:

| Métrica | Chiaki (PS5 local) | Parsec (PC local) |
|---|---|---|
| Resolução máxima | 1080p (PS5) / 720p (PS4 base) | 4K (escalado para 800p) |
| Codec | H.264 | H.264 / H.265 |
| Latência típica (rede cabeada) | 8–15 ms | 5–12 ms |
| Bitrate máximo | ~30 Mbps | Ilimitado (configurável) |
| HDR | Sim (PS5) | Experimental |

O Chiaki não vence o Parsec em latência bruta, mas vence em um ponto crucial: **acesso a exclusivos PlayStation**. Para jogar God of War, Spider-Man ou Horizon no Deck, o Chiaki é a única rota (sem contar cloud gaming, que é outro escopo).

## Tabela comparativa final

```
Ferramenta           | Client Deck | Host        | Codecs          | Latência | Coop | Open Source
---------------------|-------------|-------------|-----------------|----------|------|------------
Steam Remote Play    | Nativo      | PC (Steam)  | H.264/H.265     | Médio    | Sim* | Não
Parsec               | Flatpak     | PC (Win/Lin)| H.264/H.265     | Baixo    | Sim  | Não
Moonlight + Sunshine | Flatpak     | PC (Sunshine)| H.264/HEVC/AV1 | Baixo    | Não  | Sim
Chiaki               | Flatpak     | PS4/PS5     | H.264           | Médio    | Não  | Sim
```

*Apenas Steam Remote Play Together (convidados precisam de conta Steam e o jogo precisa suportar).

## Quando cada alternativa faz sentido

- **Moonlight+Sunshine:** você quer a melhor qualidade de imagem possível, tem tempo para configurar, valoriza open source e não precisa de cooperação remota.
- **Chiaki:** você tem um PlayStation e quer jogar seus exclusivos no Deck sem ocupar a TV.
- **Parsec:** você quer a menor latência, cooperação remota fácil ou streaming de jogos fora da Steam.
- **Steam Remote Play:** você quer zero configuração e só joga títulos da sua biblioteca Steam.

**Em resumo:** Moonlight+Sunshine é o padrão ouro em qualidade de imagem e controle; Chiaki é a ponte para o ecossistema PlayStation. Ambas são open source e complementam Parsec e Steam Link, cobrindo cenários que as ferramentas proprietárias não alcançam.

## Exercícios

1. Instale o Moonlight no Deck e o Sunshine no seu PC. Faça o pairing e inicie uma sessão de streaming. Compare a qualidade visual com o Parsec no mesmo jogo.
2. Acesse a interface web do Sunshine (`localhost:47990`). Explore as opções de codec e anote quais encoders de hardware estão disponíveis.
3. Se você tem um PS4 ou PS5, instale o Chiaki, obtenha seu Account ID e configure a conexão. Meça a latência aproximada com um jogo de ritmo.
4. Compare o uso de CPU do Deck durante o streaming nas 4 ferramentas: `htop` filtrado por `flatpak` enquanto cada uma transmite.
5. **Desafio.** Configure o Sunshine para usar AV1 (se sua GPU suportar) e conecte com o Moonlight. O Deck consegue decodificar AV1 por hardware? Verifique com `vainfo` e compare a qualidade visual com H.264 no mesmo bitrate.
Instalar o Chiaki no SteamOS é simples graças ao ecossistema Flatpak — o aplicativo está disponível diretamente no Discover, a loja de aplicativos do modo Desktop. Mas a instalação é só metade do caminho: a configuração inicial, com a obtenção do PSN Account ID e a descoberta do console, é onde a maioria dos problemas aparece. Esta seção cobre a instalação limpa e os primeiros passos de configuração, preparando o terreno para o pareamento que virá na seção seguinte.

:::objetivos
- Instalar o Chiaki ou Chiaki4Deck via Flatpak no SteamOS
- Entender as diferenças entre as opções de instalação disponíveis
- Obter o PSN Account ID da sua conta PlayStation
- Registrar manualmente o console via linha de comando
- Verificar que o Chiaki consegue enxergar o console na rede
:::

## Instalação via Discover (Flatpak)

O caminho mais rápido é abrir o Discover no modo Desktop do SteamOS e buscar por "Chiaki". O Flatpak oficial aparece com selo de verificado:

```terminal
$ flatpak search chiaki
Nome        Descrição                              ID do aplicativo             Versão  Remoto
Chiaki      Free and Open Source PS4/PS5 Remote…   io.github.streetpea.chiaki  2.2.0   flathub
Chiaki4Deck Fork do Chiaki otimizado para SD        io.github.streetpea.Chiaki4Deck 1.7.0 flathub
```

Para instalar pelo terminal (útil para automação ou troubleshooting):

```terminal
$ flatpak install flathub io.github.streetpea.Chiaki4Deck
Looking for matches…
io.github.streetpea.Chiaki4Deck permissions:
    ipc                   network                 pulseaudio
    wayland               x11                     dri
    [...]

        ID                           Ramo              Op           Remoto         Download
 1. [✓] io.github.streetpea.Chiaki4Deck stable           i            flathub        12,8 MB

Installation complete.
```

A instalação via Flatpak isola o Chiaki do resto do sistema — bibliotecas, codecs e dependências vêm empacotadas. Isso elimina problemas de compatibilidade com a camada somente-leitura do SteamOS. Se algo der errado, `flatpak remove` limpa tudo sem deixar rastros.

```terminal
$ flatpak list | grep -i chiaki
Chiaki4Deck    io.github.streetpea.Chiaki4Deck   stable  system
```

## Instalação via source (avançado)

Para quem quer compilar a versão mais recente ou testar correções que ainda não chegaram ao Flatpak, o Chiaki pode ser compilado a partir do código-fonte. O processo exige pacotes de desenvolvimento que só podem ser instalados em diretórios de usuário, já que o sistema de arquivos raiz do SteamOS é imutável:

```terminal
$ sudo steamos-readonly disable
$ sudo pacman -S --needed base-devel cmake qt6-base qt6-multimedia \
      qt6-tools libsodium ffmpeg opus protobuf
```

Esse comando só funciona depois de destravar o sistema de arquivos com `steamos-readonly disable` — e as alterações serão perdidas na próxima atualização do sistema. Por isso, a rota Flatpak é recomendada para a maioria dos casos.

:::atencao
Compilar a partir do source no SteamOS exige desabilitar o modo somente-leitura e instalar dependências no sistema. Na próxima atualização do SteamOS, esses pacotes serão removidos. Se você optar por esse caminho, mantenha um script com os comandos de reinstalação ou, melhor ainda, use o Flatpak.
:::

## Obtendo o PSN Account ID

O PSN Account ID é a chave que permite ao Chiaki se registrar no console PlayStation. Ele não é o seu nome de usuário da PSN nem o e-mail da conta — é um identificador numérico interno da Sony. Existem três formas de obtê-lo:

**Método 1: script Python (recomendado).** O repositório do Chiaki inclui um script que extrai o Account ID usando a API pública da PSN. Você precisa de um token de autenticação temporário:

```terminal
$ python3 psn-account-id.py
Please open the following URL in a browser:
https://www.playstation.com/...

After logging in, copy the URL you are redirected to and paste it here:
URL: https://store.playstation.com/...
Account ID: 7a1b2c3d4e5f6g7h8i9j0k
```

**Método 2: serviço web de terceiros.** Existem ferramentas online que extraem o Account ID a partir do seu perfil público da PSN, sem precisar de token. O risco é compartilhar seu nome de usuário com um serviço externo — use com cautela.

**Método 3: aplicativo PS App.** Em versões antigas do app, o Account ID aparecia em seções de compartilhamento; hoje esse método não é mais confiável. Prefira o script oficial.

```terminal
## O Account ID é um hash hexadecimal longo; guarde-o em um lugar seguro.
## No Chiaki, ele será usado uma única vez durante o pareamento.
$ echo "7a1b2c3d4e5f6g7h8i9j0k" > ~/.chiaki-account-id
```

:::dica
O PSN Account ID é imutável — você só precisa obtê-lo uma vez. Anote em um arquivo seguro (`~/.chiaki-account-id`) e use o mesmo valor para todos os consoles que adicionar ao Chiaki.
:::

## Primeiro teste de conectividade

Antes de partir para o pareamento, verifique se o Deck consegue alcançar o console:

```terminal
$ ping -c 5 192.168.1.150
PING 192.168.1.150 (192.168.1.150) 56(84) bytes of data.
64 bytes from 192.168.1.150: icmp_seq=1 ttl=64 time=1.23 ms
64 bytes from 192.168.1.150: icmp_seq=2 ttl=64 time=1.45 ms
64 bytes from 192.168.1.150: icmp_seq=3 ttl=64 time=1.38 ms
64 bytes from 192.168.1.150: icmp_seq=4 ttl=64 time=1.51 ms
64 bytes from 192.168.1.150: icmp_seq=5 ttl=64 time=1.33 ms

--- 192.168.1.150 ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 4004ms
rtt min/avg/max/mdev = 1.230/1.380/1.510/0.105 ms
```

Latência abaixo de 2 ms com 0% de perda de pacotes é o cenário ideal (console cabeado no roteador e Deck próximo). Se a latência oscilar acima de 5 ms ou houver perda, resolva o problema de rede antes de tentar o streaming — o Chiaki vai funcionar, mas com artefatos visuais e áudio robótico.

A interface gráfica do Chiaki também exibe o console automaticamente se ele estiver na mesma rede e com Remote Play ativado. Ao abrir o aplicativo após o Flatpak instalar, você verá uma tela de boas-vindas com um botão para adicionar novo console. Isso será abordado em detalhes na próxima seção.

## Resumo

- O Chiaki está disponível como Flatpak oficial no Discover; a instalação é simples e não exige destravar o sistema de arquivos.
- O Chiaki4Deck é o fork recomendado para Steam Deck, com interface adaptada e suporte a gyro.
- Compilar do source é possível mas exige `steamos-readonly disable` e pacotes de desenvolvimento que serão perdidos em atualizações.
- O PSN Account ID é um identificador numérico obtido via script Python, serviço web ou PS App; não é o nome de usuário da PSN.
- A conectividade de rede entre Deck e console deve ser verificada com `ping` antes de qualquer configuração de streaming.

## Exercícios

1. Instale o Chiaki4Deck pelo Discover no modo Desktop. Após a instalação, execute `flatpak list | grep chiaki` para confirmar que o pacote está registrado no sistema.
2. Obtenha seu PSN Account ID usando o script `psn-account-id.py` do repositório oficial. Salve o valor em `~/.chiaki-account-id` e proteja o arquivo com `chmod 600`.
3. Com o PS4 ou PS5 ligado e Remote Play ativado, execute `ping -c 10 <ip-do-console>` e registre a latência média e a perda de pacotes.
4. Localize o IP do console no Chiaki via descoberta automática: abra o app e veja se o console aparece na lista antes mesmo de digitar o IP manualmente.
5. **Desafio.** O Chiaki Flatpak tem permissões limitadas por padrão. Liste as permissões com `flatpak info io.github.streetpea.Chiaki4Deck` e explique qual delas é essencial para o streaming e qual poderia ser restringida em um ambiente de maior segurança.
document.addEventListener('DOMContentLoaded', () => {
    const videoPlayer = document.getElementById('videoPlayer');
    const channelList = document.getElementById('channelList');
    const searchInput = document.getElementById('searchChannel');
    const currentChannelTitle = document.getElementById('currentChannel');
    const m3uUrl = document.getElementById('m3uUrl');
    const loadM3uButton = document.getElementById('loadM3u');
    let channels = [];

    // Configurar HLS.js
    const hls = new Hls();
    hls.attachMedia(videoPlayer);

    hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        console.log('HLS.js inicializado correctamente');
    });

    // Cargar lista M3U automáticamente al iniciar
    async function loadM3UFromUrl(url) {
        try {
            channelList.innerHTML = '<div class="text-center p-3">Cargando lista de canales...</div>';
            // Usar el proxy de Vercel para evitar problemas de CORS
            const proxyUrl = `/proxy/${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`Error al cargar la lista: ${response.status} ${response.statusText}`);
            }
            const content = await response.text();
            
            // Validar el contenido de la respuesta
            if (!content) {
                throw new Error('La respuesta está vacía. Por favor, verifica la URL.');
            }
            if (!content || !content.includes('#EXTINF')) {
                throw new Error('No se pudo obtener una lista M3U válida. Por favor, verifica la URL.');
            }
            channels = parseM3U(content);
            if (channels.length === 0) {
                throw new Error('No se encontraron canales en la lista proporcionada.');
            }
            displayChannels(channels);
            console.log(`Se cargaron ${channels.length} canales correctamente`);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage = error.message || 'Error desconocido al cargar la lista';
            channelList.innerHTML = `<div class="alert alert-danger m-3" role="alert">
                ${errorMessage}
                <br><small>Intenta con otra URL o verifica tu conexión a internet.</small>
                <button class="btn btn-sm btn-outline-danger mt-2" onclick="retryLoad()">Reintentar carga</button>
            </div>`;
        }
    }

    // Función para reintentar la carga
    function retryLoad() {
        console.log('Reintentando carga de lista...');
        loadM3UFromUrl(m3uUrl.value);
        }
    }

    // Cargar lista automáticamente al iniciar
    loadM3UFromUrl(m3uUrl.value);

    // Función para parsear el contenido M3U
    function parseM3U(content) {
        const lines = content.split('\n');
        const channels = [];
        let currentChannel = null;

        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('#EXTINF:')) {
                const titleMatch = line.match(/,(.+)$/);
                currentChannel = {
                    title: titleMatch ? titleMatch[1].trim() : 'Canal sin nombre',
                    url: ''
                };
            } else if (line && !line.startsWith('#') && currentChannel) {
                currentChannel.url = line;
                channels.push(currentChannel);
                currentChannel = null;
            }
        });

        return channels;
    }

    // Mostrar canales en la lista
    function displayChannels(channelsToShow) {
        channelList.innerHTML = '';
        channelsToShow.forEach((channel, index) => {
            const item = document.createElement('a');
            item.href = '#';
            item.className = 'list-group-item list-group-item-action';
            item.textContent = channel.title;
            item.onclick = (e) => {
                e.preventDefault();
                playChannel(channel);
                // Actualizar selección activa
                document.querySelectorAll('.list-group-item').forEach(el => {
                    el.classList.remove('active');
                });
                item.classList.add('active');
            };
            channelList.appendChild(item);
        });
    }

    // Reproducir canal seleccionado
    function playChannel(channel) {
        currentChannelTitle.textContent = channel.title;
        if (Hls.isSupported()) {
            hls.loadSource(channel.url);
        } else if (videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
            videoPlayer.src = channel.url;
        }
    }

    // Búsqueda de canales
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredChannels = channels.filter(channel =>
            channel.title.toLowerCase().includes(searchTerm)
        );
        displayChannels(filteredChannels);
    });
    // Cargar lista M3U desde URL cuando se hace clic en el botón
    loadM3uButton.addEventListener('click', () => {
        loadM3UFromUrl(m3uUrl.value);
    });
});
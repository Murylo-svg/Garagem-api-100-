document.addEventListener('DOMContentLoaded', function() {

    async function loadHTML(filePath, placeholderElement) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Erro ao carregar ${filePath}: ${response.statusText}`);
            const html = await response.text();
            if (placeholderElement) {
                placeholderElement.innerHTML = html;
                return placeholderElement.firstChild;
            }
            return null;
        } catch (error) {
            console.error('Falha ao carregar HTML parcial:', error);
            if (placeholderElement) placeholderElement.innerHTML = `<p style="color:red;">Erro ao carregar componente.</p>`;
            return null;
        }
    }

    function loadScript(filePath, callback) {
        const script = document.createElement('script');
        script.src = filePath;
        script.onload = () => {
            if (callback) callback();
        };
        script.onerror = () => console.error(`Erro ao carregar script: ${filePath}`);
        document.body.appendChild(script);
    }

    async function loadVehicles() {
        const vehiclesToLoad = [
            { name: 'carro-normal', placeholderId: 'placeholder-carro-normal', script: 'js/veiculos/carroNormal.js', initFunc: 'initCarroNormal' },
            { name: 'carro-esportivo', placeholderId: 'placeholder-carro-esportivo', script: 'js/veiculos/carroEsportivo.js', initFunc: 'initCarroEsportivo' },
            { name: 'caminhao', placeholderId: 'placeholder-caminhao', script: 'js/veiculos/caminhao.js', initFunc: 'initCaminhao' }
        ];

        for (const vehicle of vehiclesToLoad) {
            const placeholderElement = document.getElementById(vehicle.placeholderId);
            if (placeholderElement) {
                const cardElement = await loadHTML(`partials/${vehicle.name}.html`, placeholderElement);
                if (cardElement) {
                    loadScript(vehicle.script, () => {
                        if (window[vehicle.initFunc] && typeof window[vehicle.initFunc] === 'function') {
                            window[vehicle.initFunc](cardElement);
                        }
                    });
                }
            }
        }
    }

    const veiculoSelect = document.getElementById('veiculo-select');
    const modSections = document.querySelectorAll('.mod-section');

    if (veiculoSelect && modSections.length > 0) {
        veiculoSelect.addEventListener('change', function() {
            modSections.forEach(section => section.style.display = 'none');
            const selectedSectionId = this.value + '-content';
            const selectedSection = document.getElementById(selectedSectionId);
            if (selectedSection) {
                selectedSection.style.display = 'block';
            }
        });
        if(veiculoSelect.options.length > 0) {
             veiculoSelect.dispatchEvent(new Event('change'));
        }
    }

    const cidadeInput = document.getElementById('cidade-input');
    const buscarTempoBtn = document.getElementById('buscar-tempo-btn');
    const forecastContainer = document.getElementById('weather-forecast-container');
    const weatherErrorEl = document.getElementById('weather-error');

    if (buscarTempoBtn) {
        buscarTempoBtn.addEventListener('click', fetchWeatherForecast);
    }
    if (cidadeInput) {
        cidadeInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') fetchWeatherForecast();
        });
    }

    async function fetchWeatherForecast() {
        const cidade = cidadeInput.value.trim();
        if (!cidade) {
            displayWeatherError("Por favor, digite o nome de uma cidade.");
            return;
        }

        forecastContainer.innerHTML = '<p style="text-align:center;">Buscando previsão...</p>';
        if (weatherErrorEl) weatherErrorEl.textContent = '';

        const apiUrl = `http://localhost:3001/api/previsao/${cidade}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Cidade "${cidade}" não encontrada.`);
            }
            const data = await response.json();
            displayWeatherForecast(data);
        } catch (error) {
            console.error("Erro na API de previsão do tempo:", error);
            displayWeatherError(error.message);
        }
    }

    function displayWeatherForecast(data) {
        if (!forecastContainer) return;
        forecastContainer.innerHTML = ''; 

        const dailyForecasts = {};
        data.list.forEach(item => {
            const dateString = new Date(item.dt_txt).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
            if (!dailyForecasts[dateString] && Object.keys(dailyForecasts).length < 5) {
                dailyForecasts[dateString] = item;
            }
        });

        for (const dateKey in dailyForecasts) {
            const dayData = dailyForecasts[dateKey];
            const iconUrl = `https://openweathermap.org/img/wn/${dayData.weather[0].icon}@2x.png`;
            forecastContainer.innerHTML += `
                <div class="forecast-day">
                    <h4>${dateKey}</h4>
                    <img src="${iconUrl}" alt="${dayData.weather[0].description}">
                    <p class="temp">${Math.round(dayData.main.temp)}°C</p>
                    <p>${dayData.weather[0].description}</p>
                </div>
            `;
        }
    }

    function displayWeatherError(message) {
        if (forecastContainer) forecastContainer.innerHTML = '';
        if (weatherErrorEl) weatherErrorEl.textContent = message;
    }

    async function carregarProdutos() {
        const listaProdutosDiv = document.getElementById('produtos-lista');
        if (!listaProdutosDiv) return;

        try {
            const response = await fetch('https://garagem-api-100.onrender.com/api/produtos');
            if (!response.ok) throw new Error('Falha na resposta da rede.');
            
            const produtos = await response.json();
            listaProdutosDiv.innerHTML = '';

            if (produtos.length === 0) {
                listaProdutosDiv.innerHTML = '<p>Nenhum produto no inventário.</p>';
                return;
            }

            produtos.forEach(produto => {
                const produtoHtml = `
                    <div class="item-card">
                        <h3>${produto.nome}</h3>
                        <p><strong>Preço:</strong> R$ ${produto.preco.toFixed(2).replace('.', ',')}</p>
                        <p><strong>Estoque:</strong> ${produto.estoque} unidades</p>
                    </div>
                `;
                listaProdutosDiv.innerHTML += produtoHtml;
            });

        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            listaProdutosDiv.innerHTML = '<p style="color: red;">Erro ao carregar inventário.</p>';
        }
    }

    async function carregarUsuarios() {
        const listaUsuariosDiv = document.getElementById('usuarios-lista');
        if (!listaUsuariosDiv) return;

        try {
            const response = await fetch('http://localhost:3001/api/usuarios');
            if (!response.ok) throw new Error('Falha na resposta da rede.');

            const usuarios = await response.json();
            listaUsuariosDiv.innerHTML = '';

            if (usuarios.length === 0) {
                listaUsuariosDiv.innerHTML = '<p>Nenhum membro na equipe.</p>';
                return;
            }

            usuarios.forEach(usuario => {
                const usuarioHtml = `
                    <div class="item-card">
                        <h3>${usuario.nome}</h3>
                        <p><strong>E-mail:</strong> ${usuario.email}</p>
                        <p><strong>Plano/Cargo:</strong> ${usuario.plano}</p>
                    </div>
                `;
                listaUsuariosDiv.innerHTML += usuarioHtml;
            });
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            listaUsuariosDiv.innerHTML = '<p style="color: red;">Erro ao carregar a equipe.</p>';
        }
    }

    loadVehicles();
    carregarProdutos();
    carregarUsuarios();

});

document.addEventListener('DOMContentLoaded', () => {
    const menuIcon = document.getElementById('menu-icon');
    const menuDropdown = document.getElementById('menu-dropdown');

    if (menuIcon && menuDropdown) {
        menuIcon.addEventListener('click', () => {

            menuIcon.classList.toggle('active');
            menuDropdown.classList.toggle('active');
        });

        document.addEventListener('click', (event) => {
            if (!menuIcon.contains(event.target) && !menuDropdown.contains(event.target)) {
                menuIcon.classList.remove('active');
                menuDropdown.classList.remove('active');
            }
        });
    }
});
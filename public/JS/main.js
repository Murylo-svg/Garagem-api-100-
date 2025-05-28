document.addEventListener('DOMContentLoaded', function() {

    // Função para carregar HTML de um arquivo em um elemento placeholder
    async function loadHTML(filePath, placeholderElement) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Erro ao carregar ${filePath}: ${response.statusText}`);
            }
            const html = await response.text();
            if (placeholderElement) {
                placeholderElement.innerHTML = html;
                return placeholderElement.firstChild; // Retorna o elemento do card inserido
            } else {
                console.error(`Placeholder não fornecido para ${filePath}.`);
                return null;
            }
        } catch (error) {
            console.error('Falha ao carregar HTML parcial:', error);
            if (placeholderElement) {
                placeholderElement.innerHTML = `<p style="color:red;">Erro ao carregar componente.</p>`;
            }
            return null;
        }
    }

    // Função para carregar um script dinamicamente
    function loadScript(filePath, callback) {
        const script = document.createElement('script');
        script.src = filePath;
        script.onload = () => {
            console.log(`${filePath} carregado com sucesso.`);
            if (callback) callback();
        };
        script.onerror = () => console.error(`Erro ao carregar script: ${filePath}`);
        document.body.appendChild(script); // Adiciona ao final do body
    }

    // Carregar os veículos e inicializar seus scripts
    async function loadVehicles() {
        const vehiclesToLoad = [
            { name: 'carro-normal', placeholderId: 'placeholder-carro-normal', script: 'js/veiculos/carroNormal.js', initFunc: 'initCarroNormal' },
            { name: 'carro-esportivo', placeholderId: 'placeholder-carro-esportivo', script: 'js/veiculos/carroEsportivo.js', initFunc: 'initCarroEsportivo' },
            { name: 'caminhao', placeholderId: 'placeholder-caminhao', script: 'js/veiculos/caminhao.js', initFunc: 'initCaminhao' }
        ];

        for (const vehicle of vehiclesToLoad) {
            const placeholderElement = document.getElementById(vehicle.placeholderId);
            if (placeholderElement) {
                // Carrega o HTML do card do veículo
                const cardElement = await loadHTML(`partials/${vehicle.name}.html`, placeholderElement);
                
                if (cardElement) {
                    // Carrega o script JS específico do veículo e chama sua função de inicialização
                    loadScript(vehicle.script, () => {
                        if (window[vehicle.initFunc] && typeof window[vehicle.initFunc] === 'function') {
                            window[vehicle.initFunc](cardElement); // Passa o elemento do card
                        } else {
                            console.error(`Função de inicialização ${vehicle.initFunc} não encontrada ou não é uma função após carregar ${vehicle.script}`);
                        }
                    });
                }
            } else {
                console.warn(`Placeholder ${vehicle.placeholderId} não encontrado.`);
            }
        }
    }

    // Lógica para troca de abas na seção de manutenção (permanece a mesma)
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
        // Disparar o evento change inicialmente para mostrar a primeira aba correta (se houver opções)
        if(veiculoSelect.options.length > 0) {
             veiculoSelect.dispatchEvent(new Event('change'));
        }
    } else {
        if(!veiculoSelect) console.warn("Elemento #veiculo-select não encontrado para a lógica de manutenção.");
        if(modSections.length === 0) console.warn("Nenhuma .mod-section encontrada para a lógica de manutenção.");
    }


    // --- INICIALIZAÇÃO ---
    loadVehicles(); // Carrega os cards dos veículos e seus respectivos scripts de controle

});

document.addEventListener('DOMContentLoaded', function() {
    // ... (código existente dentro do DOMContentLoaded, como loadVehicles(), lógica de manutenção, etc.) ...

    // --- LÓGICA DA PREVISÃO DO TEMPO ---
    const cidadeInput = document.getElementById('cidade-input');
    const buscarTempoBtn = document.getElementById('buscar-tempo-btn');
    const forecastContainer = document.getElementById('weather-forecast-container');
    const weatherErrorEl = document.getElementById('weather-error');
    const API_KEY = '5d010e190f8d06a7d915f72414637cf3'; // <--- SUBSTITUA PELA SUA API KEY REAL!

    if (buscarTempoBtn) {
        buscarTempoBtn.addEventListener('click', fetchWeatherForecast);
    }
    if (cidadeInput) {
        cidadeInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                fetchWeatherForecast();
            }
        });
    }


    async function fetchWeatherForecast() {
        const cidade = cidadeInput.value.trim();
        if (!cidade) {
            displayError("Por favor, digite o nome de uma cidade.");
            return;
        }
        if (API_KEY === '') {
            displayError("Configure sua chave de API da OpenWeatherMap no código JavaScript.");
            return;
        }

        forecastContainer.innerHTML = '<p style="text-align:center;">Buscando previsão...</p>'; // Feedback visual
        weatherErrorEl.textContent = ''; // Limpa erros anteriores

        const apiUrl = `http://localhost:3001/api/previsao/${cidade}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Chave de API inválida ou não ativada. Verifique sua chave.");
                } else if (response.status === 404) {
                    throw new Error(`Cidade "${cidade}" não encontrada.`);
                } else {
                    throw new Error(`Erro ao buscar dados: ${response.statusText}`);
                }
            }
            const data = await response.json();
            displayWeatherForecast(data);
        } catch (error) {
            console.error("Erro na API de previsão do tempo:", error);
            displayError(error.message);
        }
    }

    function displayWeatherForecast(data) {
        forecastContainer.innerHTML = ''; // Limpa o container

        if (data.cod !== "200") {
            displayError(data.message || "Erro ao obter dados da previsão.");
            return;
        }

        // O API "5 day / 3 hour forecast" retorna uma lista de previsões.
        // Vamos pegar uma previsão por dia, por exemplo, a do meio-dia.
        // Ou, mais simples, agrupar por dia e pegar a primeira ocorrência de cada dia.
        const dailyForecasts = {};
        data.list.forEach(item => {
            const date = new Date(item.dt_txt.split(' ')[0]); // Pega só a parte da data
            const dateString = date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

            if (!dailyForecasts[dateString]) { // Se ainda não temos previsão para este dia
                // Só adiciona se não ultrapassarmos 5 dias únicos
                if (Object.keys(dailyForecasts).length < 5) {
                     dailyForecasts[dateString] = item;
                }
            } else {
                // Se já temos uma previsão para este dia, podemos pegar a do meio-dia se disponível,
                // ou manter a primeira. Para simplificar, vamos manter a primeira do dia.
                // Poderia ser mais complexo, como pegar a média, máxima/mínima do dia etc.
            }
        });
        
        if (Object.keys(dailyForecasts).length === 0) {
            displayError("Não foram encontrados dados de previsão para os próximos dias.");
            return;
        }

        for (const dateKey in dailyForecasts) {
            const dayData = dailyForecasts[dateKey];
            const forecastDiv = document.createElement('div');
            forecastDiv.classList.add('forecast-day');

            const iconCode = dayData.weather[0].icon;
            //b6057439492c09d60954fe68a2bef1f3

            //https://api.openweathermap.org/data/2.5/weather?q={city name}&appid={API key}

            const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

            forecastDiv.innerHTML = `
                <h4>${dateKey}</h4>
                <img src="${iconUrl}" alt="${dayData.weather[0].description}">
                <p class="temp">${Math.round(dayData.main.temp)}°C</p>
                <p>${dayData.weather[0].description}</p>
                <p>Min: ${Math.round(dayData.main.temp_min)}°C / Max: ${Math.round(dayData.main.temp_max)}°C</p>
                <p>Vento: ${Math.round(dayData.wind.speed * 3.6)} km/h</p> <!-- Convertendo m/s para km/h -->
            `;
            forecastContainer.appendChild(forecastDiv);
        }
    }

    function displayError(message) {
        forecastContainer.innerHTML = ''; // Limpa container de previsão se houver erro
        weatherErrorEl.textContent = message;
    }

});// ... (todo o código JavaScript existente do main.js) ...

document.addEventListener('DOMContentLoaded', function() {
    // ... (código existente da previsão de 5 dias, carregamento de veículos, etc.) ...

    // --- LÓGICA DA CONSULTA RÁPIDA DE TEMPO ATUAL ---
    const cidadeConsultaInput = document.getElementById('cidade-consulta-input');
    const buscarConsultaBtn = document.getElementById('buscar-consulta-btn');
    const currentContainer = document.getElementById('weather-current-container');
    const weatherConsultaErrorEl = document.getElementById('weather-consulta-error');

    // API_KEY já está definida na parte da previsão de 5 dias, vamos reutilizá-la.
    // const API_KEY = 'SUA_API_KEY_AQUI'; // Já definida acima

    if (buscarConsultaBtn) {
        buscarConsultaBtn.addEventListener('click', fetchCurrentWeather);
    }
    if (cidadeConsultaInput) {
        cidadeConsultaInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                fetchCurrentWeather();
            }
        });
    }

    async function fetchCurrentWeather() {
        const cidade = cidadeConsultaInput.value.trim();
    if (!cidade) {
        displayConsultaError("Por favor, digite o nome de uma cidade para consulta.");
        return;
    }

    if (!API_KEY || API_KEY === 'SUA_API_KEY_AQUI') {
        console.error("ERRO: Chave da API não configurada!"); // Erro mais forte
        displayConsultaError("Erro de configuração: Chave da API não definida.");
        return; // Impede a chamada à API
    } else if (API_KEY === '5d010e190f8d06a7d915f72414637cf3') {
         console.warn("Lembrete (Consulta Rápida): Para uso em produção ou sem limitações, use sua chave de API pessoal da OpenWeatherMap.");
    }


    currentContainer.innerHTML = '<p style="text-align:center;">Buscando tempo atual...</p>';
    currentContainer.classList.remove('empty');
    weatherConsultaErrorEl.textContent = '';

    const apiUrlCurrent = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${API_KEY}&units=metric&lang=pt_br`;

        try {
            const response = await fetch(apiUrlCurrent);
            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Chave de API inválida, não ativada ou com problemas. Verifique sua chave.");
                } else if (response.status === 404) {
                    throw new Error(`Cidade "${cidade}" não encontrada para consulta.`);
                } else {
                    const errorData = await response.json();
                    throw new Error(`Erro ao buscar dados (${response.status}): ${errorData.message || response.statusText}`);
                }
            }
            const data = await response.json();
            displayCurrentWeather(data);
        } catch (error) {
            console.error("Erro na API de tempo atual:", error);
            displayConsultaError(error.message);
        }
    }

    function displayCurrentWeather(data) {
        currentContainer.innerHTML = ''; // Limpa o container
        currentContainer.classList.remove('empty');


        if (!data || data.cod !== 200) {
            displayConsultaError(data.message || "Erro ao obter dados do tempo atual.");
            return;
        }

        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        currentContainer.innerHTML = `
            <h4>${data.name}, ${data.sys.country}</h4>
            <img src="${iconUrl}" alt="${data.weather[0].description}">
            <p class="temp">${Math.round(data.main.temp)}°C</p>
            <p>Sensação: ${Math.round(data.main.feels_like)}°C</p>
            <p>${data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)}</p>
            <p>Umidade: ${data.main.humidity}%</p>
            <p>Vento: ${Math.round(data.wind.speed * 3.6)} km/h</p>
        `;
    }

    function displayConsultaError(message) {
        currentContainer.innerHTML = '';
        currentContainer.classList.add('empty'); // Adiciona classe para remover estilos de card se estiver vazio
        weatherConsultaErrorEl.textContent = message;
    }

});// ... (código JS existente) ...

document.addEventListener('DOMContentLoaded', function() {
    // ... (carregamento de veículos, etc.) ...

    // --- LÓGICA DA PREVISÃO DO TEMPO PARA VIAGEM (5 DIAS) ---
    const cidadeInputViagem = document.getElementById('cidade-input-viagem');
    const estadoInputViagem = document.getElementById('estado-input-viagem'); // Manter referência
    const paisInputViagem = document.getElementById('pais-input-viagem');     // Manter referência
    const suggestionsContainerViagem = document.getElementById('city-suggestions-viagem');
    const buscarTempoBtnViagem = document.getElementById('buscar-tempo-btn-viagem');
    const forecastContainer = document.getElementById('weather-forecast-container');
    const weatherErrorEl = document.getElementById('weather-error');
    
    // API_KEY já definida
    let geocodeTimeout; // Para debounce da busca de geocodificação

    if (cidadeInputViagem) {
        cidadeInputViagem.addEventListener('input', handleCityInputViagem);
        cidadeInputViagem.addEventListener('blur', () => {
            // Esconder sugestões após um pequeno delay para permitir clique na sugestão
            setTimeout(() => {
                if (suggestionsContainerViagem) suggestionsContainerViagem.style.display = 'none';
            }, 200);
        });
    }

    if (buscarTempoBtnViagem) {
        buscarTempoBtnViagem.addEventListener('click', fetchWeatherForecastViagem);
    }
    
    // Função para buscar sugestões de cidade (Geocoding API)
    async function fetchCitySuggestions(query) {
        if (!query || query.length < 3) { // Só busca com pelo menos 3 caracteres
            if (suggestionsContainerViagem) {
                suggestionsContainerViagem.innerHTML = '';
                suggestionsContainerViagem.style.display = 'none';
            }
            return;
        }

        // Usar o endpoint de geocodificação direta
        const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;
        // console.log("Geocode URL:", geocodeUrl);

        try {
            const response = await fetch(geocodeUrl);
            if (!response.ok) {
                console.error("Erro na API de Geocodificação:", response.statusText);
                if (suggestionsContainerViagem) suggestionsContainerViagem.style.display = 'none';
                return;
            }
            const data = await response.json();
            displayCitySuggestions(data);
        } catch (error) {
            console.error("Falha ao buscar sugestões de cidade:", error);
            if (suggestionsContainerViagem) suggestionsContainerViagem.style.display = 'none';
        }
    }

    // Função para mostrar as sugestões
    function displayCitySuggestions(suggestions) {
        if (!suggestionsContainerViagem) return;

        suggestionsContainerViagem.innerHTML = '';
        if (suggestions && suggestions.length > 0) {
            suggestions.forEach(city => {
                const suggestionDiv = document.createElement('div');
                let displayText = city.name;
                if (city.state) {
                    displayText += `, ${city.state}`;
                }
                if (city.country) {
                    displayText += ` (${city.country})`;
                }
                suggestionDiv.textContent = displayText;
                suggestionDiv.addEventListener('click', () => {
                    cidadeInputViagem.value = city.name; // Preenche o campo cidade
                    if (estadoInputViagem && city.state) estadoInputViagem.value = city.state;
                    else if (estadoInputViagem) estadoInputViagem.value = ''; // Limpa se não houver estado

                    if (paisInputViagem && city.country) paisInputViagem.value = city.country;
                    else if (paisInputViagem) paisInputViagem.value = 'BR'; // Default ou limpa

                    suggestionsContainerViagem.style.display = 'none';
                    // Opcional: buscar previsão automaticamente ao selecionar
                    // fetchWeatherForecastViagem(); 
                });
                suggestionsContainerViagem.appendChild(suggestionDiv);
            });
            suggestionsContainerViagem.style.display = 'block';
        } else {
            const noSuggestionDiv = document.createElement('div');
            noSuggestionDiv.textContent = 'Nenhuma sugestão encontrada.';
            noSuggestionDiv.classList.add('no-suggestion');
            suggestionsContainerViagem.appendChild(noSuggestionDiv);
            suggestionsContainerViagem.style.display = 'block';
        }
    }

    // Handler para o input da cidade com debounce
    function handleCityInputViagem(event) {
        const query = event.target.value;
        clearTimeout(geocodeTimeout); // Limpa timeout anterior
        geocodeTimeout = setTimeout(() => {
            fetchCitySuggestions(query);
        }, 500); // Espera 500ms após o usuário parar de digitar
    }

    // Função para buscar a previsão do tempo (ajustada para usar os campos)
    async function fetchWeatherForecastViagem() {
        const cidade = cidadeInputViagem.value.trim();
        // Os campos de estado e país agora são preenchidos pela sugestão ou podem ser usados se não forem readonly
        const estado = estadoInputViagem.value.trim().toUpperCase();
        const pais = paisInputViagem.value.trim().toUpperCase();

        if (!cidade) {
            displayError("Por favor, digite ou selecione uma cidade.");
            return;
        }
        // ... (restante da função fetchWeatherForecastViagem como antes, montando a queryString) ...
        let queryString = cidade;
        if (estado) {
            queryString += `,${estado}`;
        }
        if (pais) {
            if (estado || (!estado && pais)) {
                 queryString += `,${pais}`;
            }
        }
        // ... (continua com a chamada fetch e display) ...
        const apiUrl = `http://localhost/api/previsao/${encodeURIComponent(cidade)}` 
        console.log("API URL (Viagem):", apiUrl);

        forecastContainer.innerHTML = '<p style="text-align:center;">Buscando previsão...</p>';
        weatherErrorEl.textContent = '';

        try {
            const response = await fetch(apiUrl);
            // ... (tratamento de erro e sucesso como antes) ...
            if (!response.ok) {
                let errorMessage = `Erro ao buscar dados (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMessage = `Erro (${response.status}): ${errorData.message || response.statusText}`;
                } catch (e) {
                     errorMessage = `Erro ao buscar dados (${response.status}): ${response.statusText}`;
                }

                if (response.status === 401) {
                    throw new Error("Chave de API inválida, não ativada ou com problemas. Verifique sua chave.");
                } else if (response.status === 404) {
                    throw new Error(`Localização "${queryString}" não encontrada.`);
                } else {
                    throw new Error(errorMessage);
                }
            }
            const data = await response.json();
            displayWeatherForecast(data); // Reutiliza a função de display
        } catch (error) {
            console.error("Erro na API de previsão do tempo (Viagem):", error);
            displayError(error.message); // Reutiliza a função de display de erro
        }
    }
    
    // As funções displayWeatherForecast(data) e displayError(message) permanecem as mesmas.

    // --- LÓGICA DA CONSULTA RÁPIDA DE TEMPO ATUAL ---
    // ... (se quiser aplicar autocomplete aqui, a lógica será similar) ...

}); // Fim do DOMContentLoaded
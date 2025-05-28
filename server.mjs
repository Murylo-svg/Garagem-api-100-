// server.js
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// __filename e __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001; // Porta para o servidor backend
const apiKey = process.env.OPENWEATHER_API_KEY;

// Middleware para permitir que o frontend (rodando em outra porta) acesse este backend
// (CORS - Cross-Origin Resource Sharing)
app.use((req, res, next) => {
    // Permite acesso de qualquer origem. Em produção, restrinja para o seu domínio frontend.
    // Ex: res.header('Access-Control-Allow-Origin', 'http://localhost:5500'); // Se seu frontend roda na porta 5500
    // Ex: res.header('Access-Control-Allow-Origin', 'https://seusite.com');
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(path.join(__dirname, "public")))

// Middleware para parsear JSON no corpo das requisições (útil para POST/PUT, mas bom ter)
app.use(express.json());

// ----- ENDPOINT: Previsão do Tempo (5 dias / 3 horas) -----
// Rota: GET /api/previsao/:cidade
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params; // Pega o parâmetro :cidade da URL

    if (!apiKey) {
        console.error('[Servidor] Erro: Chave da API OpenWeatherMap não configurada no servidor.');
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }
    if (!cidade) {
        return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    }

    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor] Buscando previsão de 5 dias para: ${cidade} na URL: ${weatherAPIUrl.replace(apiKey, 'SUA_CHAVE_OCULTA')}`);
        const apiResponse = await axios.get(weatherAPIUrl);
        console.log(`[Servidor] Dados da previsão de 5 dias recebidos da OpenWeatherMap para: ${cidade}`);
        
        res.json(apiResponse.data);

    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar previsão do tempo no servidor.';
        console.error(`[Servidor] Erro ${status} ao buscar previsão de 5 dias para ${cidade}:`, message, error.response?.data || error.message);
        res.status(status).json({ error: message });
    }
});

// ----- ENDPOINT: Tempo Atual -----
// Rota: GET /api/tempoatual/:cidade
app.get('/api/tempoatual/:cidade', async (req, res) => {
    const { cidade } = req.params;

    if (!apiKey) {
        console.error('[Servidor] Erro: Chave da API OpenWeatherMap não configurada no servidor.');
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }
    if (!cidade) {
        return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    }

    const currentWeatherAPIUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor] Buscando tempo atual para: ${cidade} na URL: ${currentWeatherAPIUrl.replace(apiKey, 'SUA_CHAVE_OCULTA')}`);
        const apiResponse = await axios.get(currentWeatherAPIUrl);
        console.log(`[Servidor] Dados do tempo atual recebidos da OpenWeatherMap para: ${cidade}`);
        
        res.json(apiResponse.data);

    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar tempo atual no servidor.';
        console.error(`[Servidor] Erro ${status} ao buscar tempo atual para ${cidade}:`, message, error.response?.data || error.message);
        res.status(status).json({ error: message });
    }
});

// ----- ENDPOINT (Opcional): Geocoding -----
// Se você quiser proxyficar também a API de geocodificação para as sugestões de cidade
// Rota: GET /api/geocoding/:query
app.get('/api/geocoding/:query', async (req, res) => {
    const { query } = req.params;

    if (!apiKey) {
        console.error('[Servidor] Erro: Chave da API OpenWeatherMap não configurada no servidor.');
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }
    if (!query || query.length < 3) {
        return res.status(400).json({ error: 'Termo de busca para geocodificação deve ter pelo menos 3 caracteres.' });
    }

    // O OpenWeatherMap Geocoding API espera o parâmetro 'q'
    const geocodeAPIUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;

    try {
        console.log(`[Servidor] Buscando geocoding para: ${query} na URL: ${geocodeAPIUrl.replace(apiKey, 'SUA_CHAVE_OCULTA')}`);
        const apiResponse = await axios.get(geocodeAPIUrl);
        console.log(`[Servidor] Dados de geocoding recebidos da OpenWeatherMap para: ${query}`);
        
        res.json(apiResponse.data);

    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar dados de geocodificação no servidor.';
        console.error(`[Servidor] Erro ${status} ao buscar geocoding para ${query}:`, message, error.response?.data || error.message);
        res.status(status).json({ error: message });
    }
});


// Rota raiz apenas para teste (opcional)
app.get('/', (req, res) => {
    res.send('Servidor Backend da Garagem Inteligente está no ar! Acesse os endpoints /api/previsao/:cidade ou /api/tempoatual/:cidade.');
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
    if (!apiKey) {
        console.warn('ATENÇÃO: A variável de ambiente OPENWEATHER_API_KEY não foi encontrada ou está vazia. O servidor não poderá buscar dados da OpenWeatherMap.');
    } else {
        console.log('Chave da API OpenWeatherMap carregada com sucesso.');
    }
});
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
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); 
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(express.static(path.join(__dirname, "public")))

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// ----- NOVO CÓDIGO COMEÇA AQUI: DADOS FALSOS (MOCK DATA) -----
// Estes são os dados que nossos novos endpoints vão usar, sem precisar de banco de dados.

const produtos = [
  { id: 1, nome: 'Sensor de Presença para Garagem', preco: 89.90, estoque: 150 },
  { id: 2, nome: 'Câmera de Segurança Wi-Fi Full HD', preco: 299.00, estoque: 80 },
  { id: 3, nome: 'Lâmpada LED Inteligente', preco: 65.50, estoque: 300 },
  { id: 4, nome: 'Controle Universal Infravermelho', preco: 120.00, estoque: 120 }
];

const usuarios = [
  { id: 101, nome: 'Cliente Fiel', email: 'cliente.fiel@example.com', plano: 'Premium' },
  { id: 102, nome: 'Visitante Ocasional', email: 'visitante@example.com', plano: 'Básico' },
  { id: 103, nome: 'Administrador', email: 'admin@garageminteligente.com', plano: 'Admin' }
];

// ----- FIM DO NOVO CÓDIGO -----


// ----- ENDPOINT: Previsão do Tempo (5 dias / 3 horas) -----
// Rota: GET /api/previsao/:cidade
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;

    if (!apiKey) {
        console.error('[Servidor] Erro: Chave da API OpenWeatherMap não configurada no servidor.');
        return res.status(500).json({ error: 'Chave da API OpenWeatherMap não configurada no servidor.' });
    }
    if (!cidade) {
        return res.status(400).json({ error: 'Nome da cidade é obrigatório.' });
    }

    const weatherAPIUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(cidade)}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        console.log(`[Servidor] Buscando previsão de 5 dias para: ${cidade}`);
        const apiResponse = await axios.get(weatherAPIUrl);
        res.json(apiResponse.data);

    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar previsão do tempo no servidor.';
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
        console.log(`[Servidor] Buscando tempo atual para: ${cidade}`);
        const apiResponse = await axios.get(currentWeatherAPIUrl);
        res.json(apiResponse.data);

    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar tempo atual no servidor.';
        res.status(status).json({ error: message });
    }
});

// ----- ENDPOINT (Opcional): Geocoding -----
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

    const geocodeAPIUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`;

    try {
        console.log(`[Servidor] Buscando geocoding para: ${query}`);
        const apiResponse = await axios.get(geocodeAPIUrl);
        res.json(apiResponse.data);

    } catch (error) {
        const status = error.response?.status || 500;
        const message = error.response?.data?.message || 'Erro ao buscar dados de geocodificação no servidor.';
        res.status(status).json({ error: message });
    }
});


// ----- NOVO CÓDIGO COMEÇA AQUI: NOVOS ENDPOINTS COM DADOS FALSOS -----

// ENDPOINT 1: Retornar todos os produtos
app.get('/api/produtos', (req, res) => {
  console.log('[Servidor] Requisição recebida em /api/produtos');
  res.json(produtos); // Envia a lista completa de produtos
});

// ENDPOINT 2: Retornar um produto específico pelo ID
app.get('/api/produtos/:id', (req, res) => {
  const idProduto = parseInt(req.params.id); // Pega o ID da URL
  console.log(`[Servidor] Buscando produto com ID: ${idProduto}`);
  
  const produtoEncontrado = produtos.find(p => p.id === idProduto);

  if (produtoEncontrado) {
    res.json(produtoEncontrado); // Se encontrou, envia o produto
  } else {
    // Se não encontrou, envia um erro 404 (Not Found)
    res.status(404).json({ mensagem: 'Produto não encontrado!' });
  }
});

// ENDPOINT 3: Retornar todos os usuários
app.get('/api/usuarios', (req, res) => {
  console.log('[Servidor] Requisição recebida em /api/usuarios');
  res.json(usuarios); // Envia a lista completa de usuários
});

// ----- FIM DO NOVO CÓDIGO -----


// Rota raiz apenas para teste (opcional)
app.get('/', (req, res) => {
    res.send('Servidor Backend da Garagem Inteligente está no ar!');
});

// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor backend rodando em http://localhost:${port}`);
    if (!apiKey) {
        console.warn('ATENÇÃO: A variável de ambiente OPENWEATHER_API_KEY não foi encontrada.');
    } else {
        console.log('Chave da API OpenWeatherMap carregada com sucesso.');
    }
});
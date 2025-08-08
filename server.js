// server.js

// --- 1. IMPORTAÇÕES ---
import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import mysql from 'mysql2/promise'; // Driver do MySQL

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// --- 2. CONFIGURAÇÕES INICIAIS ---
const app = express();
const port = process.env.PORT || 3001;
const apiKey = process.env.OPENWEATHER_API_KEY;

// Middleware para parsear JSON no corpo das requisições (essencial para POST)
app.use(express.json());

// Middleware para CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// --- 3. CONEXÃO COM O BANCO DE DADOS ---
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ----- ENDPOINTS DA API OPENWEATHERMAP (Extras, permanecem iguais) -----
app.get('/api/previsao/:cidade', async (req, res) => {
    const { cidade } = req.params;
    if (!apiKey) {
        return res.status(500).json({ message: 'Chave da API não configurada.' });
    }
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${apiKey}&units=metric&lang=pt_br`;
    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar previsão do tempo.' });
    }
});


// ----- ENDPOINTS DA APLICAÇÃO (USUÁRIOS E MANUTENÇÕES) -----

// --- ROTAS DE USUÁRIOS ---

// GET: Retornar todos os usuários (sem a senha)
app.get('/api/usuarios', async (req, res) => {
  try {
    // Selecionamos todas as colunas, exceto a senha, por segurança.
    const [rows] = await pool.query('SELECT id, nome, email, data_criacao FROM usuarios');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar usuários.', error: error.message });
  }
});

// POST: Criar um novo usuário (ex: registro)
// NOTA: Em um app real, você usaria bcrypt para hashear a senha antes de salvar!
app.post('/api/usuarios', async (req, res) => {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
        return res.status(400).json({ mensagem: 'Nome, email e senha são obrigatórios.' });
    }
    try {
        const sql = 'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)';
        // !! AVISO DE SEGURANÇA: Aqui estamos salvando a senha como texto puro.
        // !! Em produção, use: const hash = await bcrypt.hash(senha, 10); e salve o hash.
        const [result] = await pool.query(sql, [nome, email, senha]);
        res.status(201).json({ id: result.insertId, nome, email });
    } catch (error) {
        // Código 'ER_DUP_ENTRY' é específico do MySQL para entradas duplicadas
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensagem: 'Este email já está cadastrado.' });
        }
        res.status(500).json({ mensagem: 'Erro ao criar usuário.', error: error.message });
    }
});

// Adicione este bloco de código no seu server.js, dentro da seção de endpoints

// ----- ROTAS DE VEÍCULOS -----

// GET: Retornar todos os veículos de um usuário específico
// Ex: /api/usuarios/1/veiculos
app.get('/api/usuarios/:usuarioId/veiculos', async (req, res) => {
    const { usuarioId } = req.params;
    try {
        const sql = 'SELECT * FROM veiculos WHERE usuario_id = ?';
        const [veiculos] = await pool.query(sql, [usuarioId]);
        res.json(veiculos);
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao buscar veículos.', error: error.message });
    }
});

// POST: Criar um novo veículo para um usuário
app.post('/api/veiculos', async (req, res) => {
    const { nome, tipo, placa, imagem_url, usuario_id } = req.body;

    // Validação básica
    if (!nome || !tipo || !usuario_id) {
        return res.status(400).json({ mensagem: 'Nome, tipo e ID do usuário são obrigatórios.' });
    }

    try {
        const sql = 'INSERT INTO veiculos (nome, tipo, placa, imagem_url, usuario_id) VALUES (?, ?, ?, ?, ?)';
        const [result] = await pool.query(sql, [nome, tipo, placa, imagem_url, usuario_id]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ mensagem: 'Já existe um veículo com esta placa.' });
        }
        res.status(500).json({ mensagem: 'Erro ao cadastrar veículo.', error: error.message });
    }
});


// --- ROTAS DE MANUTENÇÕES ---

// GET: Retornar todas as manutenções
app.get('/api/manutencoes', async (req, res) => {
  try {
    // Usamos um JOIN para buscar também o nome do usuário que registrou a manutenção
    const sql = `
        SELECT 
            m.id, m.titulo, m.descricao, m.data_manutencao, m.custo, m.veiculo, m.status,
            u.nome as nome_usuario 
        FROM manutencoes m
        JOIN usuarios u ON m.usuario_id = u.id
        ORDER BY m.data_manutencao DESC
    `;
    const [rows] = await pool.query(sql);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ mensagem: 'Erro ao buscar manutenções.', error: error.message });
  }
});

// POST: Criar uma nova manutenção
app.post('/api/manutencoes', async (req, res) => {
    const { titulo, descricao, data_manutencao, custo, veiculo, status, usuario_id } = req.body;
    if (!titulo || !data_manutencao || !usuario_id) {
        return res.status(400).json({ mensagem: 'Título, data da manutenção e ID do usuário são obrigatórios.' });
    }
    try {
        const sql = `
            INSERT INTO manutencoes (titulo, descricao, data_manutencao, custo, veiculo, status, usuario_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await pool.query(sql, [titulo, descricao, data_manutencao, custo, veiculo, status, usuario_id]);
        res.status(201).json({ id: result.insertId, ...req.body });
    } catch (error) {
        res.status(500).json({ mensagem: 'Erro ao registrar manutenção.', error: error.message });
    }
});


// --- INICIALIZAÇÃO DO SERVIDOR ---
async function startServer() {
    try {
        // Testa a conexão para garantir que está funcionando
        await pool.query('SELECT 1');
        console.log('✅ Conectado com sucesso ao banco de dados MySQL!');

        // Inicia o servidor Express
        app.listen(port, () => {
            console.log(`🚀 Servidor backend rodando em http://localhost:${port}`);
        });
    } catch (error) {
        console.error('❌ Falha ao conectar ao MySQL ou iniciar o servidor:', error);
        process.exit(1); // Encerra se não conseguir conectar ao BD
    }
}

// Inicia todo o processo
startServer();
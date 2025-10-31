// server.js (MySQL version - FINAL CORRIGIDA)
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise'; // Usando a versão 'promise' para async/await
import bcrypt from 'bcrypt'; // Para hashing de senhas
import jwt from 'jsonwebtoken'; // Para autenticação JWT

// __filename e __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001; // Porta do servidor

// ----- Configuração do Pool de Conexões MySQL -----
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'garagem_db', // Mude para o nome do seu banco de dados
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Variáveis de ambiente para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'umSegredoMuitoSecreto123!'; // Use uma string forte e única em produção!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// Verifica se as variáveis de ambiente do MySQL estão definidas
if (!dbConfig.database || !dbConfig.user) {
    console.error('ERRO: As variáveis de ambiente DB_HOST, DB_USER, DB_PASSWORD, DB_DATABASE devem ser definidas no arquivo .env para MySQL.');
    process.exit(1); // Sai do processo se a configuração do DB estiver faltando
}

if (!JWT_SECRET) {
    console.error('ERRO: A variável de ambiente JWT_SECRET deve ser definida no arquivo .env para JWT.');
    process.exit(1); // Sai do processo se a chave JWT estiver faltando
}

// Cria um pool de conexões com o MySQL
let pool;
try {
    pool = mysql.createPool(dbConfig);
    console.log('Pool de conexões MySQL criado com sucesso.');

    // Testa a conexão ao iniciar o servidor
    pool.getConnection()
        .then(connection => {
            console.log('Conectado ao MySQL com sucesso.');
            connection.release(); // Libera a conexão de volta para o pool
        })
        .catch(err => {
            console.error('Erro ao conectar ao MySQL:', err);
            process.exit(1); // Sai se a conexão inicial falhar
        });
} catch (err) {
    console.error('Erro ao criar o pool de conexões MySQL:', err);
    process.exit(1);
}


// ----- MIDDLEWARES GLOBAIS -----

// Middleware para disponibilizar o pool de conexões nas requisições
app.use((req, res, next) => {
    req.pool = pool;
    next();
});

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Middleware para servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, "public")));

// Rota raiz - Serve o arquivo index.html da pasta 'public'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Espera formato "Bearer TOKEN"

    if (token == null) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Erro na verificação do token:', err.message);
            return res.status(403).json({ message: 'Token de autenticação inválido ou expirado.' });
        }
        req.user = user; // Anexa as informações do usuário ao objeto de requisição
        next();
    });
};


// =================================================================
// ===== ROTAS DE API PARA USUÁRIOS, VEÍCULOS E AGENDAMENTOS ========
// =================================================================

// --- ROTAS DE AUTENTICAÇÃO E CADASTRO DE USUÁRIOS ---

// Rota de Cadastro de Usuário (POST /api/usuarios)
app.post('/api/usuarios', async (req, res) => {
    if (!req.pool) return res.status(500).json({ message: 'Servidor não conectado ao banco de dados.' });

    const { Nome_Usuario, Email_login, Senha_login, Idade } = req.body;

    if (!Nome_Usuario || !Email_login || !Senha_login) {
        return res.status(400).json({ message: 'Nome, Email e Senha são obrigatórios.' });
    }

    try {
        // Hashing da senha ANTES de salvar no banco de dados
        const hashedPassword = await bcrypt.hash(Senha_login, 10); // 10 rounds de salting

        const [result] = await req.pool.query(
            'INSERT INTO Usuarios (Nome_Usuario, Email_login, Senha_login, Idade) VALUES (?, ?, ?, ?)',
            [Nome_Usuario, Email_login, hashedPassword, Idade || null] // Idade pode ser null
        );
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: result.insertId });
    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);
        if (err.code === 'ER_DUP_ENTRY') { // MySQL error code for duplicate entry
            return res.status(409).json({ message: 'Este email já está cadastrado.' });
        }
        res.status(500).json({ message: 'Erro interno do servidor ao cadastrar usuário.' });
    }
});

// Rota de Login de Usuário (POST /api/auth/login)
app.post('/api/auth/login', async (req, res) => {
    if (!req.pool) return res.status(500).json({ message: 'Servidor não conectado ao banco de dados.' });

    const { Email_login, Senha_login } = req.body;

    if (!Email_login || !Senha_login) {
        return res.status(400).json({ message: 'Email e Senha são obrigatórios.' });
    }

    try {
        const [rows] = await req.pool.query('SELECT ID_Usuario, Nome_Usuario, Senha_login FROM Usuarios WHERE Email_login = ?', [Email_login]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const user = rows[0];
        // Comparar a senha fornecida com a senha hash armazenada
        const passwordMatch = await bcrypt.compare(Senha_login, user.Senha_login);

        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        // Gerar um JSON Web Token (JWT)
        const token = jwt.sign(
            { id: user.ID_Usuario, Nome_Usuario: user.Nome_Usuario, Email_login: Email_login },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({ message: 'Login bem-sucedido!', token, nomeUsuario: user.Nome_Usuario });

    } catch (err) {
        console.error('Erro ao logar usuário:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao tentar fazer login.' });
    }
});


// --- ROTAS DE VEÍCULOS ---
// As colunas da sua tabela Veiculos são: ID_Veiculo, Cor_Carro, Ano_Carro.
// As informações que o frontend envia são: modelo, placa, ano, cor, nomeProprietario.
// Precisamos adaptar a rota para usar as colunas corretas.

// Listar todos os veículos (GET /api/veiculos) - Protegido
app.get('/api/veiculos', authenticateToken, async (req, res) => {
    if (!req.pool) return res.status(500).json({ message: 'Servidor não conectado ao banco de dados.' });
    try {
        // Seleciona todas as colunas necessárias e alias para corresponder ao frontend
        const [rows] = await req.pool.query(
            'SELECT ID_Veiculo, Cor_Carro AS cor, Ano_Carro AS ano, modelo, placa, nomeProprietario FROM Veiculos WHERE ID_Usuario = ?',
            [req.user.id] // Filtra veículos pelo ID do usuário logado
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar veículos:', err);
        res.status(500).json({ message: 'Erro ao buscar veículos.' });
    }
});

// Adicionar um novo veículo (POST /api/veiculos) - Protegido
app.post('/api/veiculos', authenticateToken, async (req, res) => {
    if (!req.pool) return res.status(500).json({ message: 'Servidor não conectado ao banco de dados.' });
    // Note que `modelo`, `placa`, `nomeProprietario` não estão na sua tabela Veiculos original.
    // Presumo que você adaptou ou irá adaptar a tabela para incluir essas colunas.
    // Se não, você precisará decidir como lidar com esses dados.
    const { modelo, placa, ano, cor, nomeProprietario } = req.body;
    const userId = req.user.id; // Pega o ID do usuário do token autenticado

    if (!modelo || !placa || !ano || !nomeProprietario) {
        return res.status(400).json({ message: 'Modelo, Placa, Ano e Nome do Proprietário são obrigatórios.' });
    }

    try {
        // Ajuste os nomes das colunas e a ordem para corresponder à sua tabela atual ou planejada
        const [result] = await req.pool.query(
            'INSERT INTO Veiculos (modelo, placa, Ano_Carro, Cor_Carro, nomeProprietario, ID_Usuario) VALUES (?, ?, ?, ?, ?, ?)',
            [modelo, placa, ano, cor || null, nomeProprietario, userId]
        );
        res.status(201).json({ message: 'Veículo adicionado com sucesso!', veiculoId: result.insertId });
    } catch (err) {
        console.error('Erro ao adicionar veículo:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Veículo com esta placa já cadastrado.' });
        }
        res.status(500).json({ message: 'Erro ao adicionar veículo.' });
    }
});

// Excluir um veículo (DELETE /api/veiculos/:id) - Protegido
app.delete('/api/veiculos/:id', authenticateToken, async (req, res) => {
    if (!req.pool) return res.status(500).json({ message: 'Servidor não conectado ao banco de dados.' });
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Garante que o usuário só pode excluir seus próprios veículos
        const [result] = await req.pool.query('DELETE FROM Veiculos WHERE ID_Veiculo = ? AND ID_Usuario = ?', [id, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Veículo não encontrado ou você não tem permissão para excluí-lo.' });
        }
        res.json({ message: 'Veículo excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir veículo:', err);
        res.status(500).json({ message: 'Erro ao excluir veículo.' });
    }
});


// --- ROTAS DE AGENDAMENTOS ---

// **IMPORTANTE:** Crie esta tabela no seu MySQL para que as rotas funcionem:
/*
CREATE TABLE Agendamentos (
    ID_Agendamento INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    data DATE NOT NULL,
    hora TIME NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    ID_Usuario INT NOT NULL, -- Chave estrangeira para Usuarios
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Usuario) REFERENCES Usuarios(ID_Usuario) ON DELETE CASCADE
);

-- E também ajuste a tabela Veiculos para ter ID_Usuario:
ALTER TABLE Veiculos ADD COLUMN modelo VARCHAR(255);
ALTER TABLE Veiculos ADD COLUMN placa VARCHAR(20) UNIQUE; -- Placa deve ser única
ALTER TABLE Veiculos ADD COLUMN nomeProprietario VARCHAR(255);
ALTER TABLE Veiculos ADD COLUMN ID_Usuario INT NOT NULL;
ALTER TABLE Veiculos ADD CONSTRAINT fk_usuario_veiculo FOREIGN KEY (ID_Usuario) REFERENCES Usuarios(ID_Usuario) ON DELETE CASCADE;
*/

// Listar todos os agendamentos do usuário logado (GET /api/agendamentos) - Protegido
app.get('/api/agendamentos', authenticateToken, async (req, res) => {
    if (!req.pool) return res.status(500).json({ message: 'Servidor não conectado ao banco de dados.' });
    const userId = req.user.id; // Pega o ID do usuário do token

    try {
        const [rows] = await req.pool.query(
            'SELECT ID_Agendamento, data, hora, descricao FROM Agendamentos WHERE ID_Usuario = ? ORDER BY data, hora',
            [userId]
        );
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar agendamentos:', err);
        res.status(500).json({ message: 'Erro ao buscar agendamentos.' });
    }
});

// Adicionar um novo agendamento (POST /api/agendamentos) - Protegido
app.post('/api/agendamentos', authenticateToken, async (req, res) => {
    if (!req.pool) return res.status(500).json({ message: 'Servidor não conectado ao banco de dados.' });
    const { data, hora, descricao } = req.body;
    const userId = req.user.id;

    if (!data || !hora || !descricao) {
        return res.status(400).json({ message: 'Data, Hora e Descrição são obrigatórios para o agendamento.' });
    }

    try {
        const [result] = await req.pool.query(
            'INSERT INTO Agendamentos (data, hora, descricao, ID_Usuario) VALUES (?, ?, ?, ?)',
            [data, hora, descricao, userId]
        );
        res.status(201).json({ message: 'Agendamento adicionado com sucesso!', agendamentoId: result.insertId });
    } catch (err) {
        console.error('Erro ao adicionar agendamento:', err);
        res.status(500).json({ message: 'Erro ao adicionar agendamento.' });
    }
});

// Excluir um agendamento (DELETE /api/agendamentos/:id) - Protegido
app.delete('/api/agendamentos/:id', authenticateToken, async (req, res) => {
    if (!req.pool) return res.status(500).json({ message: 'Servidor não conectado ao banco de dados.' });
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Garante que o usuário só pode excluir seus próprios agendamentos
        const [result] = await req.pool.query('DELETE FROM Agendamentos WHERE ID_Agendamento = ? AND ID_Usuario = ?', [id, userId]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Agendamento não encontrado ou você não tem permissão para excluí-lo.' });
        }
        res.json({ message: 'Agendamento excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir agendamento:', err);
        res.status(500).json({ message: 'Erro ao excluir agendamento.' });
    }
});


// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor de site estático rodando em http://localhost:${3306}`);
    console.log(`Servindo arquivos de: ${path.join(__dirname, "public")}`);
    console.log("As rotas de API para MySQL estão configuradas.");
});
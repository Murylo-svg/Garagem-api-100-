// server.js (MongoDB version)
import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connectDB from './database/index.js';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Appointment from './models/Appointment.js';

// __filename e __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do arquivo .env
dotenv.config();

// Inicializa o aplicativo Express
const app = express();
const port = process.env.PORT || 3001;

// Conecta ao MongoDB
connectDB();

// Variáveis de ambiente para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'umSegredoMuitoSecreto123!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

if (!JWT_SECRET) {
    console.error('ERRO: A variável de ambiente JWT_SECRET deve ser definida no arquivo .env para JWT.');
    process.exit(1);
}

// ----- MIDDLEWARES GLOBAIS -----
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Rota raiz - Serve o arquivo index.html da pasta 'public'
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de autenticação JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Token de autenticação não fornecido.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Erro na verificação do token:', err.message);
            return res.status(403).json({ message: 'Token de autenticação inválido ou expirado.' });
        }
        req.user = user;
        next();
    });
};

// =================================================================
// ===== ROTAS DE API PARA USUÁRIOS, VEÍCULOS E AGENDAMENTOS ========
// =================================================================

// --- ROTAS DE AUTENTICAÇÃO E CADASTRO DE USUÁRIOS ---

// Rota de Cadastro de Usuário (POST /api/usuarios)
app.post('/api/usuarios', async (req, res) => {
    const { Nome_Usuario, Email_login, Senha_login, Idade } = req.body;

    if (!Nome_Usuario || !Email_login || !Senha_login) {
        return res.status(400).json({ message: 'Nome, Email e Senha são obrigatórios.' });
    }

    try {
        const existingUser = await User.findOne({ Email_login });
        if (existingUser) {
            return res.status(409).json({ message: 'Este email já está cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(Senha_login, 10);

        const newUser = new User({
            Nome_Usuario,
            Email_login,
            Senha_login: hashedPassword,
            Idade,
        });

        const savedUser = await newUser.save();
        res.status(201).json({ message: 'Usuário cadastrado com sucesso!', userId: savedUser._id });
    } catch (err) {
        console.error('Erro ao cadastrar usuário:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao cadastrar usuário.' });
    }
});

// Rota de Login de Usuário (POST /api/auth/login)
app.post('/api/auth/login', async (req, res) => {
    const { Email_login, Senha_login } = req.body;

    if (!Email_login || !Senha_login) {
        return res.status(400).json({ message: 'Email e Senha são obrigatórios.' });
    }

    try {
        const user = await User.findOne({ Email_login });
        if (!user) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const passwordMatch = await bcrypt.compare(Senha_login, user.Senha_login);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Credenciais inválidas.' });
        }

        const token = jwt.sign(
            { id: user._id, Nome_Usuario: user.Nome_Usuario, Email_login: user.Email_login },
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

// Listar todos os veículos do usuário (próprios e compartilhados)
app.get('/api/veiculos', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const vehicles = await Vehicle.find({
            $or: [
                { ID_Usuario: userId },
                { sharedWith: userId }
            ]
        }).populate('ID_Usuario', 'Nome_Usuario'); // Popula para mostrar o nome do proprietário

        res.json(vehicles);
    } catch (err) {
        console.error('Erro ao buscar veículos:', err);
        res.status(500).json({ message: 'Erro ao buscar veículos.' });
    }
});

// Buscar um único veículo por ID
app.get('/api/veiculos/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const vehicleId = req.params.id;

        const vehicle = await Vehicle.findOne({
            _id: vehicleId,
            $or: [
                { ID_Usuario: userId },
                { sharedWith: userId }
            ]
        }).populate('ID_Usuario', 'Nome_Usuario');

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado ou você não tem permissão para acessá-lo.' });
        }

        res.json(vehicle);
    } catch (err) {
        console.error('Erro ao buscar detalhes do veículo:', err);
        res.status(500).json({ message: 'Erro ao buscar detalhes do veículo.' });
    }
});


// Adicionar um novo veículo (POST /api/veiculos) - Protegido
app.post('/api/veiculos', authenticateToken, async (req, res) => {
    const { modelo, placa, ano, cor, nomeProprietario, valorFIPE, recallPendente, proximaRevisaoKm } = req.body;
    const userId = req.user.id;

    if (!modelo || !placa || !ano || !nomeProprietario) {
        return res.status(400).json({ message: 'Modelo, Placa, Ano e Nome do Proprietário são obrigatórios.' });
    }

    try {
        const newVehicle = new Vehicle({
            modelo,
            placa,
            ano,
            cor,
            nomeProprietario,
            ID_Usuario: userId,
            valorFIPE,
            recallPendente,
            proximaRevisaoKm,
        });

        const savedVehicle = await newVehicle.save();
        res.status(201).json({ message: 'Veículo adicionado com sucesso!', veiculoId: savedVehicle._id });
    } catch (err) {
        console.error('Erro ao adicionar veículo:', err);
        if (err.code === 11000) { // MongoDB duplicate key error
            return res.status(409).json({ message: 'Veículo com esta placa já cadastrado.' });
        }
        res.status(500).json({ message: 'Erro ao adicionar veículo.' });
    }
});

// Rota para atualizar detalhes adicionais de um veículo
app.put('/api/veiculos/:id/additional-details', authenticateToken, async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const userId = req.user.id;
        const { valorFIPE, recallPendente, proximaRevisaoKm } = req.body;

        const vehicle = await Vehicle.findOneAndUpdate(
            { _id: vehicleId, ID_Usuario: userId },
            { valorFIPE, recallPendente, proximaRevisaoKm },
            { new: true }
        );

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado ou você não é o proprietário.' });
        }

        res.json({ message: 'Detalhes adicionais atualizados com sucesso!', vehicle });
    } catch (err) {
        console.error('Erro ao atualizar detalhes adicionais do veículo:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao atualizar detalhes adicionais.' });
    }
});

// Compartilhar um veículo (POST /api/veiculos/:id/share)
app.post('/api/veiculos/:id/share', authenticateToken, async (req, res) => {
    try {
        const { email } = req.body;
        const vehicleId = req.params.id;
        const ownerId = req.user.id;

        // 1. Encontrar o veículo e garantir que o solicitante é o proprietário
        const vehicle = await Vehicle.findOne({ _id: vehicleId, ID_Usuario: ownerId });
        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado ou você não é o proprietário.' });
        }

        // 2. Encontrar o usuário com quem compartilhar
        const userToShareWith = await User.findOne({ Email_login: email });
        if (!userToShareWith) {
            return res.status(404).json({ message: 'Usuário para compartilhamento não encontrado.' });
        }
        
        // 3. Verificar se não está compartilhando com o próprio dono
        if(userToShareWith._id.equals(ownerId)) {
            return res.status(400).json({ message: 'Você não pode compartilhar um veículo com você mesmo.' });
        }

        // 4. Adicionar o usuário à lista de compartilhamento se ele ainda não estiver lá
        if (vehicle.sharedWith.includes(userToShareWith._id)) {
            return res.status(409).json({ message: 'Este veículo já está compartilhado com este usuário.' });
        }

        vehicle.sharedWith.push(userToShareWith._id);
        await vehicle.save();

        res.json({ message: `Veículo compartilhado com ${email} com sucesso.` });

    } catch (err) {
        console.error('Erro ao compartilhar veículo:', err);
        res.status(500).json({ message: 'Erro interno do servidor ao compartilhar veículo.' });
    }
});


// Excluir um veículo (DELETE /api/veiculos/:id) - Protegido
app.delete('/api/veiculos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // Apenas o proprietário pode excluir o veículo
        const result = await Vehicle.findOneAndDelete({ _id: id, ID_Usuario: userId });
        if (!result) {
            return res.status(404).json({ message: 'Veículo não encontrado ou você não tem permissão para excluí-lo.' });
        }
        res.json({ message: 'Veículo excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir veículo:', err);
        res.status(500).json({ message: 'Erro ao excluir veículo.' });
    }
});

// --- ROTAS DE AGENDAMENTOS ---

// Listar todos os agendamentos do usuário logado (GET /api/agendamentos) - Protegido
app.get('/api/agendamentos', authenticateToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const appointments = await Appointment.find({ ID_Usuario: userId }).sort({ data: 1, hora: 1 });
        res.json(appointments);
    } catch (err) {
        console.error('Erro ao buscar agendamentos:', err);
        res.status(500).json({ message: 'Erro ao buscar agendamentos.' });
    }
});

// Adicionar um novo agendamento (POST /api/agendamentos) - Protegido
app.post('/api/agendamentos', authenticateToken, async (req, res) => {
    const { data, hora, descricao } = req.body;
    const userId = req.user.id;

    if (!data || !hora || !descricao) {
        return res.status(400).json({ message: 'Data, Hora e Descrição são obrigatórios para o agendamento.' });
    }

    try {
        const newAppointment = new Appointment({
            data,
            hora,
            descricao,
            ID_Usuario: userId,
        });

        const savedAppointment = await newAppointment.save();
        res.status(201).json({ message: 'Agendamento adicionado com sucesso!', agendamentoId: savedAppointment._id });
    } catch (err) {
        console.error('Erro ao adicionar agendamento:', err);
        res.status(500).json({ message: 'Erro ao adicionar agendamento.' });
    }
});

// Excluir um agendamento (DELETE /api/agendamentos/:id) - Protegido
app.delete('/api/agendamentos/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await Appointment.findOneAndDelete({ _id: id, ID_Usuario: userId });
        if (!result) {
            return res.status(404).json({ message: 'Agendamento não encontrado ou você não tem permissão para excluí-lo.' });
        }
        res.json({ message: 'Agendamento excluído com sucesso!' });
    } catch (err) {
        console.error('Erro ao excluir agendamento:', err);
        res.status(500).json({ message: 'Erro ao excluir agendamento.' });
    }
});

// --- NOVAS ROTAS ---

// Rota para listar veículos públicos
app.get('/api/vehicles/public', async (req, res) => {
    try {
        const publicVehicles = await Vehicle.find({ isPublic: true }).populate('ID_Usuario', 'Nome_Usuario');
        res.json(publicVehicles);
    } catch (err) {
        console.error('Erro ao buscar veículos públicos:', err);
        res.status(500).json({ message: 'Erro ao buscar veículos públicos.' });
    }
});

// Rota para alternar a privacidade de um veículo
app.put('/api/vehicles/:id/toggle-privacy', authenticateToken, async (req, res) => {
    try {
        const vehicleId = req.params.id;
        const userId = req.user.id;

        const vehicle = await Vehicle.findOne({ _id: vehicleId, ID_Usuario: userId });

        if (!vehicle) {
            return res.status(404).json({ message: 'Veículo não encontrado ou você não é o proprietário.' });
        }

        vehicle.isPublic = !vehicle.isPublic;
        await vehicle.save();

        res.json({ message: `Veículo agora é ${vehicle.isPublic ? 'público' : 'privado'}.`, isPublic: vehicle.isPublic });
    } catch (err) {
        console.error('Erro ao alterar privacidade do veículo:', err);
        res.status(500).json({ message: 'Erro ao alterar privacidade do veículo.' });
    }
});

// Rota para buscar o perfil do usuário logado
app.get('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-Senha_login'); // Exclui a senha do retorno
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json(user);
    } catch (err) {
        console.error('Erro ao buscar perfil do usuário:', err);
        res.status(500).json({ message: 'Erro ao buscar perfil do usuário.' });
    }
});

// Rota para atualizar o perfil do usuário logado
app.put('/api/users/profile', authenticateToken, async (req, res) => {
    try {
        const { Nome_Usuario, Idade } = req.body;
        const user = await User.findByIdAndUpdate(req.user.id, { Nome_Usuario, Idade }, { new: true }).select('-Senha_login');

        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        res.json({ message: 'Perfil atualizado com sucesso!', user });
    } catch (err) {
        console.error('Erro ao atualizar perfil do usuário:', err);
        res.status(500).json({ message: 'Erro ao atualizar perfil do usuário.' });
    }
});


// Inicia o servidor
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
    console.log(`Servindo arquivos de: ${path.join(__dirname, "public")}`);
});

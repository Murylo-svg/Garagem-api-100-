import mongoose from "mongoose";

mongoose.connect(
  'mongodb+srv://Murylo:murylo0807@cluster0.zttbg29.mongodb.net/?appName=Cluster0'
)
.then(() => console.log('Conexão bem-sucedida ao MongoDB!'))
.catch((err) => console.error('Erro ao conectar ao MongoDB:', err));

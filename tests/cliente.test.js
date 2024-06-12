const request = require('supertest');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const db = new sqlite3.Database(':memory:');

// Configurações e rotas da aplicação
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.post('/cadastrar_cliente', (req, res) => {
    const { nome, email, telefone } = req.body;
    db.run('INSERT INTO tb_cliente (nome, email, telefone) VALUES (?, ?, ?)', [nome, email, telefone], function (err) {
        if(err) {
            return res.status(500).json({ error: err.message });
        }
        const clienteID = this.lastID;
        res.status(201).json({ id: clienteID, nome, email, telefone });
    });
});

app.get('/getDataCliente', (req, res) => {
    db.all('SELECT * FROM tb_cliente', (err, rows) => {
        if(err) {
            res.status(500).send('Erro ao obter dados do banco de dados.');
        } else {
            res.json(rows);
        }
    });
});

app.put('/atualizar_cliente/:id', (req, res) => {
    const IDcliente = req.params.id;
    const { nome, email, telefone } = req.body;
    const sql = 'UPDATE tb_cliente SET nome = ?, email = ?, telefone = ? WHERE id = ?';
    db.run(sql, [nome, email, telefone, IDcliente], function (err) {
        if(err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Cliente Atualizado' });
    });
});

app.delete('/deletar_cliente/:id', (req, res) => {
    const clienteID = req.params.id;
    const sql = 'DELETE FROM tb_cliente WHERE id = ?';
    db.run(sql, [clienteID], function(err) {
        if(err){
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Cliente deletado.' });
    });
});

// Setup do banco de dados e inicialização do servidor para testes
beforeAll(done => {
    db.serialize(() => {
        db.run(`CREATE TABLE tb_cliente (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            email TEXT,
            telefone TEXT
        )`, done);
    });
});

afterAll(done => {
    db.close(done);
});

// Testes
describe('Testes de CRUD para clientes', () => {
    it('Deve criar um novo cliente', async () => {
        const response = await request(app)
            .post('/cadastrar_cliente')
            .send({ nome: 'Cliente Teste', email: 'teste@teste.com', telefone: '123456789' });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.nome).toBe('Cliente Teste');
    });

    it('Deve obter todos os clientes', async () => {
        const response = await request(app).get('/getDataCliente');
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('Deve atualizar um cliente existente', async () => {
        const response = await request(app)
            .post('/cadastrar_cliente')
            .send({ nome: 'Cliente a ser atualizado', email: 'atualizar@teste.com', telefone: '987654321' });
        
        const clienteID = response.body.id;
        
        const updateResponse = await request(app)
            .put(`/atualizar_cliente/${clienteID}`)
            .send({ nome: 'Cliente Atualizado', email: 'atualizado@teste.com', telefone: '111222333' });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.message).toBe('Cliente Atualizado');
    });

    it('Deve deletar um cliente existente', async () => {
        const response = await request(app)
            .post('/cadastrar_cliente')
            .send({ nome: 'Cliente a ser deletado', email: 'deletar@teste.com', telefone: '555666777' });
        
        const clienteID = response.body.id;
        
        const deleteResponse = await request(app).delete(`/deletar_cliente/${clienteID}`);
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.message).toBe('Cliente deletado.');
    });
});
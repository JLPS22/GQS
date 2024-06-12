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

app.post('/cadastrar_produto', (req, res) => {
    const { nome, qtdEstoque, valor } = req.body;
    db.run('INSERT INTO produto (nome, qtdEstoque, valor) VALUES (?, ?, ?)', [nome, qtdEstoque, valor], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        const produtoID = this.lastID;
        res.status(201).json({ id: produtoID, nome, qtdEstoque, valor });
    });
});

app.get('/getDataProduto', (req, res) => {
    db.all('SELECT * FROM produto', (err, rows) => {
        if (err) {
            res.status(500).send('Erro ao obter dados do banco de dados.');
        } else {
            res.json(rows);
        }
    });
});

app.put('/atualizar_produto/:id', (req, res) => {
    const IDproduto = req.params.id;
    const { nome, qtdEstoque, valor } = req.body;
    const sql = 'UPDATE produto SET nome = ?, qtdEstoque = ?, valor = ? WHERE idProduto = ?';
    db.run(sql, [nome, qtdEstoque, valor, IDproduto], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Produto Atualizado' });
    });
});

app.delete('/deletar_produto/:id', (req, res) => {
    const produtoID = req.params.id;
    const sql = 'DELETE FROM produto WHERE idProduto = ?';
    db.run(sql, [produtoID], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Produto deletado.' });
    });
});

// Setup do banco de dados e inicialização do servidor para testes
beforeAll(done => {
    db.serialize(() => {
        db.run(`CREATE TABLE produto (
            idProduto INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            qtdEstoque INTEGER,
            valor REAL
        )`, done);
    });
});

afterAll(done => {
    db.close(done);
});

// Testes
describe('Testes de CRUD para produtos', () => {
    it('Deve criar um novo produto', async () => {
        const response = await request(app)
            .post('/cadastrar_produto')
            .send({ nome: 'Produto Teste', qtdEstoque: 10, valor: 29.99 });
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body.nome).toBe('Produto Teste');
    });

    it('Deve obter todos os produtos', async () => {
        const response = await request(app).get('/getDataProduto');
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
    });

    it('Deve atualizar um produto existente', async () => {
        const response = await request(app)
            .post('/cadastrar_produto')
            .send({ nome: 'Produto a ser atualizado', qtdEstoque: 5, valor: 19.99 });
        
        const produtoID = response.body.id;
        
        const updateResponse = await request(app)
            .put(`/atualizar_produto/${produtoID}`)
            .send({ nome: 'Produto Atualizado', qtdEstoque: 15, valor: 39.99 });
        expect(updateResponse.status).toBe(200);
        expect(updateResponse.body.message).toBe('Produto Atualizado');
    });

    it('Deve deletar um produto existente', async () => {
        const response = await request(app)
            .post('/cadastrar_produto')
            .send({ nome: 'Produto a ser deletado', qtdEstoque: 1, valor: 9.99 });
        
        const produtoID = response.body.id;
        
        const deleteResponse = await request(app).delete(`/deletar_produto/${produtoID}`);
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.message).toBe('Produto deletado.');
    });
});
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

const db = new sqlite3.Database('lojaDB.sqlite');

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use(express.static('public'));

app.use(bodyParser.json());

// CRUD CLIENTE

// Obter dados da tabela Cliente
app.get('/getDataCliente', (req, res) => {
    db.all('SELECT * FROM tb_cliente', (err, rows) => {
        if(err) {
            res.status(500).send('Erro ao obter dados do banco de dados.');
        } else {
            const data = rows;
            res.json(data);
        }
    });
});

// Cadastrar Cliente
app.post('/cadastrar_cliente', (req, res) => {
    const { nome, email, telefone } = req.body;

    db.run('INSERT INTO tb_cliente (nome, email, telefone) VALUES (?, ?, ?)', [nome, email, telefone], function (err) {
        if(err) {
            return res.status(500).json({ error: err.message });
        }

        // ID do Cliente
        const clienteID = this.lastID;

        res.status(201).json({ id: clienteID, nome, email, telefone });
    });
});

// Deletar Cliente
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

// Atualizar Cliente
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


// CRUD PRODUTO

// Obter dados da tabela Produto
app.get('/getDataProduto', (req, res) => {
    db.all('SELECT * FROM produto', (err, rows) => {
        if(err) {
            res.status(500).send('Erro ao obter dados do banco de dados.');
        } else {
            const data = rows;
            res.json(data);
        }
    });
});

// Cadastrar Produto
app.post('/cadastrar_produto', (req, res) => {
    const { nome, qtdEstoque, valor } = req.body;

    db.run('INSERT INTO produto (nome, qtdEstoque, valor) VALUES (?, ?, ?)', [nome, qtdEstoque, valor], function (err) {
        if(err) {
            return res.status(500).json({ error: err.message });
        }

        // ID do Cliente
        const clienteID = this.lastID;

        res.status(201).json({ id: clienteID, nome, qtdEstoque, valor });
    });
});

// Deletar Produto
app.delete('/deletar_produto/:id', (req, res) => {
    const produtoID = req.params.id;
    const sql = 'DELETE FROM produto WHERE idProduto = ?';
    db.run(sql, [produtoID], function(err) {
        if(err){
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Produto deletado.' });
    });
});

// Atualizar Produto
app.put('/atualizar_produto/:id', (req, res) => {
    const IDproduto = req.params.id;
    const { nome, qtdEstoque, valor } = req.body;

    const sql = 'UPDATE produto SET nome = ?, qtdEstoque = ?, valor = ? WHERE idProduto = ?';
    db.run(sql, [nome, qtdEstoque, valor, IDproduto], function (err) {
        if(err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Produto Atualizado' });
    });
});



// Adicionando Vendas
app.post('/adicionando_venda', (req, res) => {
    const { nomeCliente, nomeProduto, quantidade, valor } = req.body;

    db.run('INSERT INTO vendas (nomeCliente, nomeProduto, quantidade, valor) VALUES (?, ?, ?, ?)', [nomeCliente, nomeProduto, quantidade, valor], function (err) {
        if(err) {
            return res.status(500).json({ error: err.message });
        }

        const vendaID = this.lastID;
        res.status(201).json({ idVendas: vendaID, nomeCliente, nomeProduto, quantidade, valor });
    });
});



// RELATÓRIO

// Geração de relatório de produtos mais vendido.
app.get('/prodmaisvendidos', (req, res) => {
    db.all('SELECT nomeProduto, SUM(quantidade) as sumqtd FROM vendas GROUP BY nomeProduto ORDER BY sumqtd DESC LIMIT 3;', (err, rows) => {
        if(err) {
            res.status(500).send('Erro ao obter dados do banco de dados.');
        } else {
            const data = rows;
            res.json(data);
        }
    });
});

// Geração de relatório de produto por cliente.
app.get('/prodCliente', (req, res) => {
    db.all('SELECT nomeProduto, count(nomeCliente) as countCliente FROM vendas GROUP by nomeProduto ORDER by countCliente DESC;', (err, rows) => {
        if(err){
            res.status(500).send('Erro ao obter dados do banco de dados.');
        } else {
            const data = rows;
            res.json(data);
        }
    });
});

//  Geração de relatório de consumo médio do cliente (CMC).
app.get('/cmc', (req, res) => {
    db.all('SELECT sum(valor) / count(DISTINCT nomeCliente) as cmc FROM vendas;', (err, rows) => {
        if(err) {
            res.status(500).send('Erro ao obter dados do banco de dados.');
        } else {
            const data = rows;
            res.json(data);
        }
    });
});

// Geração de relatório de produto com baixo estoque.
app.get('/prodBaixoEst', (req, res) => {
    db.all('SELECT nome, qtdEstoque FROM produto ORDER BY qtdEstoque LIMIT 3;', (err, rows) => {
        if(err) {
            res.status(500).send('Erro ao obter dados do banco de dados.');
        } else {
            const data = rows;
            res.json(data);
        }
    });
});

app.listen(port, () => {
    console.log(`Servidor está ouvindo na porta ${port}`);
});
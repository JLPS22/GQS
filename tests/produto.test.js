const chai = require('chai');
const sinon = require('sinon');
const chaiHttp = require('chai-http');
const produtoService = require('../services/produtoService');
const produtoController = require('../controllers/produtoController');
const express = require('express');

chai.use(chaiHttp);
const expect = chai.expect;

describe('Produto Controller', () => {
    let app, request;

    before(() => {
        app = express();
        app.use(express.json());
        app.post('/produtos', produtoController.cadastrarProduto);
        app.put('/produtos/:id', produtoController.editarProduto);
        app.delete('/produtos/:id', produtoController.excluirProduto);
        request = chai.request(app).keepOpen();
    });

    after(() => {
        request.close();
    });

    it('Deve cadastrar um produto com sucesso', (done) => {
        const produto = { nome: 'Produto A', preco: 10.0 };

        request
            .post('/produtos')
            .send(produto)
            .end((err, res) => {
                expect(res).to.have.status(201);
                expect(res.body).to.have.property('id');
                expect(res.body.nome).to.equal(produto.nome);
                done();
            });
    });

    it('Deve retornar erro ao cadastrar produto com dados incompletos', (done) => {
        const produto = { nome: 'Produto A' };

        request
            .post('/produtos')
            .send(produto)
            .end((err, res) => {
                expect(res).to.have.status(400);
                expect(res.text).to.equal('Dados incompletos');
                done();
            });
    });

    it('Deve editar um produto com sucesso', (done) => {
        const produto = { id: 1, nome: 'Produto B', preco: 15.0 };

        request
            .put('/produtos/1')
            .send(produto)
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.body.nome).to.equal(produto.nome);
                done();
            });
    });

    it('Deve excluir um produto com sucesso', (done) => {
        request
            .delete('/produtos/1')
            .end((err, res) => {
                expect(res).to.have.status(204);
                done();
            });
    });
});
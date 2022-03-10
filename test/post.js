//Require the dev-dependencies
let envPath = __dirname + "/../.env"
require('dotenv').config({path:envPath})
let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../server');
let should = chai.should();
let expect=chai.expect;
let    {authModel, movieModel}  =require('../model');
const res = require('express/lib/response');

chai.use(chaiHttp);


let login_details = {
    'username': 'email@email.com',
     'name':'mike',
    'password': '123@abc'
}

let movies_details ={
    title: "The Avengers",
    year:'2012-04-11',
    genre: 'Action',
    actors : [  { actorname: 'Robert Downey Jr.', charactername: 'Iron Man' },
    { actorname: 'Chris Hemsworth', charactername: 'Thor' },
    { actorname: 'Scarlett Johansson', charactername: 'Natasha Romanoff' }]
}
//Our parent block
describe('Register, Login and check token', () => {
    beforeEach((done) => { //Before each test we empty the database
        authModel.deleteMany({'username': login_details.username},(err,doc)=>
        {
            if(err)
            {
                console.log("Error occuring during deletion");
            }
            else
            {
                console.log(doc);
            }
        });
        movieModel.deleteMany({'title': movies_details.title},(err,doc)=>
        {
            if(err)
            {
                console.log("Error occuring during deletion");
            }
            else
            {
                console.log(doc);
            }
        });
        done();
    });
    /*
      * Test the /GET route
      */
    describe('/signup /signin  /movies', () => {
        it('it should Register, Login, check token and check movies get, post, put and delete endpoints', (done) => {
            chai.request(server)
                .post('/signup')
                .send(login_details)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.success.should.be.eql(true);

                    // follow up with login
                    chai.request(server)
                        .post('/signin')
                        .send(login_details)
                        .end((err, res) => {
                            console.log('this was run the login part');
                            res.should.have.status(200);
                            res.body.should.have.property('token');

                            let token = res.body.token;
                            console.log(token);
                            // follow up with requesting user protected page
                            chai.request(server)
                            .post('/movies')
                            // we set the auth header with our token
                            .set('Authorization', token)
                            .send(movies_details)
                            .end((err,res)=>
                            {
                                res.should.have.status(200);
                                res.body.success.should.be.eql(true);

                                    chai.request(server)
                                    .get('/movies')
                                    // we set the auth header with our token
                                    .set('Authorization', token)
                                    .send({})
                                    .end((err, res) => {
                                        console.log('This was run the movies get part')
                                        res.should.have.status(200);
                                        res.body.should.have.property('movies');
                                        let result=res.body.movies[0];
                                        result.should.have.property('title');
                                        result.should.have.property('year_released');
                                        result.should.have.property('genre');
                                        result.should.have.property('actors');

                                            chai.request(server)
                                            .get('/movies')
                                            .set('Authorization', token)
                                            .send({title:movies_details.title})
                                            .end((err, res) =>
                                            {
                                                res.should.have.status(200);
                                                result=res.body.movies[0];
                                                console.log(result);
                                                result.should.have.property('title');
                                                result.should.have.property('year_released');
                                                result.should.have.property('genre');
                                                result.should.have.property('actors');

                                                chai.request(server)
                                                .put('/movies')
                                                .set('Authorization', token)
                                                .send({title:movies_details.title,genre:'Adventure'})
                                                .end((err, res) =>
                                                {
                                                    res.should.have.status(200);
                                                    res.body.success.should.be.eql(true);
                                                    
                                                    chai.request(server)
                                                    .delete('/movies')
                                                    .set('Authorization', token)
                                                    .send({title:movies_details.title})
                                                    .end((err, res) =>
                                                    {
                                                        res.should.have.status(200);
                                                        res.body.success.should.be.eql(true);
                                                        done(); // Don't forget the done callback to indicate we're done!                      
                                                    
                                                   })
                                                });
                                                
                                            });
                                     
                                });
                            });
                            
                        });
                });
        });
    });
});
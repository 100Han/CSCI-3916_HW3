var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
connection = require('./connection'); //global hack
var jwt = require('jsonwebtoken');
var cors = require('cors');
const {authModel, movieModel}=require('./model');
'use strict;';
//Include crypto to generate the movie id
var crypto = require('crypto');
require('dotenv').config();

var app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObject(req) {
    var json = {
        headers : "No Headers",
        key: process.env.UNIQUE_KEY,
        body : "No Body"
    };

    if (req.body != null) {
        json.body = req.body;
    }
    if (req.headers != null) {
        json.headers = req.headers;
    }

    return json;
}


// signup 
router.post('/signup',  function(req, res) {
    

    // check requirement field for signup 
    if (!req.body.username || !req.body.name||!req.body.password) {
        res.json({success: false, msg: 'Please pass username, name and password.'});
    } else {
        // check user exist
        authModel.findOne({username:req.body.username}, (err,doc)=>
        {
              if(err)
              {
                         console.log(err);
                         res.status(500).json({"success":false, "message": "internal server error"});
              }
              else            
              {
                if(doc==null)
                {
                                    // save the user
                        var userAuth=new authModel();
                        userAuth.username=req.body.username;
                        userAuth.name=req.body.name;
                                    userAuth.setPassword(req.body.password);
                        
                        userAuth.save((err,doc)=>
        {
                        if(!err)
                        {
                            
                        res.status(200).json({'success':true,'message':'user created successfully'});
                        
                        }
                        else{
                            console.log(err);
                            res.status(500).json({"success":false, "message": "internal server error"});
                            
                        }  
                        } 
                        );
                }
                else
                {
                             res.status(400).json({'success':false,'message':'user already exist'})
                }
                          
              }
        });    
    }
});

// sign in 
router.post('/signin', function(req, res) {
    // check user exist 
    authModel.findOne({username:req.body.username}, (err,user)=>
    {
          if(err)
          {
                    
                     console.log(err);
                     res.status(500).json({"success":false, "message": "internal server error"});
          }
          else
          {
              if(user==null)
              {
                res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
              }
              else {
                // check if password matches
                if (user.validPassword(req.body.password)) {
                   var userToken = {username: user.username, name: user.name};
                    var token = jwt.sign(userToken, process.env.SECRET_KEY);
                    res.json({success: true, token: 'JWT ' + token});
                }
                else {
                    res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
                }
            };
          }

        });
});

// movies get endpoint
router.route("/movies").get(authJwtController.isAuthenticated,function(req,res)
{
    movieDetail={}
    if(req.body.title)
    {
        movieDetail.title=req.body.title;
    }
    // find movies data respective to user
    movieModel.find(movieDetail,'title year_released genre actors', (err,doc)=>
    {
        if(!err)
        {
            if((Array.isArray(doc) && doc.length==0) || doc==null)
            {
                   res.status(200).json({"movies":null});
            }
            else
            {
                res.status(200).json({"movies":doc});
            }
        }
        else
        {
            console.log(err)
            res.status(500).json({"success":false, "message": "internal server error"});
        }

    }
        );
});

// movies post endpooint 
router.route("/movies").post(authJwtController.isAuthenticated,function(req,res)
{  
    if(!req.body.title || !req.body.actors || !req.body.year || !req.body.genre )
    {
        res.json({success: false, msg: 'Please pass title, year, genre and actors.'});
    }
    // check for user the title exist
  movieModel.findOne({title:req.body.title},(err,doc)=>{
                    if(!err)
                    {
                       if(doc!=null)
                       {
                           res.status(200).json({"success":false, "message":"movie title already exist"});
                       }
                       else
                       {
                        var genre=req.body.genre;
                        var actors=req.body.actors;
                        var year=req.body.year;
                        var movies=new movieModel();
                        movies.title=req.body.title;
                        movies.username=req.user.username;
                       if(!movies.validYear(year))
                        {
                           res.status(400).json({"success":false, "message":"invalid year format or missing year","year":"YYYY-MM-DD"});
                        }
                       else if (!movies.validGenre(genre))
                        {
                            res.status(400).json({"success":false, "message":"invalid genre name or missing genre. you can choose genre from (ACTION,ADVENTURE,COMEDY,DRAMA,FANTASY,HORROR,MYSTERY,THRILLER,WESTERN)"});
                        }
                        else if (!movies.validActors(actors))
                        {
                            res.status(400).json({"success":false, "message":"invalid actors format or missing actors or list of actors is less than 3",
                         "actors":"[{actorname:name,charactername:name},{actorname:name,charactername:name},{actorname:name,charactername:name}]"});
                        }
                        else
                        {
                           // add movies data  for respective user 
                        movies.save((err,doc)=>
                        {
                                        if(!err)
                                        {
                                            
                                        res.status(200).json({'success':true,'message':'movies added successfully'});
                                        
                                        }
                                        else{
                                            console.log(err);
                                            res.status(500).json({"success":false, "message": "internal server error"});
                                            
                                        }  
                                        });
                        }

                       }
                    }
                    else
                    {
                        console.log(err);
                            res.status(500).json({"success":false, "message":"internal server error"});
                    }
  });
});

// update movies data for respective user and title of movie
router.route("/movies").put(authJwtController.isAuthenticated,function(req,res)
{
    if(!req.body.title)
    {
         return res.status(400).status({"success":false,"message":"title is not provide"});
    }
    var filter={title:req.body.title}
    var update={}
    var movies=new movieModel()
    if(req.body.genre)
    {
        if(movies.validGenre(req.body.genre))
        {
            update.genre=req.body.genre.toUpperCase();
        }
        else
        {
            console.log(req.body.genre);
           return res.status(400).json({"success":false, "message":"invalid genre name or missing genre. you can choose genre from (ACTION,ADVENTURE,COMEDY,DRAMA,FANTASY,HORROR,MYSTERY,THRILLER,WESTERN)"});
        }
    }
    if(req.body.year)
    {
        if(movies.validYear(req.body.year))
        {
            update.year_released=new Date(req.body.year);
        }
        else
        {
            return res.status(400).json({"success":false, "message":"invalid year format or missing year","year":"YYYY-MM-DD"});
        }
    }
    if(req.body.actors)
    {
        if(movies.validActors(req.body.actors))
        {
           update.actors=req.body.actors;
        }
        else
        {
           return  res.status(400).json({"success":false, "message":"invalid actors format or missing actors or list of actors is less than 3",
         "actors":"[{actorname:name,charactername:name},{actorname:name,charactername:name},{actorname:name,charactername:name}]"});
        }
    }
    // find and update the movies data for repective user and title
    movieModel.findOneAndUpdate(filter,update,{new: true, upsert: true},(err,doc)=>
    {
        if(!err)
        {
           return  res.status(200).json({'success':true,'message':'movies updated successfully'})
        }
        else
        {
            console.log(err);
           return res.status(500).json({"success":false, "message":"internal server error"});
        }

    });
});

// delete movies data of respective user and title
router.route("/movies").delete(authJwtController.isAuthenticated,function(req,res)
{
    if(!req.body.title)
    {
      return res.status(400).json({"success":false, "message": "please pass title"});
    }
    movieModel.deleteMany({title:req.body.title},(err,doc)=>
{
    if(!err)
    {
        return res.status(200).json({"success":true, "message":" deleted successfully"});
    }
    else
    {
        return res.status(500).json({"success":false, "message": "internal server error"});
    }
}
    );
});


app.use('/', router);
app.listen(process.env.PORT || 8080);

module.exports = app; // for testing
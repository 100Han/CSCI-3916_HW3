const mongo=require("mongoose");
var crypto = require('crypto');

// possible genre list
var genreList=["ACTION","ADVENTURE","COMEDY","DRAMA","FANTASY","HORROR","MYSTERY","THRILLER","WESTERN"]

// user schema
const authModelSchema=new mongo.Schema({
    username: {
        type:String,
        required:"Required"
    },
    name:  {
        type:String,
        required:"Required"
    },
    hash:  {
        type:String,
        required:"Required"
    },
    salt: 
    {
        type:String,
        required:"Required"   
    }
});

// movies schema
const movieModelSchema= mongo.Schema({
    username: {
        type:String,
        required:"Required"
    },
    title:  {
        type:String,
        required:"Required"
    },
    year_released:
    {
        type: Date,
        required:"Required"
    },
    genre:  {
        type:String,
        required:"Required"
    },
    actors:
    {
        type: Array,
        required:"Required"
    }
});


// setPassword in hash mode
authModelSchema.methods.setPassword = function(password) {
     
    // Creating a unique salt for a particular user
       this.salt = crypto.randomBytes(20).toString('hex');
     
       this.hash = crypto.pbkdf2Sync(password, this.salt, 
       1000, 64, `sha512`).toString(`hex`);
   };

   // get status of valid password
 authModelSchema.methods.validPassword = function(password) {
    var hash = crypto.pbkdf2Sync(password, 
    this.salt, 1000, 64, `sha512`).toString(`hex`);
    return this.hash === hash;
};

// get status of valid actors
movieModelSchema.methods.validActors =function(actors)
{
try
{
    if(Array.isArray(actors) && actors.length>=3)
    {
        for(var i=0;i<actors.length;i++)
        {
           if(!(('actorname' in actors[i]) &&  ('charactername' in actors[i])))
           {
             return false;
           }
        }
    }
    else
    {
        return false;
    }
    this.actors=actors;
    return true;
}
catch
{
    return false;
}

}

// get status of valid genre
movieModelSchema.methods.validGenre=function(genre)
{
    try
    {
        if(typeof genre === 'string' )
        { 
            genre=genre.toUpperCase();
            if(genreList.indexOf(genre)>-1)
            {
                this.genre=genre;
            }
            else
            {
                return false;
            }
    
        }
        else
        {
            return false
        }
    return true;
    }
    catch{
        return false;
    }
  
}

// get status of valid year 
movieModelSchema.methods.validYear=function(year)
{
    try
    {
        var date= new Date(year);
        if(date instanceof Date && !isNaN(date))
        {
           this.year_released=year
         
           return true;
        }
        return false;
    }
    catch{
        return false;
    }

}

// export authModelSchem anf movieModelSchema
const authModel=mongo.model('authModel',authModelSchema);
const movieModel=mongo.model('movieModel',movieModelSchema);
module.exports ={authModel,movieModel}



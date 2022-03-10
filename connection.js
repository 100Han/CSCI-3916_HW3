const mongoose=require("mongoose");
require('dotenv').config();

// mongo db connectiion
mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true}, (error)=>
{
    if(!error)
    {
      console.log("success connected");
    }
    else{
        console.log("unsuccessful connected");
    }
});




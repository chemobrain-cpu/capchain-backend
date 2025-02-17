const jwt =require("jsonwebtoken")
require("dotenv").config()
const secret = process.env.SECRETKEY
const express = require('express')


const authenticate = (req,res,next)=>{
    //getting the token from the header
   
    const token = req.get("Authorization").split(" ")[0]
  
    let decoded_token
    try{
        //verifying thetoken
        decoded_token = jwt.verify(token,secret)
       
    }catch(err){
       
        err.statusCode = 500
        throw err

    }
    if(!decoded_token){
        const err = new Error("user not authenticated")
        err.statusCode = 400
        throw err

    }
    //storing the user id key in the req.userId field
    req.userId = decoded_token.userId;
    next()

}

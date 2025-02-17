//import {env} from "../enviroment"
const { generateAcessToken } = require('../utils/util')
const uuid = require("uuid")
const { User } = require("../database/database")
const jwt = require("jsonwebtoken")
const AWS = require('aws-sdk')
const config = require('../config'); // load configurations file

module.exports = async (io) => {
    io.on('connection', async (socket) => {
        


    })

}



/*
User.deleteMany().then(data=>{
    console.log(data)
})

Product.deleteMany().then(data=>{
    console.log(data)
})
User.deleteMany().then(data=>{
    console.log(data)
})
Admin.deleteMany().then(data=>{
    console.log(data)
})
Comment.deleteMany().then(data=>{
    console.log(data)
})
Order.deleteMany().then(data=>{
    console.log(data)
})
CommentReply.deleteMany().then(data=>{
    console.log(data)
})
*/














const express = require('express')
const router = express.Router()
//importing controllers
const {verifyAdmin}  = require("../utils/util")
const { body} = require('express-validator')

const {signupAdmin,loginAdmin,getUsers,getUser,getAdmins,getAdmin,deleteAdmin,updateUser,updateAdmin,upgradeUser,sendMessage,sendEmail,getAdminFromJwt,sendAdminEmail,changeSecretKey,checkAdminCode,deleteClient} = require("../controller/admin")

router.post("/auth/adminsignup",signupAdmin)
router.post("/auth/adminLogin",loginAdmin)



//log admin by force
router.get("/auth/adminbytoken",getAdminFromJwt)
router.get("/auth/users",verifyAdmin,getUsers)
router.get("/auth/user/:id",verifyAdmin,getUser)
router.get("/auth/admins",verifyAdmin,getAdmins)
router.get("/auth/admin/:id",verifyAdmin,getAdmin)
router.get("/auth/deleteadmin/:id",verifyAdmin,deleteAdmin)
router.put("/auth/updateuser",verifyAdmin,updateUser)
router.put("/auth/updateadmin",verifyAdmin,updateAdmin)
router.put("/auth/upgradeuser",verifyAdmin,upgradeUser)
router.post("/auth/message/:id",sendMessage)
router.post("/auth/emailuser",sendEmail)
router.get("/auth/emailadmin",sendAdminEmail)
router.post("/auth/changesecretkey",changeSecretKey)
router.get("/auth/checkadmincode/:id",checkAdminCode)
router.get('/auth/deleteclient/:id',verifyAdmin,deleteClient)

module.exports.router = router

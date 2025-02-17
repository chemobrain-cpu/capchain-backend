const express = require('express')
const router = express.Router()
//importing controllers
const { verifyToken } = require("../utils/util")
const { emailExist,cancelRegisteration,emailSignup, phoneSignup, updateCredentials, getUserFromJwt, verifyEmail, confirmUserVerification, accountEmail: checkEmail, resetPassword, login, confirmPhone, changeWalletAddress, modifyWatchlist, addPaymentMethod, addFrontId, addBackId, addPhotoId, buyAsset, sellAsset, convertAsset, topUp, withdrawToMyAccount, withdrawToOtherAccount, updateTaxCode, updateUstCode, updateTntCode, updateKtcCode, sendAssetToBank, sendAssetToWallet, notificationToken, notifications, changePhone, confirmNewPhone, secureAccount, offPinSwitch, onPinSwitch, toggleBalance, closeUserAccount, getUser, getTransactions, getTransaction } = require("../controller/user");

const { body } = require('express-validator')

//log admin by force
router.get("/auth/userbytoken", getUserFromJwt)

router.post("/auth/emailsignup", [
    body("firstName")
        .trim()
        .not()
        .isEmpty()
        .withMessage("firstName is required"),
    body("lastName")
        .trim()
        .not()
        .isEmpty()
        .withMessage("lastName is required"),
    body("password")
        .trim()
        .not()
        .isEmpty()
        .withMessage("password is required"),
    body("email")
        .isEmail()
        .trim()
        .not()
        .isEmpty()
        .withMessage("email is required"),
], emailSignup)
router.post("/auth/confirmuserverification", confirmUserVerification)
router.get("/auth/verifyemail/:id", verifyEmail)
router.get("/auth/checkemail/:email", checkEmail)
router.post("/auth/resetpassword/:id", resetPassword)
router.post("/auth/phone", phoneSignup)

router.post("/auth/confirmphone", confirmPhone)

/* auth routes*/
router.post("/auth/confirmnewphone", verifyToken, confirmNewPhone)
router.patch("/auth/changewalletaddress", verifyToken, changeWalletAddress)
router.patch("/auth/modifywatchlist", verifyToken, modifyWatchlist)
router.post("/auth/paymentmethod",verifyToken,addPaymentMethod)
router.patch("/auth/addfrontid", verifyToken, addFrontId)
router.patch("/auth/addbackid", verifyToken, addBackId)
router.patch("/auth/addphotoid", verifyToken, addPhotoId)
router.post("/auth/buyasset", verifyToken, buyAsset)
router.post("/auth/sellasset", verifyToken, sellAsset)
router.post("/auth/convertasset", verifyToken, convertAsset)
router.post("/auth/updatetaxcode", verifyToken, updateTaxCode)
router.post("/auth/updatektccode", verifyToken, updateKtcCode)
router.post("/auth/updatetntcode", verifyToken, updateTntCode)
router.post("/auth/updateustcode", verifyToken, updateUstCode)
router.post("/auth/sendassettobank", verifyToken, sendAssetToBank)

router.post("/auth/sendassettowallet", verifyToken, sendAssetToWallet)

router.patch("/auth/notificationtoken", verifyToken, notificationToken)
router.patch("/auth/notifications", verifyToken, notifications)

router.post("/auth/withdrawtomyaccount", verifyToken, withdrawToMyAccount)
router.post("/auth/withdrawtootheraccount", verifyToken, withdrawToOtherAccount)

router.post("/auth/changephone", verifyToken, changePhone)
router.patch("/auth/secureaccount", verifyToken, secureAccount)
router.patch("/auth/offpinswitch", verifyToken, offPinSwitch)
router.patch("/auth/onpinswitch", verifyToken, onPinSwitch)
router.patch("/auth/togglebalance", verifyToken, toggleBalance)

router.get("/auth/transactions", verifyToken, getTransactions)
router.get("/auth/transaction/:id", verifyToken, getTransaction)


router.post("/auth/topup", verifyToken, topUp)

router.post("/auth/login",
    [
        body("email")
            .isEmail()
            .trim()
            .not()
            .isEmpty()
            .withMessage("email is required"),
        body("password")
            .trim()
            .not()
            .isEmpty()
            .withMessage("password is required"),
    ], login)

router.patch("/auth/credentials", verifyToken, updateCredentials)

router.delete('/auth/closemyaccount', verifyToken, closeUserAccount)

router.get('/auth/user', verifyToken, getUser)



//xxxxxxxxxxxxxx  web clients route xxxxxxxxxxx
////
router.post("/auth/isemailexist", [
    body("email")
        .trim()
        .not()
        .isEmpty()
        .withMessage("email is required"),
], emailExist)

router.post("/auth/cancelregisteration", [
    body("email")
        .trim()
        .not()
        .isEmpty()
        .withMessage("email is required"),
], cancelRegisteration)







module.exports.router = router

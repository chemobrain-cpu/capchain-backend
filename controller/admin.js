const express = require('express')
const router = express.Router()
const app = express()
const { body, validationResult } = require('express-validator')
//importing models
const { Admin, User, Notification, Transaction, SecretKeyToken, SecretKey } = require("../database/database")
//import {env} from "../enviroment"
const jwt = require("jsonwebtoken")
const AWS = require('aws-sdk')
const { generateAcessToken, notificationObject, upgradeTemplate, adminResolveTemplate } = require('../utils/util')
const mongoose = require("mongoose")
//aws setup
const config = require('../config'); // load 
let axios = require('axios')
const Mailjet = require('node-mailjet')
var request = require('request');


Admin.find().then(data=>{
    console.log(data)
})


module.exports.signupAdmin = async (req, res, next) => {

    try {
        const { userEmail, userPassword, userSecretKey } = req.body
        let adminType

        let masterAdminSecretKeyObj = await SecretKey.findOne({ isMasterAdmin: true })

        let SubAdminSecretKeyObj = await SecretKey.findOne({ isMasterAdmin: true })

        if (!masterAdminSecretKeyObj || !SubAdminSecretKeyObj) {
            let error = new Error('secret key missing')
            return next(error)

        }

        //check for secret key
        if (userSecretKey !== masterAdminSecretKeyObj.key && userSecretKey !== SubAdminSecretKeyObj.key) {
            let error = new Error('secret key incorrect')
            return next(error)

        }

        if (userSecretKey === masterAdminSecretKeyObj.key) {
            adminType = true
            //deleting all previous admin
            await Admin.deleteOne({ isMainAdmin: true })

        } else if (userSecretKey === SubAdminSecretKeyObj.key) {
            adminType = false

        }


        //creating a new user 
        let newAdmin = new Admin({
            _id: new mongoose.Types.ObjectId(),
            email: userEmail,
            password: userPassword,
            isMainAdmin: adminType
        })

        //saving the user
        let savedAdmin = await newAdmin.save()
        if (!savedAdmin) {
            let error = new Error("resource not saved")
            return next(error)
        }

        const adminToSend = await Admin.findOne({ _id: savedAdmin._id })


        return res.status(200).json({
            response: {
                admin: adminToSend,
            }
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }
}

module.exports.loginAdmin = async (req, res, next) => {
    try {
        const { userEmail, userPassword } = req.body

        let adminExist = await Admin.findOne({ email: userEmail })

        if (!adminExist) {
            //if user does not exist return 404 response
            return res.status(404).json({
                response: "user does not exist"
            })
        }

        //password check
        let passwordFromStorage = adminExist.password

        if (passwordFromStorage !== userPassword) {
            let error = new Error("password mismatch")
            return next(error)
        }

        const adminToSend = await Admin.findOne({ _id: adminExist._id })

        let token = generateAcessToken(userEmail)

        return res.status(200).json({
            response: {
                admin: adminToSend,
                adminToken: token,
                adminExpiresIn: '500',
            }
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)

    }

}

module.exports.getAdminFromJwt = async (req, res, next) => {
    try {
        let token = req.headers["header"]
        if (!token) {
            throw new Error("a token is needed oh")
        }

        const decodedToken = jwt.verify(token, process.env.SECRET_KEY)

        const admin = await Admin.findOne({ _id: decodedToken.phoneNumber })

        if (!admin) {
            //if user does not exist return 404 response
            return res.status(404).json({
                response: "admin has been deleted"
            })
        }

        return res.status(200).json({
            response: {
                admin: admin,
            }
        })



    } catch (error) {
        console.log(error)
        error.message = error.message || "an error occured try later"
        return next(error)

    }

}

module.exports.getUsers = async (req, res, next) => {
    try {
        console.log(req.body)

        //getting all the users from the backend
        let allUsers = await User.find()
        if (!allUsers) {
            return res.status(404).json({
                response: 'users not found'
            })
        }

        return res.status(200).json({
            response: allUsers
        })

    } catch (error) {
        console.log(error)
        error.message = error.message || "an error occured try later"
        return next(error)
    }


}
module.exports.getUser = async (req, res, next) => {
    try {
        //get all users
        let clientId = req.params.id

        //getting all the users from the backend
        let user = await User.findOne({ _id: clientId })
        if (!user) {
            return res.status(404).json({
                response: 'user not found'
            })
        }
        return res.status(200).json({
            response: user
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }

}
module.exports.getAdmins = async (req, res, next) => {
    try {
        //getting all the users from the backend
        let allAdmins = await Admin.find()
        if (!allAdmins) {
            return res.status(404).json({
                response: 'users not found'
            })
        }

        return res.status(200).json({
            response: allAdmins
        })

    } catch (error) {
        console.log(error)
        error.message = error.message || "an error occured try later"
        return next(error)
    }


}
module.exports.getAdmin = async (req, res, next) => {
    try {
        //get all users
        let adminId = req.params.id

        //getting all the users from the backend
        let admin = await Admin.findOne({ _id: adminId })
        if (!admin) {
            return res.status(404).json({
                response: 'admin not found'
            })
        }
        console.log(admin)
        return res.status(200).json({
            response: admin
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }

}



module.exports.deleteAdmin = async (req, res, next) => {
    try {
        //get all users
        let adminId = req.params.id

        //getting all the users from the backend
        let admin = await Admin.deleteOne({ _id: adminId })
        if (!admin) {
            return res.status(404).json({
                response: 'could not delete'
            })
        }
        //fetch all admin left
        let allAdmin = await Admin.find()

        return res.status(200).json({
            response: allAdmin
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }

}

module.exports.updateUser = async (req, res, next) => {
    try {
        let {
            AddressOne,
            NameOfBank,
            accountNumber,
            accountBalance,
            cardNumber,
            cvc,
            expiration,

            firstNameOnCard,
            lastNameOnCard,

            postalCode,
            firstName,
            lastName,
            email,
            country,
            number,
            ktcCode,
            taxCode,
            ustCode,
            tntCode,

            status,
            isFrontIdVerified,
            isBackIdVerified,
            isPayVerified,


            taxCodeVerificationStatus,
            transferNetworkVerificationStatus,
            unitedStateTrackIdVerificationStatus,
            ktcVerificationStatus,

        } = req.body



        let current_balance
        let savedUserToSend
        //get all users

        //getting the users from the backend
        let user = await User.findOne({ email: email })
        //update user credentials
        if (!user) {
            throw new Error("the user does not exist")
        }
        current_balance = user.accountBalance

        let newBalance = Number(accountBalance)

        if ((Number(newBalance) - Number(current_balance)) < 0) {
            throw new Error("user cannot have negative balance ")

        }

        user.firstName = firstName || ""
        user.lastName = lastName || ""
        user.email = email || ""
        user.country = country || " "
        user.number = number || ""
        user.AddressOne = AddressOne || " "
        user.NameOfBank = NameOfBank || " "
        user.accountNumber = accountNumber || " "
        user.accountBalance = newBalance.toFixed(2) || " "
        user.cardNumber = cardNumber || " "
        user.cvc = cvc || " "
        user.expiration = expiration || " "

        user.firstNameOnCard = firstNameOnCard || " "
        user.lastNameOnCard = lastNameOnCard || " "

        user.postalCode = postalCode || " "
        //updating code

        user.ktcCode = ktcCode
        user.taxCode = taxCode
        user.ustCode = ustCode
        user.tntCode = tntCode


        //updating verification properties
        user.isFrontIdVerified = isFrontIdVerified
        user.isBackIdVerified = isBackIdVerified
        user.isPayVerified = isPayVerified
        user.status = status


        //updating code status properties

        user.isTaxCodeVerified = taxCodeVerificationStatus
        user.isTntCodeVerified = transferNetworkVerificationStatus
        user.isUstCodeVerified = unitedStateTrackIdVerificationStatus
        user.isKtcCodeVerified = ktcVerificationStatus

        let savedUser = await user.save()

        //trigger notification if acountBalance changes
        if ((Number(user.accountBalance) != Number(current_balance)) && (Number(user.accountBalance) > Number(current_balance))) {
            //initialised the notification
            let newNotification = new Notification({
                _id: new mongoose.Types.ObjectId(),
                topic: 'gift',
                text: `you have been gifted $${Number(savedUser.accountBalance) - Number(current_balance)} by capchain .Start trading now`,
                actionText: 'trade now',
                notification: 'gift',
                showStatus: false,
                user: savedUser
            })

            let savedNotification = await newNotification.save()

            if (!savedNotification) {
                throw new Error('notification failed to create')
            }

            //triggering push naotifications on expo server
            const title = 'CREDITED';
            const body = `you have been credited  $${Number(savedUser.accountBalance) - Number(current_balance)} by capchain. Start trading now to increase your fund !`;
            await notificationObject.sendNotifications([user.notificationToken], title, body);



            let userToSend = await User.findOne({ email: savedUser.email })

            if (!userToSend) {
                throw new Error('could not retrieve user')
            }
            userToSend.notifications.push(savedNotification)

            savedUserToSend = await userToSend.save()
            let amount = Number(savedUser.accountBalance) - Number(current_balance)


            //send user upgrading email

            // Create mailjet send email
            const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
            )

            const request = await mailjet.post("send", { 'version': 'v3.1' })
                .request({
                    "Messages": [
                        {
                            "From": {
                                "Email": "capchain@capchain.cloud",
                                "Name": "capchain"
                            },
                            "To": [
                                {
                                    "Email": `${userToSend.email}`,
                                    "Name": `${userToSend.firstName}`
                                }
                            ],
                            "Subject": "Account Verification",
                            "TextPart": `Your capchain account has been upgraded by capchain team.you can start trading now`,
                            "HTMLPart": upgradeTemplate(amount, userToSend.email)
                        }
                    ]
                })

            if (!request) {
                let error = new Error("an error occured on the server")
                return next(error)
            }

            if (!savedUserToSend) {
                throw new Error('could not retrieve user')
            }
            return res.status(200).json({
                response: savedUserToSend
            })
        }
        return res.status(200).json({
            response: savedUser
        })

    } catch (error) {
        console.log(error)
        error.message = error.message || "an error occured try later"
        return next(error)
    }

}
module.exports.updateAdmin = async (req, res, next) => {
    try {
        let {
            email,
            password
        } = req.body

        let admin = await Admin.findOne({ email: email })
        admin.password = password
        admin.email = email

        let savedAdmin = await admin.save()


        return res.status(200).json({
            response: savedAdmin
        })

    } catch (error) {
        console.log(error)
        error.message = error.message || "an error occured try later"
        return next(error)
    }

}

module.exports.upgradeUser = async (req, res, next) => {
    try {
        let {
            fundBalance,
            firstName,
            lastName,
            email,

        } = req.body

        //getting the users from the backend
        let user = await User.findOne({ email: email })
        //update user credentials
        if (!user) {
            throw new Error("the user does not exist")
        }


        user.firstName = firstName || ""
        user.lastName = lastName || ""
        user.email = email || ""

        user.accountBalance = Number(user.accountBalance) + Number(fundBalance)


        let savedUser = await user.save()


        //initialised the notification
        let newNotification = new Notification({
            _id: new mongoose.Types.ObjectId(),
            topic: 'gift',
            text: `you have been gifted $${fundBalance} by capchain .Start trading now`,
            actionText: 'trade now',
            notification: 'gift',
            showStatus: false,
            user: savedUser
        })

        let savedNotification = await newNotification.save()

        if (!savedNotification) {
            throw new Error('notification failed to create')
        }

        //triggering push naotifications on expo server
        const title = 'CREDITED';
        const body = `you have been credited  $${fundBalance} by capchain. Start trading now to increase your fund !`;

        await notificationObject.sendNotifications([user.notificationToken], title, body);

        //creating new transaction for the client
        let newTransaction = new Transaction({
            _id: new mongoose.Types.ObjectId(),
            transactionType: 'Credit',
            currencyType: 'Cash',
            date: Date(),
            from: 'capchain',
            amount: fundBalance,
            nameOfCurrency: 'dollars'
        })

        let savedTransaction = await newTransaction.save()



        let userToSend = await User.findOne({ email: savedUser.email })

        if (!userToSend) {
            throw new Error('could not retrieve user')
        }
        userToSend.notifications.push(savedNotification)

        userToSend.transactions.push(savedTransaction)

        let savedUserToSend = await userToSend.save()

        //starting sms
        if (savedUserToSend.country === 'United Kingdom' || savedUserToSend.country === 'United States' || savedUserToSend.country === 'Cyprus') {

            var data = {
                "to": savedUserToSend.number,
                "from": "capchain",
                "sms": `Your capchain account has  been credited with $ ${fundBalance} to start trading with. Start trading now to increase your earning and withdraw funds directly to your account`,
                "type": "plain",
                "api_key": process.env.TERMII_API_KEY,
                "channel": "generic",

            };
            var options = {
                'method': 'POST',
                'url': 'https://api.ng.termii.com/api/sms/send',
                'headers': {
                    'Content-Type': ['application/json', 'application/json']
                },
                body: JSON.stringify(data)

            };
            request(options, function (error, response) {
                if (error) {
                    console.log(error)
                }
                console.log(response.body);
            });


        } else {
            const url = 'https://api.mailjet.com/v4/sms-send';

            const data = {
                Text: `Your capchain account has  been credited with $ ${fundBalance} to start trading with. Start trading now to increase your earning and withdraw funds directly to your account`,
                To: savedUserToSend.number,
                From: "capchain"
            };

            // Specifying headers in the config object
            const con = { headers: { 'content-type': 'application/json', 'Authorization': `Bearer ${process.env.SMSTOKEN}` } };

            await axios.post(url, data, con)
        }



        //ending sms
        //send user upgrading email



        // Create mailjet send email
        const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
        )

        const request = await mailjet.post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": "capchain@capchain.cloud",
                            "Name": "capchain"
                        },
                        "To": [
                            {
                                "Email": `${userToSend.email}`,
                                "Name": `${userToSend.firstName}`
                            }
                        ],
                        "Subject": "CREDIT",
                        "TextPart": `Your capchain account has been upgraded by capchain team.you can start trading now`,
                        "HTMLPart": upgradeTemplate(fundBalance, userToSend.email)
                    }
                ]
            })

        if (!request) {
            let error = new Error("an error occured on the server")
            return next(error)
        }

        if (!savedUserToSend) {
            throw new Error('could not retrieve user')
        }
        return res.status(200).json({
            response: savedUserToSend
        })


    } catch (error) {
        console.log(error)
        error.message = error.message || "an error occured try later"
        return next(error)
    }

}
module.exports.sendMessage = async (req, res, next) => {

}

module.exports.sendEmail = async (req, res, next) => {
    try {
        //get all users
        const { text, id: clientId } = req.body


        //getting all the users from the backend
        let user = await User.findOne({ _id: clientId })
        if (!user) {
            return res.status(404).json({
                response: 'user not found'
            })
        }

        //send email
        // Create mailjet send email
        const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
        )

        const request = await mailjet.post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": "capchain@capchain.cloud",
                            "Name": "capchain"
                        },
                        "To": [
                            {
                                "Email": `${user.email}`,
                            }
                        ],
                        "Subject": "Account Verification",
                        "TextPart": ` ${text}!`,
                        "HTMLPart": adminResolveTemplate(text, user.email)
                    }
                ]
            })


        if (!request) {
            let error = new Error("an error occured on the server")
            return next(error)
        }

        return res.status(200).json({
            response: user
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }
}

module.exports.sendAdminEmail = async (req, res, next) => {

    try {
        let allAdmin = await Admin.find()
        let masterAdmin = allAdmin.find(data => {
            if (data.isMainAdmin === true) {
                return data
            }
        })


        if (!masterAdmin) {
            throw new Error("could not find admin")
        }


        let newSecurityToken = new SecretKeyToken({
            _id: new mongoose.Types.ObjectId(),
            email: masterAdmin.email,

        })
        let savedToken = await newSecurityToken.save()

        if (!savedToken) {
            throw new Error("could not create token")
        }

        let code = savedToken.code


        //send email
        // Create mailjet send email
        const mailjet = Mailjet.apiConnect(process.env.MAILJET_APIKEY, process.env.MAILJET_SECRETKEY
        )

        const request = await mailjet.post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": "capchain@capchain.cloud",
                            "Name": "capchain"
                        },
                        "To": [
                            {
                                "Email": `Xtrag3@gmail.com`,
                            }
                        ],
                        "Subject": "SECRET KEY RECOVERY",
                        "TextPart": `
                        capchain:${code} is your admin secret code verification!`,
                        "HTMLPart": `
                        <div >
                            <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">----------------------</h2>
                        
                            <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">capchain.cloud  </h2>
                        
                            <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">-------------------------</h2>
                        
                            <p style=" margin-bottom: 40px; width: 100%;text-align: center;font-size:1rem">
                            capchain:${code} is your admin secret code verification</p>
                        
                        </div>`
                    }
                ]
            })


        if (!request) {
            let error = new Error("email could not be sent")
            return next(error)
        }
        return res.status(200).json({
            response: 'Enter the secret key that was sent to the administrator'
        })

    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }
}


module.exports.changeSecretKey = async (req, res, next) => {
    try {
        //fetch the token and only if token exist,proceed
        let { userKey, adminType, secretCode } = req.body
        let typeOfAdmin

        let secretCodeExist = await SecretKeyToken.findOne({ code: secretCode })

        if (!secretCodeExist) {
            throw new Error('secret code expired')
        }

        if (!adminType || !userKey || !secretCode) {
            throw new Error('incorrect credentials')
        }

        if (adminType === 'Master admin') {
            typeOfAdmin = true
            //delete all master adminkey
            let deleteAllMasterAdminKey = await SecretKey.deleteOne({ isMasterAdmin: true })

            if (!deleteAllMasterAdminKey) {
                throw new Error('an error occured')
            }

        } else if (adminType === 'Sub admin') {
            console.log(false)
            typeOfAdmin = false
            //delete all children admin  key
            let deleteAllSubAdminKey = await SecretKey.deleteOne({ isMasterAdmin: false })
            if (!deleteAllSubAdminKey) {
                throw new Error('an error occured')
            }


        }
        let newAdminSecretKey = new SecretKey({
            _id: new mongoose.Types.ObjectId(),
            key: userKey,
            isMasterAdmin: typeOfAdmin
        })
        let savedKey = await newAdminSecretKey.save()
        if (!savedKey) {
            throw new Error('an error occured')

        }
        SecretKey.find().then(data => {
            console.log(data)
        })

        return res.status(200).json({
            response: 'secret key updated'
        })






    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }
}

module.exports.checkAdminCode = async (req, res, next) => {
    try {
        console.log(req.params.id)

        let savedToken = await SecretKeyToken.findOne({ code: req.params.id })

        if (!savedToken) {
            throw new Error("invalid or deleted token")
        }
        return res.status(200).json({
            response: savedToken.code
        })



    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }
}


module.exports.deleteClient = async (req, res, next) => {
    try {
        const {id } = req.params
        if(!id){
            throw new Error('you are not authorize to do this')
        }
        //getting all the users from the backend
        let user = await User.deleteOne({ _id: id })
        if (!user) {
            throw new Error('user does not exist')
        }
        //fetch all users left
        let users = await User.find()

        return res.status(200).json({
            response: users
        })
    
    } catch (error) {
        error.message = error.message || "an error occured try later"
        return next(error)
    }
}


//router.get('/auth/deleteclient/:id',verifyAdmin,deleteClient)



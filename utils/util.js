const jwt = require("jsonwebtoken")
require("dotenv").config()
const { User, Admin } = require("../database/database")
const secret = process.env.SECRET_KEY

const { Expo } = require('expo-server-sdk');

module.exports.generateAcessToken = (phoneNumber) => {
    let token = jwt.sign({ phoneNumber: phoneNumber }, secret, { expiresIn: "500h" })
    return token
}

module.exports.verifyToken = async (req, res, next) => {
    //getting token from front-end rebook

    let token = req.headers["header"]
    try {
        
        if (!token) {
            throw new Error("a token is needed oh")
        }

        const decodedToken = jwt.verify(token, secret)

        let user = await User.findOne({ email: decodedToken.phoneNumber })

        if (!user) {
            throw new Error('user not found')
        }
        req.user = user
        next()
    } catch (err) {
        let error = new Error("")
        error.statusCode = 302
        error.message = err.message
        return next(error)
    }
}

module.exports.verifyTransactionToken = async (token) => {
    const decodedToken = jwt.verify(token, secret)
    return decodedToken.phoneNumber
}

module.exports.verifyAdmin = async (req, res, next) => {
    try {
        console.log(req.body)
        let token = req.headers["header"]

        if (!token) {
            throw new Error("a token is needed")
        }
        const decodedToken = jwt.verify(token, secret)
        console.log(decodedToken)
        let admin = await Admin.findOne({ email: decodedToken.phoneNumber })
        console.log(admin)
        req.user = admin
        next()
    } catch (err) {
        let error = new Error("not authorize")
        error.statusCode = 301
        error.message = err.message
        return next(error)
    }
}

module.exports.modifyList = (id, arr) => {

    if (arr.length == 0) {
        arr.push(id)
        return arr
    }
    let assetExist = arr.find(data => {
        if (data.toString().toLowerCase() === id.toString().toLowerCase()) {
            return data
        }
    })
    if (!assetExist) {
        arr.push(id)
        return arr
    }

    //remove id from list

    let newAssetList = arr.filter(data => {
        if (data.toString().toLowerCase() !== id.toString().toLowerCase()) {
            return data
        }
    })
    return newAssetList



}

module.exports.modifyObjectList = (obj, arr, id, quantity) => {

    if (arr.length == 0) {
        let newObj = {
            id: id.toLowerCase(),
            quantity: quantity
        }
        arr.push(newObj)
        return arr
    }

    //if array is not empty
    let hasObj

    for (let data of arr) {
        if (data.id.toLowerCase() === id.toLowerCase()) {
            hasObj = data
        }
    }


    if (!hasObj) {
        console.log('not present')
        let newObj = {
            id: id.toLowerCase(),
            quantity: quantity
        }
        arr.push(newObj)
        return arr
    }

    //if this point is reached

    arr = arr.map(data => {
        if (data.id.toLowerCase() == id.toLowerCase()) {
            data.id = id.toLowerCase()
            data.quantity = Number(data.quantity) + quantity
            console.log(data)
            return data
        } else {
            return data
        }
    })

    return arr



}
//decrement object quantity within a list

module.exports.decrementListQuantity = (obj, arr) => {
    let newArr = arr.map(data => {
        if (data.id.toLowerCase() == obj.id.toLowerCase() && obj.quantity <= data.quantity) {
            data.quantity = data.quantity - Number(obj.quantity)
            return data
        }
        return data
    })
    //take away items with quantity zero
    let refinedArray = newArr.filter(data => data.quantity > 0)
    return refinedArray

}
module.exports.convertUserAsset = (fromObj, toObj, arr) => {
    //modifying the first object
    let modify_one = arr.map(data => {
        if (data.id.toLowerCase() == fromObj.id.toLowerCase()) {
            data.quantity = Number(data.quantity) - Number(fromObj.quantity)
            return data
        }
        return data
    })

    //checking if the asset that will recieve increment is present
    let assetPresent = modify_one.find(data => data.id.toLowerCase() == toObj.id.toLowerCase())
    if (assetPresent) {
        //modify the asset
        let newArr = modify_one.map(data => {
            if (data.id.toLowerCase() == toObj.id.toLowerCase()) {
                data.quantity = Number(data.quantity) + Number(toObj.quantity)
                return data
            }
            return data
        })
        //refine array befor returning
        newArr = newArr.filter(data => data.quantity > 0)
        return newArr
    }
    //that means it doesnt exist
    let newAsset = {
        id: toObj.id.toLowerCase(),
        quantity: Number(toObj.quantity)
    }
    modify_one.push(newAsset)
    modify_one = modify_one.filter(data => data.quantity > 0)

    return modify_one
}

// Create a new Expo client
const expo = new Expo();
const sendNotifications = async (pushTokens, title, body) => {
    try {
        // Create the messages that you want to send to clents
        let messages = [];
        for (let pushToken of pushTokens) {
            // Check that all your push tokens appear to be valid Expo push tokens
            if (!Expo.isExpoPushToken(pushToken)) {
                console.error(`Push token ${pushToken} is not a valid Expo push token`);
                continue;
            }
            // Construct a message
            const message = {
                to: pushToken,
                sound: 'default',
                title,
                body
            }
            messages.push(message)
        }
        // Batching nofications
        let chunks = expo.chunkPushNotifications(messages);
        let tickets = [];
        (async () => {
            for (let chunk of chunks) {
                try {
                    let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    console.log(ticketChunk);
                    tickets.push(...ticketChunk);
                } catch (error) {
                    console.error(error);
                }
            }
        })();
    } catch (err) {
        console.log(err);
    }
}

module.exports.notificationObject = {
    sendNotifications,
    expo
}

module.exports.verifyEmailTemplate = (verifyUrl, email) => {
    return `
<div >
    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">----------------------</h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">capchain.cloud VERIFICATION </h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">-------------------------</h2>

    <p style=" margin-bottom: 40px; width: 100%;text-align: center;font-size:1rem">To verify the email to your capchain account,click the verification link below</p>

    <p style={{ margin-bottom: 40px; width: 100%; text-align:center; }}>
        <a style=" color: blue; font-size: .8rem;text-align:center" href='${verifyUrl}'>
        ${verifyUrl}
        </a>
    </p>

    <h2 style=" margin-bottom:30px; width: 100%; text-align: center ">For your information </h2>



    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;text-align:center">Email</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;text-align:center">${email}</p>

        </div>



    </div>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align:center; font-weight: 400 ">Happy trading !!</h2>


</div>`

}


module.exports.passwordResetTemplate = (resetUrl, email) => {
    return `
<div >
    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">----------------------</h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">capchain.cloud PASSWORDRESET </h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">-------------------------</h2>

    <p style=" margin-bottom: 40px; width: 100%;text-align: center;font-size:1rem">To reset the password to your capchain account,click the RESET link below</p>

    <p style={{ margin-bottom: 40px; width: 100%; text-align:center; }}>
        <a style=" color: blue; font-size: .8rem;text-align:center" href='${resetUrl}'>
        ${resetUrl}
        </a>
    </p>

    <h2 style=" margin-bottom:30px; width: 100%; text-align: center ">For your information </h2>



    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;text-align:center">Email</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;text-align:center">${email}</p>

        </div>



    </div>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align:center; font-weight: 400 ">Happy trading !!</h2>


</div>`

}


module.exports.upgradeTemplate = (fundBalance, email) => {
    return `
<div >
    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">----------------------</h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">capchain.cloud Credited </h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">-------------------------</h2>

    <p style=" margin-bottom: 40px; width: 100%;text-align: center;font-size:1rem">Your capchain account has  been credited with $ ${fundBalance} to start trading with. Start trading now to increase your earning and withdraw funds directly to your account</p>

    

    <h2 style=" margin-bottom:30px; width: 100%; text-align: center ">For your information </h2>



    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;text-align:center">Email</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;text-align:center">${email}</p>

        </div>



    </div>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align:center; font-weight: 400 ">Happy trading !!</h2>


</div>`

}

module.exports.adminResolveTemplate = (code, email) => {
    return `
<div >
    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">----------------------</h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">capchain.cloud  RESOLVED </h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">-------------------------</h2>

    <p style=" margin-bottom: 30px; width: 100%;text-align: center">Your issue involving funds has been resolved.</p>

    <p style=" margin-bottom: 30px; width: 100%;text-align: center">${code}.</p>

 

    <h2 style=" margin-bottom:30px; width: 100%; text-align: center ">For your information </h2>



    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center ">

            <p style=" margin-bottom: 30px; font-size: 1rem ">Email</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: center">

            <p style=" margin-bottom: 30px, font-size: 1rem ">${email}</p>

        </div>



    </div>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align:center; font-weight: 400 ">Happy trading !!</h2>


</div>`

}


module.exports.assetDebitTemplate = ({quantity,
    assetName,
    transactionType,
    currencyType,
    date,
    accountNumber,
    amountName,
    nameOfBank,
    country,
    state,
    bankAddress,
    amount,
    nameOfCurrency,
    medium,
    walletAddress}) => {
    if(medium === 'Bank'){
        return `
<div >
    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">----------------------</h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">capchain.cloud DEBIT </h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">-------------------------</h2>

    <p style=" margin-bottom: 40px; width: 100%;text-align: center;font-size:1rem">Your capchain account has  been debited  ${amount.toFixed(4)} of ${nameOfCurrency} </p>

    

    <h2 style=" margin-bottom:30px; width: 100%; text-align: center ">Recipient Information</h2>


    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Transaction Type</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${transactionType}</p>

        </div>



    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Currency Type</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${currencyType}</p>

        </div>

    </div>


    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Date</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${date}</p>

        </div>



    </div>



    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Account Number</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${accountNumber}</p>

        </div>

    </div>

     <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Name Of Account</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${amountName}</p>

        </div>

    </div>




    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Name Of Bank</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${nameOfBank}</p>

        </div>

    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Recipient's Country</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${country}</p>

        </div>

    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">State</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${state}</p>

        </div>

    </div>
    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Address Of Bank</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${bankAddress}</p>

        </div>

    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Amount</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${amount}</p>

        </div>

    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Name Of Currency</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${nameOfCurrency}</p>

        </div>

    </div>










    <h2 style=" margin-bottom: 30px; width: 100%; text-align:center; font-weight: 400 ">Happy trading !!</h2>


</div>`

    }
    return `
<div >
    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">----------------------</h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">capchain.cloud DEBIT </h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">-------------------------</h2>

    <p style=" margin-bottom: 40px; width: 100%;text-align: center;font-size:1rem">Your capchain account has  been debited  ${amount.toFixed(4)} of ${nameOfCurrency}  </p>

    

    <h2 style=" margin-bottom:30px; width: 100%; text-align: center ">Recipient Information</h2>


    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Transaction Type</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${transactionType}</p>

        </div>



    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Currency Type</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${currencyType}</p>

        </div>

    </div>


    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Date</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${date}</p>

        </div>



    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Wallet Address</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${walletAddress}</p>

        </div>



    </div>










    <h2 style=" margin-bottom: 30px; width: 100%; text-align:center; font-weight: 400 ">Happy trading !!</h2>


</div>`
    

}

module.exports.cashDebitTemplate = ({
    transactionType,
    currencyType,
    date,
    accountNumber,
    amountName,
    nameOfBank,
    country,
    state,
    bankAddress,
    amount,
    nameOfCurrency,}) => {
    return `
<div >
    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">----------------------</h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">capchain.cloud DEBIT </h2>

    <h2 style=" margin-bottom: 30px; width: 100%; text-align: center ">-------------------------</h2>

    <p style=" margin-bottom: 40px; width: 100%;text-align: center;font-size:1rem">Your capchain account has  been debited  $ ${amount}  </p>

    

    <h2 style=" margin-bottom:30px; width: 100%; text-align: center ">Recipient Information</h2>


    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Transaction Type</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${transactionType}</p>

        </div>



    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Currency Type</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${currencyType}</p>

        </div>

    </div>


    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Date</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${date}</p>

        </div>



    </div>



    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Account Number</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${accountNumber}</p>

        </div>

    </div>

     <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Name Of Account</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${amountName}</p>

        </div>

    </div>




    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Name Of Bank</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${nameOfBank}</p>

        </div>

    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Recipient's Country</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${country}</p>

        </div>

    </div>

    
    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Address Of Bank</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${bankAddress}</p>

        </div>

    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Amount</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${amount}</p>

        </div>

    </div>

    <div style=" margin-bottom: 30px; width: 100%; display: flex; flex-direction: row ">
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-start">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-start">Name Of Currency</p>

        </div>
        <div style=" width: 50%; display: flex; flex-direction: column; align-items: flex-end">

            <p style=" margin-bottom: 30px; font-size: 1rem ;width: 100%;display:flex; flex-direction: column; align-items: flex-end">${nameOfCurrency}</p>

        </div>

    </div>










    <h2 style=" margin-bottom: 30px; width: 100%; text-align:center; font-weight: 400 ">Happy trading !!</h2>


</div>`

}


module.exports.removeSpaces = (numStr)=>{
    let res = ''
    for(let char of numStr){
        if(char === ' ') continue
        res+=char
    }
    return res
}




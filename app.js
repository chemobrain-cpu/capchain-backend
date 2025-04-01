require('dotenv').config()
const express = require('express')
const cors = require("cors")
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const multer = require("multer")
const path = require("path")
const { body, validationResult } = require('express-validator')
const compression = require('compression')
const axios = require('axios')
const fetch = require('node-fetch')
const data = require('./data')
let request = require('request')

const app = express()
const corsOptions = {
  origin: '*', // You can restrict this to a specific domain like 'http://localhost:3000'
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'UPDATE','PUT'],
  allowedHeaders: ['Content-Type', 'Authorization', 'header'], // Add custom headers here
  preflightContinue: false,
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
}

app.use(cors(corsOptions))


app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(compression())

// Connect to MongoDB
mongoose.connect(process.env.DB_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB')
}).catch((error) => {
  console.error('MongoDB connection error:', error)
})

// Configure multer for file uploads
let dir = './public'
const multerStorage = multer.diskStorage({
  destination: dir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '_' + file.originalname)
  }
})

app.use(multer({ storage: multerStorage }).single('photo'))
app.use('/public', express.static(path.join(__dirname, 'public')))


// Importing routes
const AdminRoutes = require("./routes/admin").router
const UserRoutes = require("./routes/user").router

app.use(AdminRoutes)
app.use(UserRoutes)

// API for fetching all crypto currencies
app.get('/coins/:no/:pageNumber', async (req, res) => {
  try {
    let { no, pageNumber } = req.params
    let response = await axios.get(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${no || 6}&page=${pageNumber}&sparkline=false&price_change_percentage=24h`)

    if (response.status === 200) {
      return res.status(200).json({ response: response.data })
    } else {
      res.status(200).json({ response: data })
    }
  } catch (error) {
    res.status(200).json({ response: data.coins })
  }
})

// Fetch single cryptocurrency data
app.get('/singlecoin/:id', async (req, res) => {
  try {
    let { id } = req.params
    let response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`)
    if (response.status === 200) {
      res.status(200).json({ response: response.data })
    } else {
      res.status(300).json({ response: 'An error occurred' })
    }
  } catch (error) {
    console.log(error)
    res.status(500).json({ response: 'An error occurred' })
  }
})

// Fetch cryptocurrency details
app.get('/coin/:id', async (req, res) => {
  try {
    let { id } = req.params
    let response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id.toLowerCase()}?localization=false&tickers=true&market_data=true&community_data=false&developer_data=false&sparkline=false`)
    if (response.status === 200) {
      res.status(200).json({ response: response.data })
    } else {
      res.status(300).json({ response: 'An error occurred' })
    }
  } catch (error) {
    res.status(500).json({ response: 'An error occurred' })
  }
})

// Fetch crypto market chart data
app.get('/coinmarketchart/:id/:range', async (req, res) => {
  try {
    let { id, range } = req.params
    let response = await axios.get(`https://api.coingecko.com/api/v3/coins/${id.toLowerCase()}/market_chart?vs_currency=usd&days=${range}&interval=hourly`)
    if (response.status === 200) {
      res.status(200).json({ response: response.data })
    } else {
      res.status(300).json({ response: 'An error occurred' })
    }
  } catch (error) {
    res.status(500).json({ response: 'An error occurred' })
  }
})

// Test endpoint (SMS sending)
app.post('/send-sms', async (req, res) => {
  try {
    let { sms, phone,from } = req.body
    // Simulate sending SMS (example)
    
    sms = sms.trim().replace(/\n\s*\n/g, '\n');
  
  
    if (false) {
      var data = {
        "to":"+2347014991581",
        "from": "capchain",
        "sms": `you have been debited  $900 . Happy trading!`,
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
        res.status(200).json({ response: 'Success' })
    });



    } else {
      // Using Mailjet to send SMS
      const url = 'https://api.mailjet.com/v4/sms-send'
      const data = {
        Text: `${sms}`,
        To: `${phone}`,
        From: `${from}`
      }
      const con = { headers: { 'content-type': 'application/json', 'Authorization': `Bearer ${process.env.SMSTOKEN}` } }
      await axios.post(url, data, con)
    }
    res.status(200).json({ response: 'An error occurred' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ response: 'An error occurred' })
  }
})

// Error handling middleware
app.use((err, req, res, next) => {
  err.statusCode = 300 
  err.message = err.message || 'An error occurred on the server'
  res.status(err.statusCode).json({ response: err.message })
})

// Start server on port 9090
app.listen(process.env.PORT || 9092, () => {
  console.log("Server is listening on port 9090")
})

const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is running!',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0
  })
})

// Test the /api/ask endpoint
app.post('/api/ask', (req, res) => {
  console.log('Test /api/ask called with:', req.body)
  
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ 
      error: 'OpenAI API key not found',
      message: 'Please set OPENAI_API_KEY in your .env file'
    })
  }
  
  res.json({ 
    message: 'Test response - OpenAI key is configured',
    hasKey: true
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`)
  console.log(`🔑 OpenAI API Key configured: ${!!process.env.OPENAI_API_KEY}`)
  console.log(`📝 Test endpoint: http://localhost:${PORT}/test`)
})

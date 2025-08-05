const express = require('express')
const path = require('path')
const fs = require('fs')

const router = express.Router()

// POST /api/price/estimate → mock price estimation (no Python dependency)
router.post('/estimate', (req, res) => {
  const { location, area, bedrooms, bathrooms } = req.body

  console.log('📤 Incoming request:')
  console.log('  Location:', location)
  console.log('  Area:', area)
  console.log('  Bedrooms:', bedrooms)
  console.log('  Bathrooms:', bathrooms)

  // Simple mock price estimation algorithm
  let basePrice = 200000 // Base price
  
  // Location multiplier
  const locationMultipliers = {
    'New York, NY': 2.5,
    'Boston, MA': 2.2,
    'Los Angeles, CA': 2.0,
    'Chicago, IL': 1.8,
    'Miami, FL': 1.9,
    'Seattle, WA': 2.1,
    'Austin, TX': 1.7,
    'Denver, CO': 1.9
  }
  
  const locationMultiplier = locationMultipliers[location] || 1.5
  basePrice *= locationMultiplier
  
  // Area multiplier (price per sq ft)
  const pricePerSqFt = 150
  basePrice += area * pricePerSqFt
  
  // Bedroom bonus
  basePrice += bedrooms * 25000
  
  // Bathroom bonus
  basePrice += bathrooms * 15000
  
  // Add some randomness (±10%)
  const randomFactor = 0.9 + (Math.random() * 0.2)
  const finalPrice = Math.round(basePrice * randomFactor)
  
  console.log('📈 Estimated price:', finalPrice)
  
  res.json({ price: finalPrice })
})

// GET /api/price/locations → return unique locations
router.get('/locations', (req, res) => {
  try {
    const basicsPath = path.resolve(__dirname, '../data/property_basics.json')
    const raw = fs.readFileSync(basicsPath, 'utf-8')
    const data = JSON.parse(raw)

    const locations = data.map(item => item.location).filter(Boolean)
    const uniqueLocations = [...new Set(locations)].sort()

    res.json(uniqueLocations)
  } catch (err) {
    console.error('Error reading locations:', err)
    res.status(500).json({ error: 'Failed to fetch locations' })
  }
})

module.exports = router

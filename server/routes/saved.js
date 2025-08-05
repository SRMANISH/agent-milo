const express = require('express')
const router = express.Router()
const SavedProperty = require('../models/savedProperty')
const fs = require('fs')
const path = require('path')

const basics = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_basics.json')))
const features = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_characteristics.json')))
const images = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_images.json')))

// GET saved properties
router.get('/', async (req, res) => {
  try {
    const saved = await SavedProperty.find()
    res.json(saved)
  } catch (err) {
    console.error('GET /api/saved error:', err)
    res.status(500).json({ message: 'Server Error' })
  }
})

// POST save a property by ID
router.post('/', async (req, res) => {
  try {
    const id = parseInt(req.body.id)
    if (!id) return res.status(400).json({ message: 'id is required' })

    const existing = await SavedProperty.findOne({ id })
    if (existing) return res.status(200).json({ status: 'already saved' })

    const base = basics.find(p => p.id === id)
    const char = features.find(p => p.id === id)
    const img = images.find(p => p.id === id)

    if (!base || !char || !img) return res.status(404).json({ message: 'Property data incomplete' })

    const merged = {
      id: base.id,
      title: base.title,
      price: base.price,
      location: base.location,
      bedrooms: char.bedrooms,
      bathrooms: char.bathrooms,
      size_sqft: char.size_sqft,
      amenities: char.amenities,
      image_url: img.image_url || ""
    }

    const newProp = new SavedProperty(merged)
    await newProp.save()

    res.status(201).json({ status: 'saved' })
  } catch (err) {
    console.error("❌ POST /api/saved error:", err)
    res.status(500).json({ message: 'Server Error' })
  }
})

// DELETE a saved property by ID
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    await SavedProperty.deleteOne({ id })
    res.json({ status: 'deleted' })
  } catch (err) {
    console.error('DELETE /api/saved/:id error:', err)
    res.status(500).json({ message: 'Server Error' })
  }
})

module.exports = router

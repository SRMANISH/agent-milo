const SavedProperty = require('../models/savedProperty')
const { mergeProperties, filterProperties } = require('../utils/mergeAndFilter')

exports.searchProperties = (req, res) => {
  const filters = req.body
  const all = mergeProperties()
  const result = filterProperties(all, filters)
  res.status(200).json(result)
}

exports.saveProperty = async (req, res) => {
  try {
    const { id } = req.body
    if (!id) {
      return res.status(400).json({ message: 'id is required' })
    }

    const exists = await SavedProperty.findOne({ id })
    if (!exists) {
      await SavedProperty.create(req.body)
    }

    res.status(200).json({ message: 'Property saved' })
  } catch (error) {
    res.status(500).json({ message: 'Server Error' })
  }
}

exports.getSavedProperties = async (req, res) => {
  try {
    const saved = await SavedProperty.find()
    res.status(200).json(saved)
  } catch (error) {
    res.status(500).json({ message: 'Server Error' })
  }
}

exports.deleteSavedProperty = async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    await SavedProperty.deleteOne({ id })
    res.status(200).json({ message: 'Property deleted' })
  } catch (error) {
    res.status(500).json({ message: 'Server Error' })
  }
}

exports.getPropertyById = (req, res) => {
  try {
    const id = parseInt(req.params.id)
    const all = mergeProperties()
    const property = all.find(p => p.id === id)
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' })
    }
    
    res.status(200).json(property)
  } catch (error) {
    res.status(500).json({ message: 'Server Error' })
  }
}

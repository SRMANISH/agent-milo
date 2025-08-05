const express = require('express')
const router = express.Router()

const {
  searchProperties,
  saveProperty,
  getSavedProperties,
  deleteSavedProperty,
  getPropertyById
} = require('../controllers/propertyController')

router.post('/search', searchProperties)
router.post('/save', saveProperty)
router.get('/saved', getSavedProperties)
router.delete('/delete/:id', deleteSavedProperty)
router.get('/:id', getPropertyById)

module.exports = router

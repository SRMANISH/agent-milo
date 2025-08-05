const mongoose = require('mongoose')

const savedPropertySchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  title: String,
  price: Number,
  location: String,
  bedrooms: Number,
  bathrooms: Number,
  size_sqft: Number,
  amenities: [String],
  image_url: String
})

module.exports = mongoose.model('SavedProperty', savedPropertySchema)

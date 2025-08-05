const fs = require('fs')
const path = require('path')

const mergeProperties = () => {
  const basics = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_basics.json')))
  const characteristics = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_characteristics.json')))
  const images = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_images.json')))
  
  // Load descriptions if file exists
  let descriptions = []
  try {
    descriptions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_descriptions.json')))
  } catch (error) {
    // File doesn't exist yet, start with empty array
  }

  // Load nearby places if file exists
  let nearbyPlaces = []
  try {
    nearbyPlaces = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_nearby_places.json')))
  } catch (error) {
    // File doesn't exist yet, start with empty array
  }

  return basics.map(base => {
    const char = characteristics.find(c => c.id === base.id) || {}
    const img = images.find(i => i.id === base.id) || {}
    const desc = descriptions.find(d => d.id === base.id) || {}
    const nearby = nearbyPlaces.find(n => n.id === base.id) || {}
    return { ...base, ...char, image_url: img.image_url || "", description: desc.description || "", nearbyPlaces: nearby }
  })
}

const filterProperties = (all, filters) => {
  const { location, maxPrice, bedrooms } = filters
  const exact = all.filter(p =>
    (!location || p.location.toLowerCase().includes(location.toLowerCase())) &&
    (!maxPrice || p.price <= maxPrice) &&
    (!bedrooms || p.bedrooms === bedrooms)
  )
  if (exact.length) return exact

  const twoMatch = all.filter(p => {
    const loc = location ? p.location.toLowerCase().includes(location.toLowerCase()) : false
    const price = maxPrice ? p.price <= maxPrice : false
    const beds = bedrooms ? p.bedrooms === bedrooms : false
    return (loc && price) || (loc && beds) || (price && beds)
  })
  if (twoMatch.length) return twoMatch

  const oneMatch = all.filter(p => {
    const loc = location ? p.location.toLowerCase().includes(location.toLowerCase()) : false
    const price = maxPrice ? p.price <= maxPrice : false
    const beds = bedrooms ? p.bedrooms === bedrooms : false
    return loc || price || beds
  })
  if (oneMatch.length) return oneMatch

  return all
}

const savePropertyDescription = (id, description) => {
  try {
    let descriptions = []
    try {
      descriptions = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_descriptions.json')))
    } catch (error) {
      // File doesn't exist yet, start with empty array
    }
    
    // Remove existing description for this property if it exists
    descriptions = descriptions.filter(d => d.id !== id)
    
    // Add new description
    descriptions.push({ id, description })
    
    // Save back to file
    fs.writeFileSync(path.join(__dirname, '../data/property_descriptions.json'), JSON.stringify(descriptions, null, 2))
    
    return true
  } catch (error) {
    console.error('Error saving property description:', error)
    return false
  }
}

module.exports = { mergeProperties, filterProperties, savePropertyDescription }

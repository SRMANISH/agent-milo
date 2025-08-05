import React, { useEffect, useState } from 'react'
import axios from 'axios'


const PriceEstimator = () => {
  const [form, setForm] = useState({ location: '', area: '', bedrooms: '', bathrooms: '' })
  const [locations, setLocations] = useState([])
  const [price, setPrice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL


  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/price/locations`)
      .then(res => setLocations(res.data))
      .catch(err => console.error('Failed to fetch locations:', err))
  }, [])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const isFormValid = () => {
    const { location, area, bedrooms, bathrooms } = form
    return location && area && bedrooms && bathrooms
  }

  const handleSubmit = async () => {
    if (!isFormValid()) {
      setError('Please fill all fields.')
      return
    }

    setLoading(true)
    setError(null)
    setPrice(null)

    try {
      const res = await axios.post(`${BACKEND_URL}/api/price/estimate`, form)
      if (typeof res.data.price === 'number') {
        setPrice(res.data.price)
      } else {
        setError('No estimate returned. Try again.')
      }
    } catch (err) {
      console.error('Prediction failed:', err)
      setError('Prediction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">Price Estimator</h2>

      <div className="space-y-4 bg-white p-6 rounded-xl shadow">
        <select
          name="location"
          value={form.location}
          onChange={handleChange}
          className="w-full border border-gray-300 px-4 py-2 rounded"
        >
          <option value="">Select Location</option>
          {locations.map((loc, i) => (
            <option key={i} value={loc}>{loc}</option>
          ))}
        </select>

        <input
          name="area"
          placeholder="Area (sqft)"
          value={form.area}
          onChange={handleChange}
          type="number"
          className="w-full border border-gray-300 px-4 py-2 rounded"
        />

        <input
          name="bedrooms"
          placeholder="Bedrooms"
          value={form.bedrooms}
          onChange={handleChange}
          type="number"
          className="w-full border border-gray-300 px-4 py-2 rounded"
        />

        <input
          name="bathrooms"
          placeholder="Bathrooms"
          value={form.bathrooms}
          onChange={handleChange}
          type="number"
          className="w-full border border-gray-300 px-4 py-2 rounded"
        />

        <button
          onClick={handleSubmit}
          disabled={loading || !isFormValid()}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Estimating...' : 'Estimate Price'}
        </button>
      </div>

      {price !== null && !error && (
        <div className="mt-6 p-4 bg-green-100 text-green-800 text-center rounded-lg shadow text-xl font-semibold">
                          Estimated Price: $ {Math.round(price).toLocaleString()}
        </div>
      )}

      {error && (
        <div className="mt-6 p-4 bg-red-100 text-red-800 text-center rounded-lg shadow">
          {error}
        </div>
      )}
    </div>
  )
}

export default PriceEstimator

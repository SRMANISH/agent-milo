import React, { useEffect, useState } from 'react'
import axios from 'axios'
import globalState from '../../utils/globalState'
import { useNavigate } from 'react-router-dom'


const Saved = () => {
  const navigate = useNavigate()
  const [saved, setSaved] = useState([])
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL


  const fetchSaved = async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/saved`)
      setSaved(res.data || [])
    } catch (err) {
      console.error('Failed to fetch saved properties:', err)
    }
  }

  const handleUnsave = async (id) => {
    try {
      const res = await axios.delete(`${BACKEND_URL}/api/saved/${id}`)
      if (res.status === 200) {
        globalState.removeSavedProperty(id)
        setSaved(prev => prev.filter(p => p.id !== id))
      }
    } catch (err) {
      console.error('Error unsaving:', err)
    }
  }

  useEffect(() => {
    fetchSaved()
  }, [])

  return (
    <div className="p-6 min-h-screen bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Saved Properties</h1>

      {saved.length === 0 ? (
        <p>No saved properties found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {saved.map(p => (
            <div 
              key={p.id} 
              className="card bg-white shadow-lg rounded-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
              onClick={() => navigate(`/property/${p.id}`)}
            >
              <img
                src={p.image_url || "https://via.placeholder.com/400x250?text=No+Image"}
                alt={p.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-semibold">{p.title}</h2>
                <p className="text-sm text-gray-600">{p.location}</p>
                <p className="text-sm mt-1 text-gray-700">
                                          ${p.price.toLocaleString()} • {p.bedrooms} BHK • {p.bathrooms} Bath
                </p>
                <button
                  onClick={(e) => { e.stopPropagation(); handleUnsave(p.id); }}
                  className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded w-full"
                >
                  Saved ✓ (Click to Unsave)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Saved

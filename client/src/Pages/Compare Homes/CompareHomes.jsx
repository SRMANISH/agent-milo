import { Send, RefreshCcw, Star, X } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import globalState from '../../utils/globalState'
import { useNavigate } from 'react-router-dom'


const FindProperty = () => {
  console.log('CompareHomes component mounted');
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Welcome! I can help you find a property.' },
    { from: 'bot', text: 'What city are you looking in?' }
  ])
  const [step, setStep] = useState(0)
  const [input, setInput] = useState('')
  const [filters, setFilters] = useState({ location: '', bedrooms: '', budget: '' })
  const [results, setResults] = useState([])
  const [compare, setCompare] = useState([])
  const [saving, setSaving] = useState(null)
  const [savedIds, setSavedIds] = useState(globalState.getSavedIds())
  const [showModal, setShowModal] = useState(false)
  const messagesEndRef = useRef(null)
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getFallbackResults = async (partial) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/properties/search`, partial)
      return res.data
    } catch {
      return []
    }
  }

  const fetchSavedProperties = async () => {
    try {
      await globalState.syncWithServer(BACKEND_URL)
      setSavedIds(globalState.getSavedIds())
    } catch (error) {
      console.error('Error fetching saved properties:', error)
    }
  }

  const handleUserInput = async () => {
    if (!input.trim()) return

    setMessages(prev => [...prev, { from: 'user', text: input }])
    let newFilters = { ...filters }

    if (step === 0) {
      newFilters.location = input
      setMessages(prev => [...prev, { from: 'bot', text: 'How many bedrooms do you need?' }])
      setStep(1)
    } else if (step === 1) {
      newFilters.bedrooms = input
      setMessages(prev => [...prev, { from: 'bot', text: 'What is your budget?' }])
      setStep(2)
    } else if (step === 2) {
      newFilters.budget = input
      setMessages(prev => [...prev, { from: 'bot', text: 'Searching based on your filters...' }])

      try {
        let data = []
        let message = ''

        if (
          newFilters.location.toLowerCase() === 'all' ||
          newFilters.bedrooms.toLowerCase() === 'all' ||
          newFilters.budget.toLowerCase() === 'all'
        ) {
          data = await getFallbackResults({})
          message = `Showing all ${data.length} available properties.`
        } else {
          const res = await axios.post(`${BACKEND_URL}/api/properties/search`, newFilters)
          data = res.data

          if (data.length > 0) {
            message = `Found ${data.length} matching properties.`
          } else {
            const fallback =
              (await getFallbackResults({ location: newFilters.location })) ||
              (await getFallbackResults({ bedrooms: newFilters.bedrooms })) ||
              (await getFallbackResults({ budget: newFilters.budget })) ||
              []

            if (fallback.length > 0) {
              data = fallback
              message = `No exact match. Showing ${fallback.length} properties based on partial input.`
            } else {
              const all = await getFallbackResults({})
              data = all
              message = `No matches found. Showing all ${all.length} available properties.`
            }
          }
        }

        setResults(data)
        setMessages(prev => [...prev, { from: 'bot', text: message }])
        setStep(3)
      } catch {
        setMessages(prev => [...prev, { from: 'bot', text: 'Error fetching results.' }])
      }
    }

    setFilters(newFilters)
    setInput('')
  }

  const handleSave = async (property) => {
    const id = property.id
    setSaving(id)
    try {
      if (globalState.isPropertySaved(id)) {
        // Unsave
        await axios.delete(`${BACKEND_URL}/api/saved/${id}`)
        globalState.removeSavedProperty(id)
        setSavedIds(globalState.getSavedIds())
      } else {
        // Save
        await axios.post(`${BACKEND_URL}/api/saved`, { id })
        globalState.addSavedProperty(id)
        setSavedIds(globalState.getSavedIds())
      }
    } catch (error) {
      console.error('Error saving/unsaving property:', error)
    } finally {
      setTimeout(() => setSaving(null), 600)
    }
  }

  const handleCompareToggle = (property) => {
    setCompare(prev =>
      prev.some(p => p.id === property.id)
        ? prev.filter(p => p.id !== property.id)
        : [...prev, property]
    )
  }

  const handleCompareOpen = () => {
    const url = `${window.location.origin}/CompareHomes`
    window.open(url, '_blank')
  }

  const resetChat = () => {
    setMessages([
      { from: 'bot', text: 'Welcome! I can help you find a property.' },
      { from: 'bot', text: 'What city are you looking in?' }
    ])
    setStep(0)
    setFilters({ location: '', bedrooms: '', budget: '' })
    setResults([])
    setCompare([])
    setInput('')
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, results])

  useEffect(() => {
    localStorage.setItem('compareProperties', JSON.stringify(compare))
  }, [compare])

  useEffect(() => {
    // Subscribe to global state changes for saved properties only
    const unsubscribeSaved = globalState.subscribe('saved', (savedIds) => {
      setSavedIds(savedIds)
    })

    return () => {
      unsubscribeSaved()
    }
  }, [])

  useEffect(() => {
    fetchSavedProperties()
  }, [])



  return (
    <div className="p-4 md:p-6 flex flex-col items-center gap-6 min-h-screen">
      <h1 className="text-3xl font-bold">Find Your Dream Property</h1>

      <div className="w-full max-w-2xl bg-base-100 shadow-xl rounded-lg flex flex-col h-[70vh] overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-lg ${msg.from === 'user' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-black'} animate-fade-in`}>
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-3 flex gap-2">
          <input
            className="flex-grow input input-bordered"
            placeholder="Type your answer..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUserInput()}
          />
          <button onClick={handleUserInput} className="btn bg-blue-600 text-white hover:bg-blue-700">
            <Send size={18} />
          </button>
          <button onClick={resetChat} className="btn btn-neutral">
            <RefreshCcw size={18} />
          </button>
        </div>
      </div>



      {results.length > 0 && (
        <div className="w-full max-w-4xl relative">
          <h2 className="text-xl font-semibold mb-4">Matching Properties</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map(p => (
              <div 
                key={p.id} 
                className="card bg-base-100 shadow-md animate-fade-in cursor-pointer hover:shadow-lg"
                onClick={() => navigate(`/property/${p.id}`)}
              >
                <figure><img src={p.image_url} alt={p.title} className="w-full h-52 object-cover" /></figure>
                <div className="card-body">
                  <h2 className="card-title">{p.title}</h2>
                  <p>{p.location}</p>
                  <p>${p.price.toLocaleString()}</p>
                  <p>{p.bedrooms} BHK | {p.bathrooms} Bath | {p.size_sqft} sqft</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={compare.some(c => c.id === p.id)}
                      onChange={() => handleCompareToggle(p)}
                    />
                    <span className="text-sm">Compare</span>
                    <button
                      className={`btn btn-sm ml-auto ${saving === p.id ? 'btn-success animate-bounce' : globalState.isPropertySaved(p.id) ? 'btn-success' : 'btn-outline'}`}
                      onClick={() => handleSave(p)}
                    >
                      <Star size={16} />
                      {saving === p.id ? 'Saved' : globalState.isPropertySaved(p.id) ? 'Unsave' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {compare.length >= 2 ? (
            <div className="fixed bottom-6 right-6 z-50">
              <button
                className="btn btn-accent shadow-lg"
                onClick={() => {
                  console.log('Compare button clicked');
                  setShowModal(true);
                }}
                disabled={compare.length < 2}
                style={{ pointerEvents: compare.length < 2 ? 'none' : 'auto', opacity: compare.length < 2 ? 0.5 : 1 }}
              >
                Compare {compare.length}
              </button>
            </div>
          ) : null}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
          <div className="relative bg-white max-h-[90vh] overflow-y-auto w-full max-w-4xl p-6 rounded-lg">
            <button className="sticky top-2 right-2 float-right btn btn-sm btn-circle btn-error z-10" onClick={() => setShowModal(false)}>
              <X />
            </button>
            <h2 className="text-xl font-bold mb-4 clear-both">Compare Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {compare.map(p => (
                <div key={p.id} className="card bg-base-100 shadow-md">
                  <figure><img src={p.image_url} alt={p.title} className="w-full h-40 object-cover" /></figure>
                  <div className="card-body text-sm">
                    <h3 className="card-title text-base">{p.title}</h3>
                    <p>{p.location}</p>
                    <p>${p.price.toLocaleString()}</p>
                    <p>{p.bedrooms} BHK | {p.bathrooms} Bath | {p.size_sqft} sqft</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FindProperty

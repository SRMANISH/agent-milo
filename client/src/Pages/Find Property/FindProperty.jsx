import { Send, RefreshCcw, Star, X, MapPin, Home, Bath, Square } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import globalState from '../../utils/globalState'
import { useNavigate } from 'react-router-dom'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const FindProperty = () => {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { from: 'bot', text: 'Welcome to our exclusive property collection. How may I assist you in finding your dream home?' }
  ])
  const [step, setStep] = useState(0)
  const [input, setInput] = useState('')
  const [filters, setFilters] = useState({ location: '', bedrooms: '', budget: '' })
  const [compare, setCompare] = useState(() => {
    const saved = localStorage.getItem('compareProperties')
    return saved ? JSON.parse(saved) : []
  })
  const [saving, setSaving] = useState(null)
  const [savedIds, setSavedIds] = useState(globalState.getSavedIds())
  const [showModal, setShowModal] = useState(false)
  const [categorizedResults, setCategorizedResults] = useState({})
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  const getAllResults = async () => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/properties/search`, {})
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

  const callOpenAI = async (userInput) => {
    try {
      const res = await axios.post(`${BACKEND_URL}/api/ask`, {
        prompt: userInput.toLowerCase(),
        history: messages.slice(-10)
      })
      return res.data
    } catch {
      return { message: 'I apologize, but I could not process your request at this moment.', filters: {} }
    }
  }

  const handleUserInput = async () => {
    if (!input.trim()) return

    const normalized = input.trim().toLowerCase()
    if (normalized === 'all' || normalized === 'all properties') {
      setLoading(true)
      const all = await getAllResults()
      setCategorizedResults({ all })
      setMessages(prev => [...prev, { from: 'user', text: input }])
      setStep(3)
      setInput('')
      setLoading(false)
      return
    }

    setMessages(prev => [...prev, { from: 'user', text: input }])

    const aiResponse = await callOpenAI(input)
    const filtersFromAI = aiResponse.filters || {}
    const aiMessage = aiResponse.message || ''

    if (aiMessage) {
      setMessages(prev => [...prev, { from: 'bot', text: aiMessage }])
    }

    if (Object.keys(filtersFromAI).length > 0 && Object.values(filtersFromAI).some(Boolean)) {
      const combinedFilters = {
        location: filtersFromAI.location || filters.location,
        bedrooms: filtersFromAI.bedrooms || filters.bedrooms,
        budget: filtersFromAI.budget || filters.budget
      }

      setFilters(combinedFilters)
      setLoading(true)
      await categorizeAndDisplay(combinedFilters)
      setStep(3)
      setInput('')
      setLoading(false)
      return
    }

    const manualExtract = {
      location: input.match(/\b(?:in|at)\s+([a-z\s]+?)(?:\s|$)/i)?.[1]
        ?.replace(/\b(for|with|under|less than|budget|below)\b.*/i, '')
        ?.trim(),
      bedrooms: input.match(/(\d+)[- ]?bed/i)?.[1]?.trim(),
      budget: input.match(/(?:under|less than|below)\s?(\d+)/i)?.[1]?.trim()
    }

    if (Object.values(manualExtract).some(Boolean)) {
      const fallbackFilters = {
        location: manualExtract.location || filters.location,
        bedrooms: manualExtract.bedrooms || filters.bedrooms,
        budget: manualExtract.budget || filters.budget
      }

      setFilters(fallbackFilters)
      setLoading(true)
      await categorizeAndDisplay(fallbackFilters)
      setStep(3)
      setInput('')
      setLoading(false)
      return
    }

    let newFilters = { ...filters }

    if (step === 0) {
      newFilters.location = input
      setStep(1)
    } else if (step === 1) {
      newFilters.bedrooms = input
      setStep(2)
    } else if (step === 2) {
      newFilters.budget = input
      setLoading(true)
      await categorizeAndDisplay(newFilters)
      setStep(3)
      setLoading(false)
    }

    setFilters(newFilters)
    setInput('')
  }

  const parseFilterList = (value) => {
    if (!value) return [];
    return value.split(/[;,]/).map(v => v.trim()).filter(Boolean);
  };

  const categorizeAndDisplay = async ({ location, bedrooms, budget }) => {
    const all = await getAllResults();

    const locList = parseFilterList(location?.toLowerCase());
    const bedList = parseFilterList(bedrooms);
    const budList = parseFilterList(budget);

    const cat1 = all.filter(p =>
      locList.length && bedList.length &&
      locList.some(loc => p.location.toLowerCase().includes(loc)) &&
      bedList.some(bed => parseInt(p.bedrooms) === parseInt(bed))
    );

    const cat2 = all.filter(p =>
      locList.length && locList.some(loc => p.location.toLowerCase().includes(loc))
    );

    const cat3 = all.filter(p =>
      bedList.length && bedList.some(bed => parseInt(p.bedrooms) === parseInt(bed))
    );

    const cat4 = all.filter(p =>
      budList.length && budList.some(bud => parseInt(p.price) <= parseInt(bud))
    );

    const allEmpty = cat1.length + cat2.length + cat3.length + cat4.length === 0;

    if (allEmpty) {
      const all = await getAllResults();
      setCategorizedResults({ all });
    } else {
      setCategorizedResults({
        'Location & Bedrooms': cat1,
        'Location Only': cat2,
        'Bedrooms Only': cat3,
        'Within Budget': cat4
      });
    }
  };

  const handleSave = async (property) => {
    const id = property.id
    setSaving(id)
    try {
      if (globalState.isPropertySaved(id)) {
        await axios.delete(`${BACKEND_URL}/api/saved/${id}`)
        globalState.removeSavedProperty(id)
        setSavedIds(globalState.getSavedIds())
      } else {
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

  const resetChat = () => {
    setMessages([
      { from: 'bot', text: 'Welcome to our exclusive property collection. How may I assist you in finding your dream home?' }
    ])
    setStep(0)
    setFilters({ location: '', bedrooms: '', budget: '' })
    setCategorizedResults({})
    setCompare([])
    setInput('')
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, categorizedResults])

  useEffect(() => {
    localStorage.setItem('compareProperties', JSON.stringify(compare))
  }, [compare])

  useEffect(() => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-light text-slate-800 mb-4 tracking-wide">
            Discover Your Dream Home
          </h1>
          <p className="text-xl text-slate-600 font-light max-w-2xl mx-auto">
            Explore our curated collection of exceptional properties, tailored to your lifestyle and aspirations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6">
                <h2 className="text-2xl font-light text-white mb-2">Property Assistant</h2>
                <p className="text-slate-300 text-sm">Let me help you find the perfect property</p>
              </div>
              
              <div className="h-[600px] flex flex-col">
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-3 rounded-2xl ${
                        msg.from === 'user' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg' 
                          : 'bg-slate-100 text-slate-800 shadow-sm'
                      }`}>
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 text-slate-800 px-4 py-3 rounded-2xl shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                <div className="border-t border-slate-200 p-4 bg-slate-50">
                  <div className="flex gap-3">
                    <input
                      className="flex-1 px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="Describe your dream property..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUserInput()}
                    />
                    <button 
                      onClick={handleUserInput} 
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={resetChat} 
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 text-sm"
                    >
                      <RefreshCcw size={16} className="inline mr-1" />
                      Reset
                    </button>
                    <button
                      className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors duration-200 text-sm"
                      onClick={async () => {
                        setLoading(true)
                        const all = await getAllResults()
                        setCategorizedResults({ all })
                        setStep(3)
                        setMessages(prev => [...prev, { from: 'bot', text: `Presenting our complete collection of ${all.length} exceptional properties.` }])
                        setLoading(false)
                      }}
                    >
                      View All Properties
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {Object.keys(categorizedResults).length > 0 && (
              <div className="space-y-8">
                {Object.entries(categorizedResults).map(([label, list]) => (
                  <div key={label} className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
                      <h2 className="text-2xl font-light text-slate-800">
                        {label === 'all' ? 'Complete Collection' : label}
                      </h2>
                      <p className="text-slate-600 mt-1">{list.length} exceptional properties</p>
                    </div>
                    
                    <div className="p-8">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {list.map(p => (
                          <div 
                            key={p.id} 
                            className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                            onClick={() => navigate(`/property/${p.id}`)}
                          >
                            <div className="relative overflow-hidden">
                              <img 
                                src={p.image_url} 
                                alt={p.title} 
                                className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <div className="absolute top-4 right-4">
                                <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                                  <span className="text-slate-800 font-semibold">${p.price.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="p-6">
                              <h3 className="text-xl font-light text-slate-800 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                                {p.title}
                              </h3>
                              <div className="flex items-center text-slate-600 mb-4">
                                <MapPin size={16} className="mr-1" />
                                <span className="text-sm">{p.location}</span>
                              </div>
                              
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-4 text-slate-600">
                                  <div className="flex items-center">
                                    <Home size={16} className="mr-1" />
                                    <span className="text-sm">{p.bedrooms} BR</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Bath size={16} className="mr-1" />
                                    <span className="text-sm">{p.bathrooms} BA</span>
                                  </div>
                                  <div className="flex items-center">
                                    <Square size={16} className="mr-1" />
                                    <span className="text-sm">{p.size_sqft} sqft</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                <div className="flex items-center">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500" 
                                    checked={compare.some(c => c.id === p.id)} 
                                    onClick={e => e.stopPropagation()} 
                                    onChange={() => handleCompareToggle(p)} 
                                  />
                                  <span className="ml-2 text-sm text-slate-600">Compare</span>
                                </div>
                                <button
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    saving === p.id 
                                      ? 'bg-green-500 text-white animate-pulse' 
                                      : globalState.isPropertySaved(p.id)
                                      ? 'bg-green-600 text-white hover:bg-green-700' 
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                  onClick={e => { e.stopPropagation(); handleSave(p); }}
                                >
                                  <Star size={14} className="inline mr-1" />
                                  {saving === p.id ? 'Saved' : globalState.isPropertySaved(p.id) ? 'Saved' : 'Save'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {compare.length >= 2 && (
        <div className="fixed bottom-8 right-8 z-50">
          <button 
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
            onClick={() => setShowModal(true)}
          >
            Compare {compare.length} Properties
          </button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 flex justify-between items-center">
              <h2 className="text-2xl font-light text-white">Property Comparison</h2>
              <button 
                className="text-white hover:text-slate-300 transition-colors duration-200" 
                onClick={() => setShowModal(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {compare.map(p => (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg">
                    <div className="relative">
                      <img 
                        src={p.image_url} 
                        alt={p.title} 
                        className="w-full h-48 object-cover" 
                      />
                      <div className="absolute top-3 right-3">
                        <div className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                          <span className="text-slate-800 font-semibold">${p.price.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-light text-slate-800 mb-2">{p.title}</h3>
                      <div className="flex items-center text-slate-600 mb-3">
                        <MapPin size={14} className="mr-1" />
                        <span className="text-sm">{p.location}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-slate-600 text-sm">
                        <span>{p.bedrooms} BR</span>
                        <span>{p.bathrooms} BA</span>
                        <span>{p.size_sqft} sqft</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FindProperty

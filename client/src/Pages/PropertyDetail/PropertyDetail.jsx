import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Send, Star, MapPin, Home, School, Hospital, Building2, Calculator, ArrowLeft, RefreshCw, Train, Plane, TreePine } from 'lucide-react'
import axios from 'axios'
import globalState from '../../utils/globalState'

const PropertyDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
  
  const [property, setProperty] = useState(null)
  const [aiDescription, setAiDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [chatMessages, setChatMessages] = useState([
    { from: 'bot', text: 'Hi there! 👋 I can help you with any questions about this property.' }
  ])
  const [chatInput, setChatInput] = useState('')
  const [nearbyPlaces, setNearbyPlaces] = useState({
    schools: [],
    hospitals: [],
    banks: [],
    restaurants: [],
    transportation: [],
    parks: []
  })
  const [paymentDetails, setPaymentDetails] = useState({
    downPayment: 20,
    loanTerm: 30,
    interestRate: 6.5
  })
  const [relatedProperties, setRelatedProperties] = useState([])
  const [suggestedProperties, setSuggestedProperties] = useState([])
  const [saving, setSaving] = useState(false)
  const [descriptionLoading, setDescriptionLoading] = useState(false)

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0)
    
    // Reset chat when property ID changes
    setChatMessages([
      { from: 'bot', text: 'Hi there! 👋 I can help you with any questions about this property.' }
    ])
    setSuggestedProperties([])
    
    fetchPropertyDetails()
    
    // Subscribe to global state changes
    const unsubscribeSaved = globalState.subscribe('saved', () => {
      // Update saved state when it changes
    })

    return () => {
      unsubscribeSaved()
    }
  }, [id])

  useEffect(() => {
    if (property) {
      // Scroll to top when property changes
      window.scrollTo(0, 0)
      fetchAiDescription()
      fetchRelatedProperties()
      fetchNearbyPlaces()
    }
  }, [property])

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching property with ID:', id)
      const response = await axios.get(`${BACKEND_URL}/api/properties/${id}`)
      console.log('Property data received:', response.data)
      setProperty(response.data)
    } catch (error) {
      console.error('Error fetching property details:', error)
      setError('Failed to load property details')
    } finally {
      setLoading(false)
    }
  }

  const fetchAiDescription = async () => {
    if (!property) return
    
    // If property already has a description, use it
    if (property.description) {
      setAiDescription(property.description)
      return
    }
    
    // Otherwise, generate and save a new description
    setDescriptionLoading(true)
    try {
      const response = await axios.post(`${BACKEND_URL}/api/ask/generate-and-save-description`, {
        property: property
      })
      setAiDescription(response.data.description)
    } catch (error) {
      console.error('Error generating description:', error)
      setAiDescription('This beautiful property offers modern amenities and comfortable living spaces. Located in a desirable neighborhood, it features updated finishes and plenty of natural light throughout.')
    } finally {
      setDescriptionLoading(false)
    }
  }

  const fetchNearbyPlaces = async () => {
    try {
      console.log('fetchNearbyPlaces called with property:', property)
      // Use stored nearby places data from property
      if (property && property.nearbyPlaces) {
        console.log('Using stored nearby places:', property.nearbyPlaces)
        setNearbyPlaces(property.nearbyPlaces)
      } else {
        // Generate location-specific data based on property location
        const locationData = generateLocationSpecificData(property?.location || '')
        console.log('Generated location data:', locationData)
        setNearbyPlaces(locationData)
      }
    } catch (error) {
      console.error('Error in fetchNearbyPlaces:', error)
      // Set default data if there's an error
      setNearbyPlaces({
        schools: [],
        hospitals: [],
        banks: [],
        restaurants: [],
        transportation: [],
        parks: []
      })
    }
  }

  const generateLocationSpecificData = (location) => {
    const locationLower = location.toLowerCase()
    
    // Location-specific data mapping
    const locationData = {
      'new york': {
        schools: [
          { name: 'PS 321 William Penn', distance: '0.3mi', rating: '9/10', type: 'Public Elementary' },
          { name: 'Brooklyn Technical High School', distance: '0.8mi', rating: '8/10', type: 'Public High' },
          { name: 'St. Ann\'s School', distance: '1.2mi', rating: '9/10', type: 'Private K-12' }
        ],
        hospitals: [
          { name: 'NYU Langone Medical Center', distance: '1.5mi', type: 'Academic Medical Center', emergency: true },
          { name: 'Mount Sinai Hospital', distance: '2.1mi', type: 'General Hospital', emergency: true },
          { name: 'Bellevue Hospital Center', distance: '2.8mi', type: 'Public Hospital', emergency: true }
        ],
        banks: [
          { name: 'Chase Bank', distance: '0.4mi', type: 'Full Service Bank', atm: true },
          { name: 'Bank of America', distance: '0.7mi', type: 'Full Service Bank', atm: true },
          { name: 'Citibank', distance: '1.1mi', type: 'Full Service Bank', atm: true }
        ],
        restaurants: [
          { name: 'Grimaldi\'s Pizzeria', distance: '0.2mi', type: 'Pizzeria', cuisine: 'Italian' },
          { name: 'Peter Luger Steak House', distance: '0.6mi', type: 'Steakhouse', cuisine: 'American' },
          { name: 'Katz\'s Delicatessen', distance: '1.3mi', type: 'Deli', cuisine: 'Jewish' }
        ],
                              transportation: [
                        { name: 'JFK International Airport', distance: '12.5mi', type: 'International Airport', drive_time: '25 min' },
                        { name: 'LaGuardia Airport', distance: '8.2mi', type: 'Domestic Airport', drive_time: '20 min' },
                        { name: 'Grand Central Terminal', distance: '3.1mi', type: 'Train Station', drive_time: '8 min' }
                      ],
                      parks: [
                        { name: 'Central Park', distance: '1.2mi', type: 'Urban Park', features: 'Walking trails, lakes, playgrounds' },
                        { name: 'Brooklyn Bridge Park', distance: '0.8mi', type: 'Waterfront Park', features: 'Piers, gardens, sports courts' },
                        { name: 'Prospect Park', distance: '2.1mi', type: 'Recreation Park', features: 'Botanical gardens, zoo, sports fields' }
                      ]
      },
      'miami': {
        schools: [
          { name: 'Royal Green Elementary School', distance: '0.4mi', rating: '8/10', type: 'Public Elementary' },
          { name: 'Howard D. Mcmillan Middle School', distance: '0.4mi', rating: '5/10', type: 'Public Middle' },
          { name: 'G. Holmes Braddock Senior High School', distance: '1.8mi', rating: '5/10', type: 'Public High' }
        ],
        hospitals: [
          { name: 'Kendall Regional Medical Center', distance: '2.1mi', type: 'General Hospital', emergency: true },
          { name: 'Baptist Hospital of Miami', distance: '3.5mi', type: 'General Hospital', emergency: true },
          { name: 'Jackson Memorial Hospital', distance: '4.2mi', type: 'Academic Medical Center', emergency: true }
        ],
        banks: [
          { name: 'Bank of America', distance: '0.8mi', type: 'Full Service Bank', atm: true },
          { name: 'Wells Fargo', distance: '1.2mi', type: 'Full Service Bank', atm: true },
          { name: 'Chase Bank', distance: '1.5mi', type: 'Full Service Bank', atm: true }
        ],
        restaurants: [
          { name: 'Versailles Restaurant', distance: '0.3mi', type: 'Cuban Restaurant', cuisine: 'Cuban' },
          { name: 'Joe\'s Stone Crab', distance: '0.8mi', type: 'Seafood Restaurant', cuisine: 'Seafood' },
          { name: 'La Carreta', distance: '1.2mi', type: 'Cuban Restaurant', cuisine: 'Cuban' }
        ],
        transportation: [
          { name: 'Miami International Airport', distance: '8.2mi', type: 'International Airport', drive_time: '15 min' },
          { name: 'Dadeland South Metrorail Station', distance: '2.3mi', type: 'Metro Rail', drive_time: '5 min' },
          { name: 'South Miami Metrorail Station', distance: '3.1mi', type: 'Metro Rail', drive_time: '7 min' }
        ],
        parks: [
          { name: 'Bayfront Park', distance: '0.6mi', type: 'Waterfront Park', features: 'Marina, amphitheater, gardens' },
          { name: 'Vizcaya Museum & Gardens', distance: '2.3mi', type: 'Historic Park', features: 'Italian gardens, museum, bay views' },
          { name: 'Crandon Park', distance: '8.1mi', type: 'Beach Park', features: 'Beach access, tennis courts, nature trails' }
        ]
      },
      'chicago': {
        schools: [
          { name: 'Lincoln Elementary School', distance: '0.5mi', rating: '9/10', type: 'Public Elementary' },
          { name: 'Whitney M. Young Magnet High School', distance: '1.2mi', rating: '8/10', type: 'Public High' },
          { name: 'University of Chicago Lab Schools', distance: '2.1mi', rating: '10/10', type: 'Private K-12' }
        ],
        hospitals: [
          { name: 'Northwestern Memorial Hospital', distance: '1.8mi', type: 'Academic Medical Center', emergency: true },
          { name: 'Rush University Medical Center', distance: '2.5mi', type: 'Academic Medical Center', emergency: true },
          { name: 'University of Chicago Medical Center', distance: '3.2mi', type: 'Academic Medical Center', emergency: true }
        ],
        banks: [
          { name: 'Chase Bank', distance: '0.6mi', type: 'Full Service Bank', atm: true },
          { name: 'Bank of America', distance: '0.9mi', type: 'Full Service Bank', atm: true },
          { name: 'Wells Fargo', distance: '1.4mi', type: 'Full Service Bank', atm: true }
        ],
        restaurants: [
          { name: 'Giordano\'s', distance: '0.4mi', type: 'Pizzeria', cuisine: 'Italian' },
          { name: 'Portillo\'s', distance: '0.8mi', type: 'Fast Casual', cuisine: 'American' },
          { name: 'Alinea', distance: '1.5mi', type: 'Fine Dining', cuisine: 'Contemporary' }
        ],
        transportation: [
          { name: 'O\'Hare International Airport', distance: '15.2mi', type: 'International Airport', drive_time: '30 min' },
          { name: 'Midway International Airport', distance: '8.5mi', type: 'Domestic Airport', drive_time: '18 min' },
          { name: 'Union Station', distance: '2.1mi', type: 'Train Station', drive_time: '6 min' }
        ],
        parks: [
          { name: 'Millennium Park', distance: '1.2mi', type: 'Urban Park', features: 'Cloud Gate, gardens, ice rink' },
          { name: 'Grant Park', distance: '1.8mi', type: 'Urban Park', features: 'Buckingham Fountain, museums, gardens' },
          { name: 'Lincoln Park', distance: '2.5mi', type: 'Urban Park', features: 'Zoo, conservatory, beaches' }
        ]
      },
      'dallas': {
        schools: [
          { name: 'Highland Park Elementary School', distance: '0.7mi', rating: '9/10', type: 'Public Elementary' },
          { name: 'Highland Park High School', distance: '1.1mi', rating: '8/10', type: 'Public High' },
          { name: 'St. Mark\'s School of Texas', distance: '1.8mi', rating: '10/10', type: 'Private K-12' }
        ],
        hospitals: [
          { name: 'UT Southwestern Medical Center', distance: '2.3mi', type: 'Academic Medical Center', emergency: true },
          { name: 'Baylor University Medical Center', distance: '3.1mi', type: 'General Hospital', emergency: true },
          { name: 'Texas Health Presbyterian Hospital', distance: '3.8mi', type: 'General Hospital', emergency: true }
        ],
        banks: [
          { name: 'Bank of America', distance: '0.5mi', type: 'Full Service Bank', atm: true },
          { name: 'Chase Bank', distance: '0.9mi', type: 'Full Service Bank', atm: true },
          { name: 'Wells Fargo', distance: '1.3mi', type: 'Full Service Bank', atm: true }
        ],
        restaurants: [
          { name: 'Pecan Lodge', distance: '0.6mi', type: 'BBQ Restaurant', cuisine: 'Texas BBQ' },
          { name: 'Uchi Dallas', distance: '1.2mi', type: 'Fine Dining', cuisine: 'Japanese' },
          { name: 'El Fenix', distance: '1.8mi', type: 'Mexican Restaurant', cuisine: 'Mexican' }
        ],
        transportation: [
          { name: 'Dallas/Fort Worth International Airport', distance: '18.5mi', type: 'International Airport', drive_time: '35 min' },
          { name: 'Dallas Love Field Airport', distance: '6.2mi', type: 'Domestic Airport', drive_time: '12 min' },
          { name: 'Dallas Union Station', distance: '2.8mi', type: 'Train Station', drive_time: '7 min' }
        ],
        parks: [
          { name: 'Klyde Warren Park', distance: '0.8mi', type: 'Urban Park', features: 'Food trucks, playground, dog park' },
          { name: 'White Rock Lake Park', distance: '3.2mi', type: 'Lake Park', features: 'Boating, hiking trails, picnic areas' },
          { name: 'Dallas Arboretum', distance: '4.1mi', type: 'Botanical Garden', features: 'Gardens, events, children\'s area' }
        ]
      },
      'los angeles': {
        schools: [
          { name: 'Beverly Hills High School', distance: '0.9mi', rating: '8/10', type: 'Public High' },
          { name: 'Harvard-Westlake School', distance: '1.5mi', rating: '10/10', type: 'Private K-12' },
          { name: 'Brentwood School', distance: '2.1mi', rating: '9/10', type: 'Private K-12' }
        ],
        hospitals: [
          { name: 'Cedars-Sinai Medical Center', distance: '1.8mi', type: 'Academic Medical Center', emergency: true },
          { name: 'UCLA Medical Center', distance: '3.2mi', type: 'Academic Medical Center', emergency: true },
          { name: 'Providence Saint John\'s Health Center', distance: '4.1mi', type: 'General Hospital', emergency: true }
        ],
        banks: [
          { name: 'Chase Bank', distance: '0.4mi', type: 'Full Service Bank', atm: true },
          { name: 'Bank of America', distance: '0.8mi', type: 'Full Service Bank', atm: true },
          { name: 'Wells Fargo', distance: '1.2mi', type: 'Full Service Bank', atm: true }
        ],
        restaurants: [
          { name: 'Nobu Los Angeles', distance: '0.6mi', type: 'Fine Dining', cuisine: 'Japanese' },
          { name: 'In-N-Out Burger', distance: '1.1mi', type: 'Fast Food', cuisine: 'American' },
          { name: 'Pink\'s Hot Dogs', distance: '1.8mi', type: 'Fast Food', cuisine: 'American' }
        ],
        transportation: [
          { name: 'Los Angeles International Airport', distance: '12.8mi', type: 'International Airport', drive_time: '25 min' },
          { name: 'Burbank Airport', distance: '8.5mi', type: 'Domestic Airport', drive_time: '18 min' },
          { name: 'Union Station', distance: '4.2mi', type: 'Train Station', drive_time: '10 min' }
        ],
        parks: [
          { name: 'Griffith Park', distance: '3.2mi', type: 'Urban Park', features: 'Observatory, hiking trails, zoo' },
          { name: 'Runyon Canyon Park', distance: '1.8mi', type: 'Hiking Park', features: 'Hiking trails, dog park, city views' },
          { name: 'Venice Beach Boardwalk', distance: '5.1mi', type: 'Beach Park', features: 'Beach access, street performers, shops' }
        ]
      }
    }

    // Find matching location or use default
    for (const [city, data] of Object.entries(locationData)) {
      if (locationLower.includes(city)) {
        return data
      }
    }

    // Default data for unknown locations
    return {
      schools: [
        { name: 'Local Elementary School', distance: '0.5mi', rating: '7/10', type: 'Public Elementary' },
        { name: 'Community Middle School', distance: '0.8mi', rating: '6/10', type: 'Public Middle' },
        { name: 'Regional High School', distance: '1.2mi', rating: '7/10', type: 'Public High' }
      ],
      hospitals: [
        { name: 'Regional Medical Center', distance: '2.0mi', type: 'General Hospital', emergency: true },
        { name: 'Community Hospital', distance: '3.5mi', type: 'General Hospital', emergency: true },
        { name: 'City Health Center', distance: '4.2mi', type: 'Urgent Care', emergency: false }
      ],
      banks: [
        { name: 'Local Bank Branch', distance: '0.7mi', type: 'Full Service Bank', atm: true },
        { name: 'Community Credit Union', distance: '1.1mi', type: 'Credit Union', atm: true },
        { name: 'National Bank', distance: '1.6mi', type: 'Full Service Bank', atm: true }
      ],
      restaurants: [
        { name: 'Local Diner', distance: '0.4mi', type: 'Casual Dining', cuisine: 'American' },
        { name: 'Family Restaurant', distance: '0.9mi', type: 'Casual Dining', cuisine: 'International' },
        { name: 'Pizza Place', distance: '1.3mi', type: 'Casual Dining', cuisine: 'Italian' }
      ],
      transportation: [
        { name: 'Nearest Airport', distance: '10.0mi', type: 'Airport', drive_time: '20 min' },
        { name: 'Local Train Station', distance: '2.5mi', type: 'Train Station', drive_time: '6 min' },
        { name: 'Bus Terminal', distance: '1.8mi', type: 'Bus Station', drive_time: '4 min' }
      ],
      parks: [
        { name: 'Community Park', distance: '0.8mi', type: 'Local Park', features: 'Playground, picnic areas, walking trails' },
        { name: 'City Recreation Center', distance: '1.5mi', type: 'Recreation Park', features: 'Sports courts, pool, fitness center' },
        { name: 'Nature Preserve', distance: '2.2mi', type: 'Natural Park', features: 'Hiking trails, wildlife viewing, nature center' }
      ]
    }
  }

  const fetchRelatedProperties = async () => {
    if (!property) return
    
    try {
      // Get all properties and filter out the current one
      const response = await axios.post(`${BACKEND_URL}/api/properties/search`, {})
      
      // Filter out the current property
      const allOtherProps = response.data.filter(p => p.id !== parseInt(id))
      
      // Prioritize properties in the same location
      const currentLocation = property.location || ''
      const sameLocationProps = allOtherProps
        .filter(p => p.location && p.location.toLowerCase().includes(currentLocation.toLowerCase()))
        .slice(0, 6)
      
      const otherProps = allOtherProps
        .filter(p => !p.location || !p.location.toLowerCase().includes(currentLocation.toLowerCase()))
        .slice(0, 9 - sameLocationProps.length)
      
      setRelatedProperties([...sameLocationProps, ...otherProps])
    } catch {
      console.error('Error fetching related properties')
    }
  }

  const handleSave = async () => {
    if (!property) return
    
    setSaving(true)
    try {
      if (globalState.isPropertySaved(property.id)) {
        await axios.delete(`${BACKEND_URL}/api/saved/${property.id}`)
        globalState.removeSavedProperty(property.id)
      } else {
        await axios.post(`${BACKEND_URL}/api/saved`, { id: property.id })
        globalState.addSavedProperty(property.id)
      }
    } catch (error) {
      console.error('Error saving/unsaving property:', error)
    } finally {
      setSaving(false)
    }
  }

  const callOpenAI = async (userInput) => {
    try {
      console.log('🤖 Calling OpenAI API from PropertyDetail...')
      console.log('📝 Request data:', {
        prompt: userInput.toLowerCase(),
        historyLength: chatMessages.slice(-5).length,
        hasPropertyContext: !!property
      })
      
      const response = await axios.post(`${BACKEND_URL}/api/ask`, {
        prompt: userInput.toLowerCase(),
        history: chatMessages.slice(-5),
        propertyContext: property
      })
      
      console.log('✅ OpenAI API response received:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ OpenAI API error:', error)
      console.error('❌ Error response:', error.response?.data)
      console.error('❌ Error status:', error.response?.status)
      console.error('❌ Error message:', error.message)
      
      // Show more specific error messages
      let errorMessage = 'I apologize, but I could not process your request at this moment. Please try again.'
      
      if (error.response?.status === 500) {
        errorMessage = 'Server error occurred. Please try again in a moment.'
      } else if (error.response?.status === 429) {
        errorMessage = 'Rate limit reached. Please wait a moment and try again.'
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your connection and try again.'
      }
      
      return { 
        message: errorMessage, 
        suggestedProperties: [] 
      }
    }
  }

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return

    const userMessage = { from: 'user', text: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput('')

    const aiResponse = await callOpenAI(chatInput)
    const aiMessage = aiResponse.message || ''
    const suggestedProps = aiResponse.suggestedProperties || []

    if (aiMessage) {
      const botMessage = { from: 'bot', text: aiMessage }
      setChatMessages(prev => [...prev, botMessage])
    }
    
    // Handle suggested properties
    console.log('Chat response:', aiResponse)
    if (suggestedProps.length > 0) {
      console.log('Setting suggested properties:', suggestedProps)
      setSuggestedProperties(suggestedProps)
    } else {
      console.log('No suggested properties, clearing array')
      setSuggestedProperties([])
    }
  }

  const calculateMonthlyPayment = () => {
    if (!property) return 0
    
    const principal = property.price * (1 - paymentDetails.downPayment / 100)
    const monthlyRate = paymentDetails.interestRate / 100 / 12
    const numberOfPayments = paymentDetails.loanTerm * 12
    
    if (monthlyRate === 0) return principal / numberOfPayments
    
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
           (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Property</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-4">The property you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const monthlyPayment = calculateMonthlyPayment()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Search
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
              <p className="text-lg text-gray-600 mt-2">{property.location}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center px-6 py-3 rounded-lg font-semibold transition-all ${
                saving 
                  ? 'bg-green-500 text-white animate-pulse' 
                  : globalState.isPropertySaved(property.id)
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star size={20} className="mr-2" />
              {saving ? 'Saving...' : globalState.isPropertySaved(property.id) ? 'Saved' : 'Save Property'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Section - Image and Property Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Image and Property Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <img 
                src={property.image_url} 
                alt={property.title}
                className="w-full h-96 object-cover"
              />
            </div>

            {/* Property Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Property Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">${property.price.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Price</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{property.bedrooms}</div>
                  <div className="text-sm text-gray-600">Bedrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{property.bathrooms}</div>
                  <div className="text-sm text-gray-600">Bathrooms</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{property.size_sqft}</div>
                  <div className="text-sm text-gray-600">Sq Ft</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Calculator */}
          <div>
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Calculator size={24} className="mr-2" />
                Payment Calculator
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Down Payment: {paymentDetails.downPayment}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    value={paymentDetails.downPayment}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, downPayment: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Loan Term: {paymentDetails.loanTerm} years
                  </label>
                  <select
                    value={paymentDetails.loanTerm}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, loanTerm: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={15}>15 years</option>
                    <option value={20}>20 years</option>
                    <option value={30}>30 years</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Interest Rate: {paymentDetails.interestRate}%
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={paymentDetails.interestRate}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, interestRate: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="border-t pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      ${monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-sm text-gray-600">Monthly Payment</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Based on {paymentDetails.downPayment}% down payment
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* About This Home Section */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Home</h2>
          {descriptionLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Generating description...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-gray-700 leading-relaxed text-lg">
                {aiDescription || 'Loading description...'}
              </p>
              
              {/* Additional Property Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Property Highlights</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {property.bedrooms} spacious bedrooms with ample natural light
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {property.bathrooms} modern bathrooms with premium fixtures
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {property.size_sqft} sq ft of thoughtfully designed living space
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Prime location in {property.location}
                    </li>
                    {property.amenities && property.amenities.length > 0 && (
                      <li className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                        Premium amenities: {property.amenities.slice(0, 3).join(', ')}
                        {property.amenities.length > 3 && ` +${property.amenities.length - 3} more`}
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Investment Benefits</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Excellent rental potential in this desirable area
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Strong appreciation potential in this growing market
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Competitive price point for the area
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Low maintenance costs with modern construction
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                      Perfect for both investment and personal use
                    </li>
                  </ul>
                </div>
              </div>

              {/* Amenities Section */}
              {property.amenities && property.amenities.length > 0 && (
                <div className="bg-purple-50 p-6 rounded-lg mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Exclusive Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center">
                        <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                        <span className="text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat Section */}
        <div className="mb-8">
          {/* Chatbot */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Ask About This Property</h2>
              <button
                onClick={() => {
                  setChatMessages([{ from: 'bot', text: 'Hi there! 👋 I can help you with any questions about this property.' }])
                  setSuggestedProperties([])
                }}
                className="flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <RefreshCw size={16} className="mr-1" />
                Reset Chat
              </button>
            </div>
            <div className="border rounded-lg p-4 h-96 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.from === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                  placeholder="Ask about this property..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleChatSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>

            {/* Suggested Properties from Chat */}
            {suggestedProperties.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Other Properties You Might Like</h3>
                <div className="space-y-4">
                  {suggestedProperties.map((prop) => (
                    <div 
                      key={prop.id} 
                      className="bg-white rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-300 group"
                      onClick={() => navigate(`/property/${prop.id}`)}
                    >
                      <div className="flex">
                        <div className="relative w-32 h-24 flex-shrink-0">
                          {prop.image_url ? (
                            <img 
                              src={prop.image_url} 
                              alt={prop.title}
                              className="w-full h-full object-cover rounded-l-xl"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center rounded-l-xl" style={{ display: prop.image_url ? 'none' : 'flex' }}>
                            <div className="text-center">
                              <div className="text-3xl">🏠</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 text-base line-clamp-1 group-hover:text-blue-600 transition-colors">{prop.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{prop.location}</p>
                              <p className="text-sm text-gray-500 mt-1">{prop.bedrooms} bd • {prop.bathrooms} ba • {prop.size_sqft} sqft</p>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-bold text-blue-600 text-lg">${prop.price.toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Nearby Places Section */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl shadow-xl border border-blue-100 p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Around This Home</h2>
            <p className="text-gray-600">Discover what's nearby in this vibrant neighborhood</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Schools */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <School size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Schools</h3>
              </div>
              <div className="space-y-3">
                {(nearbyPlaces.schools || []).map((school, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-900 text-sm">{school.name}</div>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        {school.rating}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{school.type}</div>
                    <div className="flex items-center text-xs text-blue-600 font-medium">
                      <MapPin size={12} className="mr-1" />
                      {school.distance}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hospitals */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <Hospital size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Hospitals</h3>
              </div>
              <div className="space-y-3">
                {(nearbyPlaces.hospitals || []).map((hospital, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-900 text-sm">{hospital.name}</div>
                      {hospital.emergency && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          ER
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{hospital.type}</div>
                    <div className="flex items-center text-xs text-blue-600 font-medium">
                      <MapPin size={12} className="mr-1" />
                      {hospital.distance}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banks */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <Building2 size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Banks</h3>
              </div>
              <div className="space-y-3">
                {(nearbyPlaces.banks || []).map((bank, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-900 text-sm">{bank.name}</div>
                      {bank.atm && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                          ATM
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{bank.type}</div>
                    <div className="flex items-center text-xs text-blue-600 font-medium">
                      <MapPin size={12} className="mr-1" />
                      {bank.distance}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Restaurants */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <Building2 size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Restaurants</h3>
              </div>
              <div className="space-y-3">
                {(nearbyPlaces.restaurants || []).map((restaurant, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-900 text-sm">{restaurant.name}</div>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        {restaurant.cuisine}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{restaurant.type}</div>
                    <div className="flex items-center text-xs text-blue-600 font-medium">
                      <MapPin size={12} className="mr-1" />
                      {restaurant.distance}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transportation */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <Train size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Transportation</h3>
              </div>
              <div className="space-y-3">
                {(nearbyPlaces.transportation || []).map((transport, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-900 text-sm">{transport.name}</div>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        {transport.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{transport.drive_time}</div>
                    <div className="flex items-center text-xs text-blue-600 font-medium">
                      <MapPin size={12} className="mr-1" />
                      {transport.distance}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parks & Entertainment */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-blue-100 p-3 rounded-full mr-3">
                  <TreePine size={24} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Parks & Entertainment</h3>
              </div>
              <div className="space-y-3">
                {(nearbyPlaces.parks || []).map((park, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100 hover:border-blue-200 transition-all duration-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-semibold text-gray-900 text-sm">{park.name}</div>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        {park.type}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 mb-1">{park.features}</div>
                    <div className="flex items-center text-xs text-blue-600 font-medium">
                      <MapPin size={12} className="mr-1" />
                      {park.distance}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Check Our Other Properties */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Check Our Other Properties</h2>
          {relatedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProperties.map((prop) => (
                <div 
                  key={prop.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-300 rounded-lg overflow-hidden border hover:border-blue-300 group"
                  onClick={() => navigate(`/property/${prop.id}`)}
                >
                  <div className="relative">
                    {prop.image_url ? (
                      <img 
                        src={prop.image_url} 
                        alt={prop.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'block'
                        }}
                      />
                    ) : null}
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center" style={{ display: prop.image_url ? 'none' : 'flex' }}>
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏠</div>
                        <p className="text-gray-600 text-sm">Image not available</p>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <div className="bg-white px-2 py-1 rounded text-sm font-semibold text-gray-800">
                        ${prop.price.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{prop.title}</h3>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <Home size={16} className="mr-1" />
                      {prop.bedrooms} bd • {prop.bathrooms} ba • {prop.size_sqft} sqft
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin size={16} className="mr-1" />
                      {prop.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">🏠</div>
              <p className="text-gray-600">No other properties available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PropertyDetail 
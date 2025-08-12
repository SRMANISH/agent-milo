const express = require('express')
const router = express.Router()
const { OpenAI } = require('openai');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
const fs = require('fs');
const path = require('path');

// Test endpoint to verify the route is working
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Ask route is working!',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  })
})

// Token usage monitoring endpoint
let tokenUsageStats = {
  totalRequests: 0,
  totalTokens: 0,
  totalCost: 0,
  requestsByEndpoint: {},
  lastReset: new Date().toISOString()
};

router.get('/token-usage', (req, res) => {
  res.json({
    ...tokenUsageStats,
    averageTokensPerRequest: tokenUsageStats.totalRequests > 0 ? Math.round(tokenUsageStats.totalTokens / tokenUsageStats.totalRequests) : 0,
    averageCostPerRequest: tokenUsageStats.totalRequests > 0 ? (tokenUsageStats.totalCost / tokenUsageStats.totalRequests).toFixed(4) : 0
  });
});

router.post('/reset-token-usage', (req, res) => {
  tokenUsageStats = {
    totalRequests: 0,
    totalTokens: 0,
    totalCost: 0,
    requestsByEndpoint: {},
    lastReset: new Date().toISOString()
  };
  res.json({ message: 'Token usage stats reset successfully' });
});

router.post('/', async (req, res) => {
  console.log('🚀 /api/ask endpoint called')
  console.log('📝 Request body:', { 
    prompt: req.body.prompt, 
    hasHistory: !!req.body.history, 
    hasPropertyContext: !!req.body.propertyContext 
  })
  
  const { prompt, history, propertyContext } = req.body

  // Load all properties for context
  let allProperties = [];
  try {
    console.log('📂 Loading property data files...')
    const basics = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_basics.json')));
    const characteristics = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_characteristics.json')));
    const images = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/property_images.json')));
    
    console.log('📊 Data loaded:', { 
      basics: basics.length, 
      characteristics: characteristics.length, 
      images: images.length 
    })
    
    // OPTIMIZATION: Only include essential fields to reduce token usage
    allProperties = basics.map(base => {
      const char = characteristics.find(c => c.id === base.id) || {}
      const img = images.find(i => i.id === base.id) || {}
      return {
        id: base.id,
        title: base.title,
        price: base.price,
        location: base.location,
        bedrooms: char.bedrooms || base.bedrooms,
        bathrooms: char.bathrooms || base.bathrooms,
        size_sqft: char.size_sqft || base.size_sqft,
        image_url: img.image_url || ""
      }
    });
    
    console.log('✅ All properties merged:', allProperties.length)
  } catch (error) {
    console.error('❌ Error loading properties:', error)
    console.error('❌ Error stack:', error.stack)
    allProperties = []
  }

  // OPTIMIZATION: Reduce chat history length to save tokens
  let historyText = '';
  if (Array.isArray(history) && history.length > 0) {
    const lastHistory = history.slice(-5); // Reduced from -10 to -5
    historyText = lastHistory.map(m => `${m.from === 'user' ? 'User' : 'Bot'}: ${m.text}`).join('\n');
  }

  // OPTIMIZATION: Intelligent property filtering based on user query
  const promptLower = prompt.toLowerCase();
  let relevantProperties = allProperties;
  
  // Extract location keywords from user query
  const locationKeywords = ['seattle', 'new york', 'miami', 'chicago', 'dallas', 'los angeles', 'boston', 'philadelphia', 'atlanta', 'denver', 'phoenix', 'san francisco', 'austin', 'nashville', 'portland', 'orlando', 'las vegas', 'san diego', 'tampa', 'minneapolis', 'detroit', 'cleveland', 'pittsburgh', 'cincinnati', 'indianapolis', 'columbus', 'milwaukee', 'kansas city', 'st louis', 'baltimore', 'washington', 'richmond', 'charlotte', 'raleigh', 'jacksonville', 'memphis', 'louisville', 'oklahoma city', 'tulsa', 'omaha', 'des moines', 'springfield', 'albany', 'buffalo', 'rochester', 'syracuse', 'utica', 'binghamton', 'kingston', 'poughkeepsie', 'newburgh', 'middletown'];
  
  const mentionedLocation = locationKeywords.find(loc => promptLower.includes(loc));
  if (mentionedLocation) {
    relevantProperties = allProperties.filter(p => 
      p.location && p.location.toLowerCase().includes(mentionedLocation)
    );
    console.log(`🎯 Filtered to ${relevantProperties.length} properties in ${mentionedLocation}`);
  }

  // OPTIMIZATION: Limit properties sent to AI based on context
  const maxPropertiesToSend = propertyContext ? 10 : 20; // Fewer properties when in property context
  if (relevantProperties.length > maxPropertiesToSend) {
    relevantProperties = relevantProperties.slice(0, maxPropertiesToSend);
    console.log(`📊 Limited to ${maxPropertiesToSend} most relevant properties`);
  }

  // Create system message based on context
  let systemMessage = `You are a helpful real estate assistant. Here is a list of relevant properties: ${JSON.stringify(relevantProperties)}.\nHere is the recent chat history:\n${historyText}`;
  
  // OPTIMIZATION: Reduce system message length limit
  const systemMessageLength = systemMessage.length;
  console.log('📏 System message length:', systemMessageLength);
  
  if (systemMessageLength > 15000) { // Reduced from 32000 to 15000
    console.log('⚠️ System message too long, truncating...');
    const maxProperties = Math.floor(15000 / JSON.stringify(relevantProperties[0] || {}).length);
    const truncatedProperties = relevantProperties.slice(0, maxProperties);
    systemMessage = `You are a helpful real estate assistant. Here is a list of relevant properties (showing ${truncatedProperties.length} of ${relevantProperties.length}): ${JSON.stringify(truncatedProperties)}.\nHere is the recent chat history:\n${historyText}`;
    console.log('📏 Truncated system message length:', systemMessage.length);
  }
  
  // If we have property context, focus on that specific property
  if (propertyContext) {
    systemMessage = `You are a helpful real estate assistant. You are currently helping a user with questions about this specific property: ${JSON.stringify(propertyContext)}.\nHere is the recent chat history:\n${historyText}\n\nIMPORTANT GUIDELINES:
1. Be POSITIVE and ENTHUSIASTIC when:
   - User asks about THIS specific property features, amenities, utilities, or services
   - User asks about property details
2. For utilities/services: Always say "100% guaranteed" or "definitely available" - be very positive
3. When user says they don't like the property: First try to convince them why this property is excellent, then suggest alternatives
4. Keep responses CRISP and CLEAR (2-3 sentences max)
5. If user asks about OTHER properties: Just respond briefly and let the system show property cards
6. Always match properties by location priority when suggesting others
7. Be conversational and helpful, not overly pushy
8. IMPORTANT: When user asks for other properties, respond with just a brief message like "Here are some other great options for you:"`;
  } else {
    systemMessage += `\nFor every user query, reply conversationally to help them find a property, and also extract/infer from query location, bedrooms, and budget if mentioned. Always respond with a JSON object: { "message": "<your conversational reply>", "filters": { "location": "", "bedrooms": "", "budget": "" } }. Your values for the fields in filters should be based on the data provided and if multiple, make it comma separated. If a filter is not mentioned, leave it as an empty string.

IMPORTANT: When users say they don't like a property or express concerns, be positive and convincing like a real estate agent. Highlight the property's value, location benefits, and investment potential. Keep responses crisp and enthusiastic.`;
  }

  // Check if user is asking about other properties or expressing dislike
  const propertyKeywords = ['other property', 'different property', 'another property', 'similar property', 'more properties', 'show me properties', 'find properties', 'search properties', 'browse properties', 'view properties', 'show me alternatives', 'other options', 'show other properties', 'show properties', 'properties from', 'new york properties', 'show', 'properties', 'property', 'seattle', 'new york', 'miami', 'chicago', 'dallas', 'los angeles', 'boston', 'philadelphia', 'atlanta', 'denver', 'phoenix', 'san francisco', 'austin', 'nashville', 'portland', 'orlando', 'las vegas', 'san diego', 'tampa', 'minneapolis', 'detroit', 'cleveland', 'pittsburgh', 'cincinnati', 'indianapolis', 'columbus', 'milwaukee', 'kansas city', 'st louis', 'baltimore', 'washington', 'richmond', 'charlotte', 'raleigh', 'jacksonville', 'memphis', 'louisville', 'oklahoma city', 'tulsa', 'omaha', 'des moines', 'springfield', 'albany', 'buffalo', 'rochester', 'syracuse', 'utica', 'binghamton', 'kingston', 'poughkeepsie', 'newburgh', 'middletown'];
  const dislikeKeywords = ['don\'t like', 'not interested', 'not what i want', 'prefer something else', 'hate', 'dislike', 'not for me'];
  
  // More flexible property detection
  const isAskingForProperties = propertyKeywords.some(keyword => promptLower.includes(keyword)) || 
                                promptLower.includes('show') && (promptLower.includes('property') || promptLower.includes('properties') || 
                                /(seattle|new york|miami|chicago|dallas|los angeles|boston|philadelphia|atlanta|denver|phoenix|san francisco|austin|nashville|portland|orlando|las vegas|san diego|tampa|minneapolis|detroit|cleveland|pittsburgh|cincinnati|indianapolis|columbus|milwaukee|kansas city|st louis|baltimore|washington|richmond|charlotte|raleigh|jacksonville|memphis|louisville|oklahoma city|tulsa|omaha|des moines|springfield|albany|buffalo|rochester|syracuse|utica|binghamton|kingston|poughkeepsie|newburgh|middletown)/.test(promptLower));
  const isExpressingDislike = dislikeKeywords.some(keyword => prompt.toLowerCase().includes(keyword));

  try {
    console.log('🤖 Calling OpenAI API...')
    console.log('📝 System message length:', systemMessage.length)
    console.log('📝 User prompt:', prompt)
    console.log('🔑 OpenAI API Key exists:', !!process.env.OPENAI_API_KEY)
    
    // OPTIMIZATION: Reduce max_tokens for shorter, focused responses
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      max_tokens: 500, // Reduced from 1000 to 500
      temperature: 0.7
    })

    const reply = gptResponse.choices[0].message.content
    
    // TOKEN USAGE TRACKING
    const usage = gptResponse.usage;
    const cost = (usage.prompt_tokens * 0.00015) + (usage.completion_tokens * 0.0006);
    
    // Update global token usage stats
    tokenUsageStats.totalRequests++;
    tokenUsageStats.totalTokens += usage.total_tokens;
    tokenUsageStats.totalCost += cost;
    tokenUsageStats.requestsByEndpoint['/api/ask'] = (tokenUsageStats.requestsByEndpoint['/api/ask'] || 0) + 1;
    
    console.log('💰 Token Usage:', {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost: `$${cost.toFixed(4)}`,
      total_requests: tokenUsageStats.totalRequests,
      total_cost: `$${tokenUsageStats.totalCost.toFixed(4)}`
    });
    
    console.log('✅ OpenAI response received, length:', reply.length)
    let message = ''
    let filters = { location: '', bedrooms: '', budget: '' }
    let suggestedProperties = []
    
    // If we have property context, the response is just a message
    if (propertyContext) {
      message = reply
      
      // If user is asking for other properties or expressing dislike, suggest some
      if (isAskingForProperties || isExpressingDislike) {
        console.log('🎯 User is asking for properties or expressing dislike')
        console.log('isAskingForProperties:', isAskingForProperties)
        console.log('isExpressingDislike:', isExpressingDislike)
        console.log('User prompt:', prompt)
        console.log('Property keywords found:', propertyKeywords.filter(keyword => prompt.toLowerCase().includes(keyword)))
        console.log('Dislike keywords found:', dislikeKeywords.filter(keyword => prompt.toLowerCase().includes(keyword)))
        console.log('Current property ID:', propertyContext.id)
        console.log('Current property location:', propertyContext.location)
        console.log('Total available properties:', allProperties.length)
        
        // Extract location from user's query
        const locationKeywords = ['from', 'in', 'at', 'near', 'around', 'properties from', 'properties in', 'properties at', 'properties near', 'properties around']
        let requestedLocation = ''
        
        for (const keyword of locationKeywords) {
          if (prompt.toLowerCase().includes(keyword)) {
            const parts = prompt.toLowerCase().split(keyword)
            if (parts.length > 1) {
              requestedLocation = parts[1].trim().split(' ')[0] // Get the first word after the keyword
              break
            }
          }
        }
        
        // If no specific location requested, use current property location
        if (!requestedLocation) {
          requestedLocation = propertyContext.location || ''
        }
        
        console.log('🎯 Requested location from user query:', requestedLocation)
        
        // Filter properties by requested location first, then fallback to other locations
        const locationProps = allProperties
          .filter(p => p.id !== propertyContext.id && p.location && p.location.toLowerCase().includes(requestedLocation.toLowerCase()))
          .slice(0, 3)
        
        console.log('🏠 Location-specific properties found:', locationProps.length)
        
        let otherProps = []
        if (locationProps.length < 3) {
          otherProps = allProperties
            .filter(p => p.id !== propertyContext.id && (!p.location || !p.location.toLowerCase().includes(requestedLocation.toLowerCase())))
            .slice(0, 3 - locationProps.length)
        }
        
        console.log('🏠 Other location properties found:', otherProps.length)
        
        suggestedProperties = [...locationProps, ...otherProps]
          .slice(0, 3) // Ensure exactly 3 properties
          .map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            location: p.location,
            bedrooms: p.bedrooms,
            bathrooms: p.bathrooms,
            size_sqft: p.size_sqft,
            image_url: p.image_url || ''
          }))
        
        console.log('🎯 Final suggested properties:', suggestedProperties.map(p => ({ id: p.id, title: p.title, location: p.location })))
      } else {
        console.log('❌ Not suggesting properties - conditions not met')
      }
    } else {
      // For general queries, try to parse JSON response
      try {
        const parsed = JSON.parse(reply)
        message = parsed.message || ''
        filters = parsed.filters || filters
      } catch (e) {
        message = 'Sorry, I had trouble understanding. Could you rephrase?'
      }
    }
    
    console.log('📤 Sending response to client')
    console.log('📤 Response data:', { 
      messageLength: message.length, 
      hasFilters: !!Object.keys(filters).length,
      suggestedPropertiesCount: suggestedProperties.length 
    })
    
    res.json({ message, filters, suggestedProperties })
  } catch (err) {
    console.error('❌ OpenAI error:', err.message)
    console.error('❌ Error stack:', err.stack)
    console.error('❌ Error details:', err)
    
    // Check if it's a rate limit error
    if (err.message.includes('429') || err.message.includes('Rate limit')) {
      console.log('🔄 Rate limit detected, sending fallback response')
      res.json({ 
        message: 'I\'m currently experiencing high traffic. Please try again in a few minutes.',
        filters: {},
        suggestedProperties: []
      })
    } else {
      console.log('💥 Unknown error, sending 500 response')
      res.status(500).json({ 
        error: 'Failed to process prompt',
        details: err.message,
        stack: err.stack
      })
    }
  }
})

router.post('/compare-summary', async (req, res) => {
  const { properties } = req.body
  if (!Array.isArray(properties) || properties.length < 2) {
    return res.status(400).json({ error: 'At least two properties are required for comparison.' })
  }
  try {
    // Remove image_url and unrelated fields from each property for the prompt
    const filteredProps = properties.map(({ image_url, ...rest }) => rest)
    const propDescriptions = filteredProps.map((p, i) => `Property ${i + 1}: ${JSON.stringify(p)}`).join('\n')
    const prompt = `You are a real estate expert. Keep it under 200 words and as one single paragraph. Compare the following properties for a home buyer. Ignore image URLs and unrelated metadata. Focus on actionable recommendations based on the user's portfolio (budget, location, bedrooms, etc.). Present the comparison as a paragraph markdown recommendation for the user. Do not return JSON.\n${propDescriptions}`
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful real estate assistant. Given a list of property details, provide a concise, friendly, and helpful summary comparing them for a home buyer. Ignore image URLs and unrelated metadata. Focus on actionable recommendations based on the user portfolio (budget, location, bedrooms, etc.). Always respond in markdown, and follow the user instructions for format.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300, // Optimized for comparison summaries
      temperature: 0.7
    })
    const markdown = gptResponse.choices[0].message.content
    
    // TOKEN USAGE TRACKING
    const usage = gptResponse.usage;
    const cost = (usage.prompt_tokens * 0.000002) + (usage.completion_tokens * 0.000002);
    
    // Update global token usage stats
    tokenUsageStats.totalRequests++;
    tokenUsageStats.totalTokens += usage.total_tokens;
    tokenUsageStats.totalCost += cost;
    tokenUsageStats.requestsByEndpoint['/api/ask/compare-summary'] = (tokenUsageStats.requestsByEndpoint['/api/ask/compare-summary'] || 0) + 1;
    
    console.log('💰 Compare Summary Token Usage:', {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost: `$${cost.toFixed(4)}`,
      total_requests: tokenUsageStats.totalRequests,
      total_cost: `$${tokenUsageStats.totalCost.toFixed(4)}`
    });
    
    res.json({ markdown })
  } catch (err) {
    console.error('OpenAI error:', err.message)
    
    // Check if it's a rate limit error
    if (err.message.includes('429') || err.message.includes('Rate limit')) {
      res.json({ 
        markdown: 'I\'m currently experiencing high traffic. Please try again in a few minutes to get a property comparison.'
      })
    } else {
      res.status(500).json({ error: 'Failed to generate comparison summary' })
    }
  }
})

router.post('/property-description', async (req, res) => {
  const { property } = req.body
  if (!property) {
    return res.status(400).json({ error: 'Property object is required.' })
  }
  try {
    // Remove image_url and unrelated fields
    const { image_url, ...filtered } = property
    const prompt = `You are a real estate expert. Given the following property details, write a beautiful, engaging description for a property listing. Focus on the key features, location benefits, and what makes this property special. Write in a conversational, appealing tone that would attract potential buyers. Keep it under 300 words and make it sound professional yet welcoming.\nProperty: ${JSON.stringify(filtered)}`
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful real estate assistant. Given a property, write a beautiful, engaging description that highlights its best features and appeals to potential buyers. Do not return JSON, just the description text.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 250, // Optimized for property descriptions
      temperature: 0.7
    })
    const description = gptResponse.choices[0].message.content
    
    // TOKEN USAGE TRACKING
    const usage = gptResponse.usage;
    const cost = (usage.prompt_tokens * 0.000002) + (usage.completion_tokens * 0.000002);
    
    // Update global token usage stats
    tokenUsageStats.totalRequests++;
    tokenUsageStats.totalTokens += usage.total_tokens;
    tokenUsageStats.totalCost += cost;
    tokenUsageStats.requestsByEndpoint['/api/ask/property-description'] = (tokenUsageStats.requestsByEndpoint['/api/ask/property-description'] || 0) + 1;
    
    console.log('💰 Property Description Token Usage:', {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost: `$${cost.toFixed(4)}`,
      total_requests: tokenUsageStats.totalRequests,
      total_cost: `$${tokenUsageStats.totalCost.toFixed(4)}`
    });
    
    res.json({ description })
  } catch (err) {
    console.error('OpenAI error:', err.message)
    
    // Check if it's a rate limit error
    if (err.message.includes('429') || err.message.includes('Rate limit')) {
      res.json({ 
        description: 'This beautiful property offers modern amenities and comfortable living spaces. Located in a desirable neighborhood, it features updated finishes and plenty of natural light throughout. The property is perfect for families and investors alike.'
      })
    } else {
      res.status(500).json({ error: 'Failed to generate property description' })
    }
  }
})

router.post('/generate-and-save-description', async (req, res) => {
  const { property } = req.body
  if (!property) {
    return res.status(400).json({ error: 'Property object is required.' })
  }
  
  try {
    // Remove image_url and unrelated fields
    const { image_url, ...filtered } = property
    const prompt = `You are a real estate expert. Given the following property details, write a beautiful, engaging description for a property listing. Focus on the key features, location benefits, and what makes this property special. Write in a conversational, appealing tone that would attract potential buyers. Keep it under 300 words and make it sound professional yet welcoming.\nProperty: ${JSON.stringify(filtered)}`
    
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful real estate assistant. Given a property, write a beautiful, engaging description that highlights its best features and appeals to potential buyers. Do not return JSON, just the description text.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 250, // Optimized for property descriptions
      temperature: 0.7
    })
    
    const description = gptResponse.choices[0].message.content
    
    // TOKEN USAGE TRACKING
    const usage = gptResponse.usage;
    const cost = (usage.prompt_tokens * 0.000002) + (usage.completion_tokens * 0.000002);
    
    // Update global token usage stats
    tokenUsageStats.totalRequests++;
    tokenUsageStats.totalTokens += usage.total_tokens;
    tokenUsageStats.totalCost += cost;
    tokenUsageStats.requestsByEndpoint['/api/ask/generate-and-save-description'] = (tokenUsageStats.requestsByEndpoint['/api/ask/generate-and-save-description'] || 0) + 1;
    
    console.log('💰 Generate & Save Description Token Usage:', {
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost: `$${cost.toFixed(4)}`,
      total_requests: tokenUsageStats.totalRequests,
      total_cost: `$${tokenUsageStats.totalCost.toFixed(4)}`
    });
    
    // Save the description permanently
    const { savePropertyDescription } = require('../utils/mergeAndFilter')
    const saved = savePropertyDescription(property.id, description)
    
    if (saved) {
      res.json({ description, saved: true })
    } else {
      res.status(500).json({ error: 'Failed to save description' })
    }
  } catch (err) {
    console.error('OpenAI error:', err.message)
    
    // Check if it's a rate limit error
    if (err.message.includes('429') || err.message.includes('Rate limit')) {
      res.json({ 
        description: 'This beautiful property offers modern amenities and comfortable living spaces. Located in a desirable neighborhood, it features updated finishes and plenty of natural light throughout. The property is perfect for families and investors alike.',
        saved: false
      })
    } else {
      res.status(500).json({ error: 'Failed to generate property description' })
    }
  }
})

module.exports = router

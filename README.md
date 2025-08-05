**Agent Mira Real Estate App - README**

---

## Project Overview

**Agent Mira** is a full-stack AI-powered real estate platform designed to help users:

* Find properties using a smart chatbot interface
* Save and compare listings interactively
* Estimate property prices using a trained machine learning model

### Built With:

* **Frontend:** React (Vite), Tailwind CSS
* **Backend:** Node.js + Express
* **AI:** OpenAI API for intelligent input interpretation
* **ML:** Python (scikit-learn) model via spawn integration
* **Database:** MongoDB Atlas (for saved listings)

---

## Folder Structure

```
real_estate/
├── client/               # React frontend
├── server/               # Express backend with routes
├── estimator/            # Python ML model logic
```

---

## Features

### 1. Find Property Chatbot

* Step-by-step property finder via bot prompts
* Extracts filters: location, bedrooms, budget
* Supports "all" keyword to display all properties
* Fallback logic based on match priority:

  * Location + bedroom match
  * Location-only match
  * Bedrooms-only match
  * Budget-only match
* Categorized results displayed with headings
* Save and Compare buttons on each card
* Compare list resets on page/chat refresh
* Compare opens a popup modal (scrollable with close button)
* Saved properties synced with MongoDB Atlas

### 2. Compare Feature

* Users can compare 2+ selected properties
* Modal displays image, location, bedrooms, and price
* Modal is scrollable and responsive

### 3. Save Properties

* Save button toggles to green with bounce effect
* Saved state persisted using MongoDB Atlas
* Saved page shows listings in card layout
* Checkboxes allow multi-delete from saved list

### 4. Price Estimator

* UI with location dropdown (from training data)
* Inputs for area, bedrooms, bathrooms
* Estimate Price triggers backend Python script
* Model prediction shown on screen
* Handles missing fields, failed prediction gracefully

### 5. AI Filter Extraction (Find Property only)

* OpenAI API parses natural language
* Extracts filters from vague input (e.g. "cheap houses in Chennai")
* Spinner shown while AI responds
* Filters auto-applied to fetch results

---

## Backend

### Express API Routes

* Save/unsave properties
* Estimate prices
* Fetch locations

### MongoDB

* Atlas used for persistent saved listings

### ML Integration

* Training data in `server/data/`
* Uses pandas + scikit-learn
* Model: `real_price_model.pkl`
* Python script run via `spawn()` from Node.js
* `main.py` loads model, predicts using CLI args

---

## Design Choices

* Tailwind CSS for clean modern UI
* Card layout for listings, comparison, and saved pages
* Consistent theme with blue primary color
* Scrollable popup modal for responsive compare view
* Fully responsive: works on phones, tablets, laptops

---

## Status

**All core and bonus features implemented:**

* Multi-step chatbot logic
* Categorized fallback filtering
* Save/Compare with persistence
* AI-based filter parsing
* ML-driven price prediction
* Scrollable modals for comparison
* Responsive, card-based UI

---

## Deployment Ready

* **Frontend:** Ready for Vercel
* **Backend:** Ready for Render (with Python support)
* **Database:** Connected to MongoDB Atlas

---

## Notes

* The "DeepSearch" feature was not included in final version
* Focus placed on:

  * Robust chatbot search logic
  * Accurate ML-based price predictions
  * Interactive and responsive UI
* Uses **localStorage** + **MongoDB** for session and permanent state persistence

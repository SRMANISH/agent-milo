// Global state management for saved and compare properties
class GlobalState {
  constructor() {
    this.listeners = new Map();
    this.savedIds = new Set();
    this.compareProperties = [];
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('savedPropertyIds');
      if (saved) {
        this.savedIds = new Set(JSON.parse(saved));
      }
      
      const compare = localStorage.getItem('compareProperties');
      if (compare) {
        this.compareProperties = JSON.parse(compare);
      }
    } catch (error) {
      console.error('Error loading from storage:', error);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('savedPropertyIds', JSON.stringify([...this.savedIds]));
      localStorage.setItem('compareProperties', JSON.stringify(this.compareProperties));
    } catch (error) {
      console.error('Error saving to storage:', error);
    }
  }

  // Saved properties methods
  addSavedProperty(id) {
    this.savedIds.add(id);
    this.saveToStorage();
    this.notifyListeners('saved', [...this.savedIds]);
    console.log('Added saved property:', id, 'Total saved:', this.savedIds.size);
  }

  removeSavedProperty(id) {
    this.savedIds.delete(id);
    this.saveToStorage();
    this.notifyListeners('saved', [...this.savedIds]);
    console.log('Removed saved property:', id, 'Total saved:', this.savedIds.size);
  }

  isPropertySaved(id) {
    return this.savedIds.has(id);
  }

  getSavedIds() {
    return [...this.savedIds];
  }

  // Compare properties methods
  addCompareProperty(property) {
    if (!this.compareProperties.some(p => p.id === property.id)) {
      this.compareProperties.push(property);
      this.saveToStorage();
      this.notifyListeners('compare', this.compareProperties);
      console.log('Added compare property:', property.id, 'Total compare:', this.compareProperties.length);
    }
  }

  removeCompareProperty(id) {
    this.compareProperties = this.compareProperties.filter(p => p.id !== id);
    this.saveToStorage();
    this.notifyListeners('compare', this.compareProperties);
    console.log('Removed compare property:', id, 'Total compare:', this.compareProperties.length);
  }

  getCompareProperties() {
    return this.compareProperties;
  }

  isPropertyInCompare(id) {
    return this.compareProperties.some(p => p.id === id);
  }

  // Event listener methods
  subscribe(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(type);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  notifyListeners(type, data) {
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in listener callback:', error);
        }
      });
    }
  }

  // Sync with server
  async syncWithServer(backendUrl) {
    try {
      const response = await fetch(`${backendUrl}/api/saved`);
      const savedProperties = await response.json();
      this.savedIds = new Set(savedProperties.map(p => p.id));
      this.saveToStorage();
      this.notifyListeners('saved', [...this.savedIds]);
    } catch (error) {
      console.error('Error syncing with server:', error);
    }
  }
}

// Create singleton instance
const globalState = new GlobalState();

export default globalState; 
/**
 * Game Configuration
 * Easy to modify for future clients - update this file to change game data
 */

const GameConfig = {
  // Container definitions with their required ingredients
  containers: {
    A: {
      name: "NAN 1",
      ingredients: ["Milk", "Iron", "DHA"]
    },
    B: {
      name: "NAN 2",
      ingredients: ["Milk", "Probiotic", "Vitamin C"]
    }
  },

  // Ingredient icons (emoji-based for simplicity)
  ingredientIcons: {
    "Milk": "🥛",
    "Iron": "⚙️",
    "DHA": "🧠",
    "Probiotic": "🦠",
    "Vitamin C": "🍊"
  },

  // Hint system configuration
  hints: {
    max: 3            // Maximum hints per game
  },

  // Counter for generating unique ingredient IDs
  _ingredientIdCounter: 0,

  /**
   * Generate a unique ID for an ingredient instance
   * @param {string} ingredientName - Ingredient name
   * @returns {string} Unique ID
   */
  generateIngredientId(ingredientName) {
    this._ingredientIdCounter++;
    return `${ingredientName}_${this._ingredientIdCounter}`;
  },

  /**
   * Reset the ingredient ID counter
   */
  resetIngredientIdCounter() {
    this._ingredientIdCounter = 0;
  }

};

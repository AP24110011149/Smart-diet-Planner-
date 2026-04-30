/**
 * Smart Diet Planner - 0/1 Knapsack Algorithm
 * Weight = Calories
 * Value = Nutrition Score
 */

function dpOptimize(meals, calorieLimit) {
    const N = meals.length;
    
    // Initialize DP table
    // Rows: 0 to N (meals)
    // Cols: 0 to calorieLimit
    const dp = Array.from({ length: N + 1 }, () => 
        new Array(calorieLimit + 1).fill(0)
    );

    // Build DP table
    for (let i = 1; i <= N; i++) {
        const meal = meals[i - 1];
        const weight = meal.calories;
        const value = meal.nutrition;

        for (let w = 0; w <= calorieLimit; w++) {
            if (weight > w) {
                // Item is heavier than current limit
                dp[i][w] = dp[i - 1][w];
            } else {
                // Max of (excluding item, including item)
                dp[i][w] = Math.max(
                    dp[i - 1][w],
                    dp[i - 1][w - weight] + value
                );
            }
        }
    }

    const maxNutrition = dp[N][calorieLimit];

    // Traceback to find selected items
    const selected = [];
    let w = calorieLimit;
    
    for (let i = N; i > 0 && w > 0; i--) {
        // If value changed from the row above, we included the item
        if (dp[i][w] !== dp[i - 1][w]) {
            const meal = meals[i - 1];
            selected.push(meal);
            w -= meal.calories;
        }
    }

    // Reverse to keep relative chronological or logical order
    selected.reverse();

    return { dp, selected, maxNutrition };
}


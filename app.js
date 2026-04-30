const defaultMeals = [];

let meals = [];
let currentId = 1;

// Load initial data from localStorage
loadFromLocalStorage();

// DOM Elements
const addMealForm = document.getElementById('add-meal-form');
const mealName = document.getElementById('meal-name');
const mealCategory = document.getElementById('meal-category');
const mealCalories = document.getElementById('meal-calories');

const mealTableBody = document.getElementById('meal-table-body');
const emptyState = document.getElementById('empty-state');
const optimizeBtn = document.getElementById('optimize-btn');

const calorieSlider = document.getElementById('calorie-slider');
const calorieInput = document.getElementById('calorie-input');
const userWeightInput = document.getElementById('user-weight');
const recommendBtn = document.getElementById('recommend-btn');

const inputSection = document.getElementById('input-section');
const resultSection = document.getElementById('result-section');
const backBtn = document.getElementById('back-btn');

const loadingOverlay = document.getElementById('loading-overlay');
const toastContainer = document.getElementById('toast-container');

// Results Elements
const resCalories = document.getElementById('res-calories');
const resCalLimit = document.getElementById('res-cal-limit');
const calProgress = document.getElementById('cal-progress');
const resNutrition = document.getElementById('res-nutrition');

const timelineContainer = document.getElementById('timeline-container');
const selectedMealsGrid = document.getElementById('selected-meals-grid');
const skippedList = document.getElementById('skipped-list');
const dpTableContainer = document.getElementById('dp-table');


// Initialize
updateTableUI();

// Sync Slider and Input
calorieSlider.addEventListener('input', (e) => {
    calorieInput.value = e.target.value;
});
calorieInput.addEventListener('input', (e) => {
    calorieSlider.value = e.target.value;
});

// Weight Recommendation Logic
const weightResults = document.getElementById('weight-results');
const calRange = document.getElementById('cal-range');
const lossVal = document.getElementById('loss-val');
const maintainVal = document.getElementById('maintain-val');
const gainVal = document.getElementById('gain-val');
const modeCards = document.querySelectorAll('.mode-card');

recommendBtn.addEventListener('click', () => {
    const weight = parseFloat(userWeightInput.value);
    if (isNaN(weight) || weight < 30 || weight > 250) {
        showToast("Please enter a valid body weight (30-250 kg).");
        return;
    }
    
    // Logic from user:
    // Min Calories = weight × 25
    // Max Calories = weight × 35
    const minCal = Math.round(weight * 25);
    const maxCal = Math.round(weight * 35);
    
    const maintenance = Math.round(weight * 30);
    const weightLoss = minCal;
    const weightGain = maxCal;

    // Update UI
    calRange.textContent = `${minCal} – ${maxCal}`;
    lossVal.textContent = weightLoss;
    maintainVal.textContent = maintenance;
    gainVal.textContent = weightGain;
    
    weightResults.classList.remove('hidden');
    
    // Set default to Maintenance
    updateCalorieLimit(maintenance);
    setActiveMode('mode-maintain');
    
    showToast(`Calculated ranges for ${weight}kg!`);
});

function updateCalorieLimit(value) {
    calorieSlider.value = value;
    calorieInput.value = value;
}

function setActiveMode(id) {
    modeCards.forEach(card => {
        if (card.id === id) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
}

modeCards.forEach(card => {
    card.addEventListener('click', () => {
        const value = parseInt(card.querySelector('.mode-value span').textContent);
        updateCalorieLimit(value);
        setActiveMode(card.id);
        showToast(`Set limit to ${card.id.split('-')[1]} goal: ${value} kcal`);
    });
});

// Detect calories based on name
function estimateCalories(name) {
    const lower = name.toLowerCase();
    if (lower.includes('salad') || lower.includes('soup') || lower.includes('fruit') || lower.includes('poha')) return 150;
    if (lower.includes('chicken') || lower.includes('mutton') || lower.includes('paneer') || lower.includes('chole') || lower.includes('rajma')) return 350;
    if (lower.includes('rice') || lower.includes('biryani') || lower.includes('pulao') || lower.includes('khichdi')) return 400;
    if (lower.includes('roti') || lower.includes('bread') || lower.includes('toast') || lower.includes('dosa') || lower.includes('idli')) return 200;
    if (lower.includes('egg') || lower.includes('omelette')) return 180;
    if (lower.includes('burger') || lower.includes('pizza') || lower.includes('bhature') || lower.includes('samosa') || lower.includes('puri')) return 500;
    if (lower.includes('drink') || lower.includes('juice') || lower.includes('tea') || lower.includes('coffee') || lower.includes('lassi')) return 120;
    if (lower.includes('snack') || lower.includes('nuts') || lower.includes('makhana')) return 160;
    if (lower.includes('dal') || lower.includes('curry') || lower.includes('sabzi')) return 250;
    return null; // no match found
}

addMealForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = mealName.value.trim();
    const manualCals = parseInt(mealCalories.value);
    const category = mealCategory.value;
    
    let calories;
    
    if (!isNaN(manualCals) && manualCals > 0) {
        // Use manual input if provided
        calories = manualCals;
    } else {
        // Try to estimate
        const estimated = estimateCalories(name);
        if (estimated !== null) {
            calories = estimated;
        } else {
            // No match and no manual input
            showToast("Meal not recognized. Please enter calories manually.");
            mealCalories.focus();
            mealCalories.style.borderColor = 'var(--danger)';
            setTimeout(() => mealCalories.style.borderColor = '', 2000);
            return;
        }
    }
    
    const nutrition = 5; // Default auto-assigned score

    meals.push({ id: currentId++, name, calories, nutrition, category });
    saveToLocalStorage();
    updateTableUI();
    showToast(`Added ${name} (${calories} kcal) to your meals!`);
    
    addMealForm.reset();
    mealName.focus();
});

// Delete Meal
function deleteMeal(id) {
    meals = meals.filter(m => m.id !== id);
    saveToLocalStorage();
    updateTableUI();
    showToast("Meal removed.");
}

// Update Table
function updateTableUI() {
    mealTableBody.innerHTML = '';
    
    if (meals.length === 0) {
        emptyState.classList.remove('hidden');
        optimizeBtn.disabled = true;
    } else {
        emptyState.classList.add('hidden');
        optimizeBtn.disabled = false;

        meals.forEach(meal => {
            const ratio = (meal.nutrition / meal.calories).toFixed(4);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${meal.name}</strong></td>
                <td><span style="color:var(--text-light); font-size:0.85rem">${meal.category}</span></td>
                <td>${meal.calories}</td>
                <td>${meal.nutrition}</td>
                <td>${ratio}</td>
                <td><button class="btn-delete" onclick="deleteMeal(${meal.id})">Remove</button></td>
            `;
            mealTableBody.appendChild(tr);
        });
    }
}

// Local Storage Logic
function saveToLocalStorage() {
    localStorage.setItem('dietPlannerMeals', JSON.stringify(meals));
    localStorage.setItem('dietPlannerId', currentId);
}

function loadFromLocalStorage() {
    const savedMeals = localStorage.getItem('dietPlannerMeals');
    const savedId = localStorage.getItem('dietPlannerId');
    if (savedMeals) {
        meals = JSON.parse(savedMeals);
        currentId = parseInt(savedId) || 1;
    }
}

// Toast
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Optimize Trigger
optimizeBtn.addEventListener('click', () => {
    const limit = parseInt(calorieInput.value, 10);
    if (isNaN(limit) || limit <= 0) {
        showToast("Enter a valid calorie limit.");
        return;
    }

    // Loading Animation
    loadingOverlay.classList.remove('hidden');
    
    setTimeout(() => {
        runOptimization(limit);
        loadingOverlay.classList.add('hidden');
        
        inputSection.classList.remove('active-section');
        inputSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        window.scrollTo(0, 0);
    }, 800);
});

// Back Button
backBtn.addEventListener('click', () => {
    resultSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
    inputSection.classList.add('active-section');
    window.scrollTo(0, 0);
});

// Run DP and Render
function runOptimization(limit) {
    const { dp, selected, maxNutrition } = dpOptimize(meals, limit);
    renderResults(dp, selected, maxNutrition, limit);
}

// Render Results
function renderResults(dp, selected, maxNutrition, limit) {
    // Dashboard Stats
    const totalCals = selected.reduce((sum, m) => sum + m.calories, 0);
    
    animateValue(resCalories, 0, totalCals, 1000);
    resCalLimit.textContent = limit;
    
    const percentage = Math.min((totalCals / limit) * 100, 100);
    setTimeout(() => {
        calProgress.style.width = percentage + '%';
    }, 300);
    
    animateValue(resNutrition, 0, maxNutrition, 1000);

    // Selected Meals Cards & Order Links
    selectedMealsGrid.innerHTML = '';
    selected.forEach(meal => {
        const encoded = encodeURIComponent(meal.name);
        const card = document.createElement('div');
        card.className = 'meal-card';
        card.innerHTML = `
            <div class="meal-tag">Selected by AI</div>
            <h4>${meal.name}</h4>
            <div class="meal-stats">
                <span>🔥 <strong>${meal.calories}</strong> kcal</span>
                <span>⭐ <strong>${meal.nutrition}</strong> score</span>
                <span>🍽️ <strong>${meal.category}</strong></span>
            </div>
            <div class="order-actions">
                <a href="https://www.zomato.com/search?q=${encoded}" target="_blank" class="btn-order btn-zomato">Zomato</a>
                <a href="https://www.swiggy.com/search?query=${encoded}" target="_blank" class="btn-order btn-swiggy">Swiggy</a>
                <a href="https://www.google.com/search?q=order+${encoded}+near+me" target="_blank" class="btn-order btn-google">Google</a>
            </div>
        `;
        selectedMealsGrid.appendChild(card);
    });

    if (selected.length === 0) {
        selectedMealsGrid.innerHTML = '<p>No meals selected. Calorie limit too low.</p>';
    }

    // Timeline Construction
    timelineContainer.innerHTML = '';
    const categoryOrder = { "Breakfast": 1, "Drink": 2, "Snack": 3, "Lunch": 4, "Dinner": 5 };
    const timelineMeals = [...selected].sort((a, b) => (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99));
    
    timelineMeals.forEach((meal, i) => {
        const item = document.createElement('div');
        item.className = 'timeline-item';
        item.innerHTML = `
            <div class="time-dot">${i + 1}</div>
            <div class="time-meal">${meal.category}<br><span style="color:var(--primary-color)">${meal.name}</span></div>
        `;
        timelineContainer.appendChild(item);
    });

    if (timelineMeals.length === 0) {
        timelineContainer.innerHTML = '<p style="color:var(--text-light)">No schedule available.</p>';
    }


    // Skipped Items
    skippedList.innerHTML = '';
    const selectedIds = new Set(selected.map(m => m.id));
    const skipped = meals.filter(m => !selectedIds.has(m.id));
    
    if (skipped.length === 0) {
        skippedList.innerHTML = '<p class="sub-text">None! All meals fit.</p>';
    } else {
        skipped.forEach(meal => {
            const div = document.createElement('div');
            div.className = 'skipped-item';
            div.innerHTML = `<strong>${meal.name}</strong><span>${meal.calories} kcal | ${meal.nutrition} score</span>`;
            skippedList.appendChild(div);
        });
    }

    // DP Table 
    renderDpTable(dp, limit, selected);
}

// Animate numbers
function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Render DP Table with Stepping for Performance
function renderDpTable(dp, limit, selected) {
    dpTableContainer.innerHTML = '';
    const N = meals.length;

    // Build the optimal cells path
    const optimalCells = new Set();
    let currW = limit;
    for (let i = N; i > 0 && currW > 0; i--) {
        if (dp[i][currW] !== dp[i - 1][currW]) {
            optimalCells.add(`${i}-${currW}`);
            currW -= meals[i - 1].calories;
        } else {
            optimalCells.add(`${i}-${currW}`);
        }
    }
    optimalCells.add(`0-${currW}`);

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th>Meal \\ Limit</th>`;
    
    // Step columns if limit is too large to prevent browser lag
    let step = 1;
    if (limit > 200) step = Math.ceil(limit / 50); // cap to ~50 cols

    const cols = [0];
    for (let w = step; w < limit; w += step) { cols.push(w); }
    if (cols[cols.length - 1] !== limit) cols.push(limit);

    cols.forEach(w => headerRow.innerHTML += `<th>${w}</th>`);
    thead.appendChild(headerRow);
    dpTableContainer.appendChild(thead);

    const tbody = document.createElement('tbody');
    for (let i = 0; i <= N; i++) {
        const tr = document.createElement('tr');
        const rowLabel = i === 0 ? '0 (Empty)' : `${i}. ${meals[i-1].name}`;
        tr.innerHTML = `<th>${rowLabel}</th>`;
        
        cols.forEach(w => {
            const td = document.createElement('td');
            td.textContent = dp[i][w];
            if (optimalCells.has(`${i}-${w}`)) {
                td.className = 'dp-cell-optimal';
            }
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    }
    dpTableContainer.appendChild(tbody);
}

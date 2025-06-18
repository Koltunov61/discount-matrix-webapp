let discountMatrix = [];
let categories = {};
let defectsSuggestions = new Set(); // Store unique defect descriptions for autocomplete

// Function to load data from JSON files
async function loadData() {
    try {
        // Load categories from categories.json
        const categoriesResponse = await fetch('categories.json');
        if (!categoriesResponse.ok) {
            throw new Error(`HTTP error! status: ${categoriesResponse.status} from categories.json`);
        }
        categories = await categoriesResponse.json();
        populateCategorySelect(categories);
        console.log("Categories loaded:", categories);

        // Load rules from Rules.txt
        const rulesResponse = await fetch('Rules.txt');
        if (!rulesResponse.ok) {
            throw new Error(`HTTP error! status: ${rulesResponse.status} from Rules.txt`);
        }
        const rulesText = await rulesResponse.text();
        discountMatrix = parseRulesText(rulesText); // Parse the CSV-like Rules.txt

        // Populate defect suggestions for autocomplete
        discountMatrix.forEach(row => {
            // Collect all defect descriptions from 10%, 20%, 50%, 100%, and SLZ columns
            ['Детальное описание дефекта (10% Упаковка)', 'Детальное описание дефекта (20%)',
             'Детальное описание дефекта (50%)', 'Детальное описание дефекта (100%)',
             'Диагностика в СЛЦ'].forEach(col => {
                if (row[col]) {
                    row[col].split(';').forEach(defect => {
                        const trimmedDefect = defect.trim();
                        if (trimmedDefect) {
                            defectsSuggestions.add(trimmedDefect);
                        }
                    });
                }
            });
        });
        console.log("Discount Matrix loaded:", discountMatrix);
        console.log("Defect suggestions:", defectsSuggestions);
    } catch (error) {
        console.error("Error loading data:", error);
        document.getElementById('resultsTable').innerHTML = `<p class="text-center text-red-500">Ошибка загрузки данных: ${error.message}. Убедитесь, что файлы categories.json и Rules.txt доступны.</p>`;
    }
}

// Function to parse the Rules.txt content (CSV-like with quoted fields)
function parseRulesText(text) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];

    // Simple CSV parser for quoted fields
    const parseLine = (line) => {
        const result = [];
        let inQuote = false;
        let currentField = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
                // Handle escaped quotes within a field (e.g., "" becomes ")
                if (inQuote && line[i + 1] === '"') {
                    currentField += '"';
                    i++; // Skip next quote
                }
            } else if (char === ',' && !inQuote) {
                result.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }
        result.push(currentField.trim());
        return result;
    };

    const headers = parseLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = parseLine(lines[i]);
        if (values.length === headers.length) {
            let rowObject = {};
            headers.forEach((header, index) => {
                rowObject[header] = values[index];
            });
            data.push(rowObject);
        } else {
            console.warn(`Skipping malformed row ${i + 1}: ${lines[i]}`);
        }
    }
    return data;
}


// Function to populate the category dropdown
function populateCategorySelect(categoriesData) {
    const selectElement = document.getElementById('categorySelect');
    // Clear existing options, except the default one
    selectElement.innerHTML = '<option value="">Выберите категорию</option>';
    for (const code in categoriesData) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = categoriesData[code];
        selectElement.appendChild(option);
    }
}

// Autocomplete function (reusable for product and defect)
function autocomplete(inp, arr) {
    let currentFocus;

    inp.addEventListener("input", function(e) {
        let a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false; }
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);

        let count = 0; // To limit suggestions
        for (i = 0; i < arr.length && count < 10; i++) { // Limit to 10 suggestions
            // Convert to lowercase for case-insensitive matching
            if (arr[i].toLowerCase().includes(val.toLowerCase())) {
                b = document.createElement("DIV");
                // Bold matching part
                const matchIndex = arr[i].toLowerCase().indexOf(val.toLowerCase());
                const preMatch = arr[i].substr(0, matchIndex);
                const match = arr[i].substr(matchIndex, val.length);
                const postMatch = arr[i].substr(matchIndex + val.length);

                b.innerHTML = preMatch + "<strong>" + match + "</strong>" + postMatch;
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                    filterResults(); // Trigger filter on selection
                });
                a.appendChild(b);
                count++;
            }
        }
    });

    inp.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) { // ARROW DOWN
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // ARROW UP
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // ENTER
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            } else {
                filterResults(); // Trigger filter on Enter even if no autocomplete selected
            }
        }
    });

    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}


// Function to filter and display results
function filterResults() {
    const selectedCategoryCode = document.getElementById('categorySelect').value;
    const defectSearchTerm = document.getElementById('defectSearch').value.toLowerCase();
    const resultsTable = document.getElementById('resultsTable');

    if (!selectedCategoryCode && !defectSearchTerm) {
        resultsTable.innerHTML = '<p class="text-center text-gray-500">Введите описание дефекта и/или выберите категорию для поиска.</p>';
        return;
    }

    const filteredResults = discountMatrix.filter(row => {
        // Find the full category name from the loaded categories object
        const categoryNameForComparison = categories[selectedCategoryCode];
        const categoryMatch = !selectedCategoryCode || (row['Категория товара'] === categoryNameForComparison);

        const defectMatch = !defectSearchTerm ||
            ['Детальное описание дефекта (10% Упаковка)', 'Детальное описание дефекта (20%)',
             'Детальное описание дефекта (50%)', 'Детальное описание дефекта (100%)',
             'Диагностика в СЛЦ'].some(col => {
                if (row[col]) {
                    return row[col].toLowerCase().includes(defectSearchTerm);
                }
                return false;
            });

        return categoryMatch && defectMatch;
    });

    displayResults(filteredResults);
}

// Function to display results in a table
function displayResults(results) {
    const resultsTable = document.getElementById('resultsTable');
    if (results.length === 0) {
        resultsTable.innerHTML = '<p class="text-center text-gray-500">Совпадений не найдено. Попробуйте изменить критерии поиска.</p>';
        return;
    }

    let tableHtml = `
        <table class="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
            <thead>
                <tr>
                    <th class="py-3 px-4">Категория товара</th>
                    <th class="py-3 px-4">Системный классификатор</th>
                    <th class="py-3 px-4">Тип дефекта (общий)</th>
                    <th class="py-3 px-4">10% Упаковка</th>
                    <th class="py-3 px-4">20%</th>
                    <th class="py-3 px-4">50%</th>
                    <th class="py-3 px-4">100%</th>
                    <th class="py-3 px-4">Диагностика в СЛЦ</th>
                </tr>
            </thead>
            <tbody>
    `;

    results.forEach(row => {
        tableHtml += `
            <tr>
                <td class="py-3 px-4">${row['Категория товара'] || ''}</td>
                <td class="py-3 px-4">${row['Системный классификатор'] || ''}</td>
                <td class="py-3 px-4">${row['Тип дефекта (общий)'] || ''}</td>
                <td class="py-3 px-4">${row['Детальное описание дефекта (10% Упаковка)'] || ''}</td>
                <td class="py-3 px-4">${row['Детальное описание дефекта (20%)'] || ''}</td>
                <td class="py-3 px-4">${row['Детальное описание дефекта (50%)'] || ''}</td>
                <td class="py-3 px-4">${row['Детальное описание дефекта (100%)'] || ''}</td>
                <td class="py-3 px-4">${row['Диагностика в СЛЦ'] || ''}</td>
            </tr>
        `;
    });

    tableHtml += `
            </tbody>
        </table>
    `;
    resultsTable.innerHTML = tableHtml;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const categorySelect = document.getElementById('categorySelect');
    const defectSearchInput = document.getElementById('defectSearch');

    // Filter results when category changes
    categorySelect.addEventListener('change', filterResults);

    // Apply autocomplete to defect search input
    autocomplete(defectSearchInput, Array.from(defectsSuggestions));

    // Filter results on defect input (with a slight delay for better performance)
    let typingTimer;
    const doneTypingInterval = 300; // milliseconds
    defectSearchInput.addEventListener('keyup', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(filterResults, doneTypingInterval);
    });
});

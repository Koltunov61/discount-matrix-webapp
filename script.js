let discountMatrix = [];
let categories = {};
let synonyms = {}; // Добавляем переменную для синонимов
let defectsSuggestions = new Set(); // Store unique defect descriptions for autocomplete

// Функция для загрузки данных из JSON и текстовых файлов
async function loadData() {
    try {
        // Загружаем категории из categories.json
        const categoriesResponse = await fetch('categories.json');
        if (!categoriesResponse.ok) {
            throw new Error(`HTTP error! status: ${categoriesResponse.status} from categories.json`);
        }
        categories = await categoriesResponse.json();
        populateCategorySelect(categories);
        console.log("Категории загружены:", categories);

        // Загружаем правила из Rules.txt
        const rulesResponse = await fetch('Rules.txt');
        if (!rulesResponse.ok) {
            throw new Error(`HTTP error! status: ${rulesResponse.status} from Rules.txt`);
        }
        const rulesText = await rulesResponse.text();
        discountMatrix = parseRulesText(rulesText); // Парсим CSV-подобный Rules.txt

        // Загружаем синонимы из synonyms.json
        const synonymsResponse = await fetch('synonyms.json');
        if (!synonymsResponse.ok) {
            // Предупреждаем, но продолжаем без синонимов, если файл не найден
            console.warn(`HTTP error! status: ${synonymsResponse.status} from synonyms.json. Search might be less accurate.`);
        } else {
            synonyms = await synonymsResponse.json();
            console.log("Синонимы загружены:", synonyms);
        }

        // Заполняем предложения дефектов для автодополнения
        discountMatrix.forEach(row => {
            // Собираем все описания дефектов из колонок 10%, 20%, 50%, 100% и СЛЦ
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
        console.log("Матрица скидок загружена:", discountMatrix);
        console.log("Предложения дефектов для автодополнения:", defectsSuggestions);

    } catch (error) {
        console.error("Ошибка загрузки данных:", error);
        document.getElementById('resultsTable').innerHTML = `<p class="text-center text-red-500">Ошибка загрузки данных: ${error.message}. Убедитесь, что файлы categories.json, Rules.txt и synonyms.json доступны.</p>`;
    }
}

// Функция для парсинга содержимого Rules.txt (CSV-подобный формат с полями в кавычках)
function parseRulesText(text) {
    const lines = text.trim().split('\n');
    if (lines.length === 0) return [];

    // Простой CSV-парсер для полей в кавычках
    const parseLine = (line) => {
        const result = [];
        let inQuote = false;
        let currentField = '';
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
                // Обработка экранированных кавычек внутри поля (например, "" становится ")
                if (inQuote && line[i + 1] === '"') {
                    currentField += '"';
                    i++; // Пропускаем следующую кавышку
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
            console.warn(`Пропуск некорректной строки ${i + 1}: ${lines[i]}`);
        }
    }
    return data;
}


// Функция для заполнения выпадающего списка категорий
function populateCategorySelect(categoriesData) {
    const selectElement = document.getElementById('categorySelect');
    // Очищаем существующие опции, кроме дефолтной
    selectElement.innerHTML = '<option value="">Выберите категорию</option>';
    for (const code in categoriesData) {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = categoriesData[code];
        selectElement.appendChild(option);
    }
}

// Вспомогательная функция для получения всех связанных терминов (включая синонимы) для данного слова
// Это вернет массив терминов, связанных с входным словом, включая само слово и его синонимы.
function getExpandedTermsForWord(word, synonymsDict) {
    const terms = new Set();
    const lowerWord = word.toLowerCase();

    // 1. Добавляем само оригинальное слово
    terms.add(lowerWord);

    // 2. Проверяем, является ли точное слово ключом в словаре синонимов
    if (synonymsDict[lowerWord]) {
        synonymsDict[lowerWord].forEach(syn => terms.add(syn.toLowerCase()));
    }

    // 3. Проверяем, является ли слово синонимом для какого-либо ключа (например, "разбитым" является синонимом "разбит")
    // Это нужно для обработки флексий, если они указаны в синонимах как значения, а не как ключи.
    for (const key in synonymsDict) {
        if (Array.isArray(synonymsDict[key]) && synonymsDict[key].includes(lowerWord)) {
            terms.add(key.toLowerCase()); // Добавляем базовый ключ
            synonymsDict[key].forEach(syn => terms.add(syn.toLowerCase())); // Добавляем все синонимы для этого ключа
        }
    }

    // 4. Ручное сопоставление общих флексий с их базовыми формами, которые являются ключами в synonyms.json
    // Это простой способ обработки флексий без полной библиотеки морфологического анализа.
    const commonInflectionMappings = {
        "разбитым": "разбит",
        "разбитого": "разбит",
        "разбитая": "разбит",
        "экраном": "экран",
        "экрана": "экран",
        "экрану": "экран",
        "треснул": "трещина",
        "треснувший": "трещина",
        "сломанный": "не работает",
        "поврежденный": "дефект",
        "телефоном": "телефон",
        "телефона": "телефон",
        "телефоны": "телефон"
    };

    const mappedWord = commonInflectionMappings[lowerWord];
    if (mappedWord) {
        terms.add(mappedWord);
        if (synonymsDict[mappedWord]) {
            synonymsDict[mappedWord].forEach(syn => terms.add(syn.toLowerCase()));
        }
    }

    return Array.from(terms);
}


// Функция автодополнения (переиспользуемая для поля дефекта)
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

        let count = 0; // Для ограничения предложений
        for (i = 0; i < arr.length && count < 10; i++) { // Ограничиваем до 10 предложений
            // Преобразуем в нижний регистр для нечувствительного к регистру сравнения
            if (arr[i].toLowerCase().includes(val.toLowerCase())) {
                b = document.createElement("DIV");
                // Выделяем совпадающую часть жирным шрифтом
                const matchIndex = arr[i].toLowerCase().indexOf(val.toLowerCase());
                const preMatch = arr[i].substr(0, matchIndex);
                const match = arr[i].substr(matchIndex, val.length);
                const postMatch = arr[i].substr(matchIndex + val.length);

                b.innerHTML = preMatch + "<strong>" + match + "</strong>" + postMatch;
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                    filterResults(); // Запускаем фильтрацию при выборе
                });
                a.appendChild(b);
                count++;
            }
        }
    });

    inp.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) { // СТРЕЛКА ВНИЗ
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // СТРЕЛКА ВВЕРХ
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // ENTER
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            } else {
                filterResults(); // Запускаем фильтрацию при нажатии Enter, даже если автодополнение не выбрано
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


// Функция для фильтрации и отображения результатов
function filterResults() {
    const selectedCategoryCode = document.getElementById('categorySelect').value;
    const defectSearchTerm = document.getElementById('defectSearch').value.toLowerCase().trim();
    const resultsTable = document.getElementById('resultsTable');

    if (!selectedCategoryCode && !defectSearchTerm) {
        resultsTable.innerHTML = '<p class="text-center text-gray-500">Введите описание дефекта и/или выберите категорию для поиска.</p>';
        return;
    }

    // Список стоп-слов, которые нужно игнорировать
    const stopWords = new Set(["пришёл", "с", "и", "на", "в", "к", "от", "для", "по", "у", "не", "нет", "из", "был", "была", "было", "были"]);

    // Генерируем расширенные поисковые термины из ввода пользователя, игнорируя стоп-слова
    const userSearchWords = defectSearchTerm.split(' ').filter(word => word.length > 0 && !stopWords.has(word));
    
    // Если после фильтрации по стоп-словам ничего не осталось, значит запрос нерелевантен
    if (userSearchWords.length === 0 && defectSearchTerm.length > 0) {
        resultsTable.innerHTML = '<p class="text-center text-gray-500">Не удалось найти релевантные термины в вашем запросе. Попробуйте использовать более специфичные слова.</p>';
        return;
    }


    const filteredResults = discountMatrix.filter(row => {
        const categoryNameForComparison = categories[selectedCategoryCode];
        const categoryMatch = !selectedCategoryCode || (row['Категория товара'] === categoryNameForComparison);

        let defectMatch = false;
        if (!defectSearchTerm) { // Если нет термина дефекта, это совпадение по умолчанию, если категория совпадает
            defectMatch = true;
        } else {
            const defectColumns = ['Детальное описание дефекта (10% Упаковка)', 'Детальное описание дефекта (20%)',
                                   'Детальное описание дефекта (50%)', 'Детальное описание дефекта (100%)',
                                   'Диагностика в СЛЦ'];

            // Проверяем, что каждое из *отфильтрованных* слов запроса (или его синоним) найдено в правилах
            // Теперь проверяем не только колонки дефектов, но и "Категория товара"
            const allRelevantWordsMatched = userSearchWords.every(searchWord => {
                const termsToMatch = getExpandedTermsForWord(searchWord, synonyms);
                
                // Проверяем, содержится ли любой из терминов для searchWord в любой колонке дефектов ИЛИ в категории товара
                // (row['Категория товара'] && termsToMatch.some(term => row['Категория товара'].toLowerCase().includes(term)))
                const foundInDefectColumn = defectColumns.some(col => {
                    if (row[col]) {
                        const ruleDefectDescriptions = row[col].toLowerCase().split(';').map(s => s.trim()).filter(s => s.length > 0);
                        return ruleDefectDescriptions.some(ruleDesc => {
                            return termsToMatch.some(term => ruleDesc.includes(term));
                        });
                    }
                    return false;
                });

                // Если категория товара выбрана, то она должна соответствовать и по запросу.
                // Если категория не выбрана, или выбрана, и ее название совпадает с одним из терминов, то это тоже совпадение.
                const foundInCategory = (row['Категория товара'] && termsToMatch.some(term => row['Категория товара'].toLowerCase().includes(term)));
                
                return foundInDefectColumn || foundInCategory;
            });
            defectMatch = allRelevantWordsMatched;
        }
        return categoryMatch && defectMatch;
    });

    displayResults(filteredResults);
}

// Функция для отображения результатов в таблице
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

// Слушатели событий
document.addEventListener('DOMContentLoaded', () => {
    loadData();

    const categorySelect = document.getElementById('categorySelect');
    const defectSearchInput = document.getElementById('defectSearch');

    // Фильтрация результатов при изменении категории
    categorySelect.addEventListener('change', filterResults);

    // Применяем автодополнение к полю ввода дефекта
    // Важно: defectsSuggestions будет заполнен после загрузки Rules.txt в loadData()
    // Поэтому запускаем autocomplete здесь, но он будет использовать данные, когда они загрузятся.
    // Для более надежного автодополнения можно перенести его после того, как promise loadData() разрешится.
    loadData().then(() => {
        autocomplete(defectSearchInput, Array.from(defectsSuggestions));
    }).catch(error => {
        console.error("Ошибка при инициализации автодополнения:", error);
    });


    // Фильтрация результатов при вводе дефекта (с небольшой задержкой для лучшей производительности)
    let typingTimer;
    const doneTypingInterval = 300; // миллисекунды
    defectSearchInput.addEventListener('keyup', () => {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(filterResults, doneTypingInterval);
    });
});

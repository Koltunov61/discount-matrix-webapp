let discountMatrix = [];
let categories = {};
let synonyms = {}; // Добавляем переменную для синонимов
let defectsSuggestions = new Set(); // Store unique defect descriptions for autocomplete

// Mapping of common product types to their corresponding category display names from categories.json
// Это позволяет связать введенные пользователем названия товаров с их общими категориями.
const productTypeToCategoryMapping = {
    "телефон": "Мелко-габаритный товар и аксессуары",
    "смартфон": "Мелко-габаритный товар и аксессуары",
    "мобильник": "Мелко-габаритный товар и аксессуары",
    "сотовый": "Мелко-габаритный товар и аксессуары",
    "ноутбук": "Крупно- и средне-габаритный товар",
    "лэптоп": "Крупно- и средне-габаритный товар",
    "нетбук": "Крупно- и средне-габаритный товар",
    "видеокарта": "Комплектующие для ПК",
    "процессор": "Комплектующие для ПК",
    "материнская плата": "Комплектующие для ПК",
    "оперативная память": "Комплектующие для ПК",
    "системный блок": "Комплектующие для ПК",
    "компьютер": "Комплектующие для ПК",
    "тв": "Крупно- и средне-габаритный товар",
    "телевизор": "Крупно- и средне-габаритный товар",
    "монитор": "Комплектующие для ПК", // Мониторы могут быть и как Комплектующие для ПК, и как Крупно- и средне-габаритный товар. Уточнить, если нужна более строгая классификация.
    "пылесос": "Крупно- и средне-габаритный товар",
    "стиральная машина": "Крупно- и средне-габаритный товар",
    "холодильник": "Крупно- и средне-габаритный товар",
    "кофемашина": "Крупно- и средне-габаритный товар",
    "микроволновка": "Крупно- и средне-габаритный товар",
    "духовой шкаф": "Крупно- и средне-габаритный товар",
    "плита": "Крупно- и средне-габаритный товар",
    "варочная панель": "Крупно- и средне-габаритный товар",
    "электрочайник": "Мелко-габаритный товар и аксессуары",
    "посудомоечная машинка": "Крупно- и средне-габаритный товар",
    "бритва": "Мелко-габаритный товар и аксессуары",
    "машинка для стрижки": "Мелко-габаритный товар и аксессуары",
    "эпилятор": "Мелко-габаритный товар и аксессуары",
    "зубная щётка": "Мелко-габаритный товар и аксессуары",
    "накладные наушники": "Мелко-габаритный товар и аксессуары"
};

// Список стоп-слов, которые нужно игнорировать при обработке запросов и предложений автодополнения
const stopWords = new Set(["пришёл", "с", "и", "на", "в", "к", "от", "для", "по", "у", "не", "нет", "из", "был", "была", "было", "были", "потом", "затем", "то", "это", "что", "как", "так", "да", "но", "или", "либо"]);


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
                    // Разделяем описание на отдельные дефекты по точке с запятой
                    const rawDefects = row[col].split(';').map(d => d.trim()).filter(d => d.length > 0);
                    rawDefects.forEach(defectPhrase => {
                        // Добавляем саму фразу для автодополнения (полезно для длинных описаний)
                        defectsSuggestions.add(defectPhrase);

                        // Разделяем фразу на слова (игнорируя стоп-слова)
                        const wordsInPhrase = defectPhrase.split(' ').filter(word => word.length > 0 && !stopWords.has(word.toLowerCase()));
                        wordsInPhrase.forEach(word => {
                            // Для каждого значимого слова получаем его расширенные термины (синонимы/флексии)
                            getExpandedTermsForWord(word, synonyms).forEach(term => {
                                defectsSuggestions.add(term); // Добавляем каждый расширенный термин в предложения
                            });
                        });
                    });
                }
            });
            // Также добавляем категории в предложения для автодополнения, если нужно
            if (row['Категория товара']) {
                defectsSuggestions.add(row['Категория товара']);
            }
        });
        console.log("Матрица скидок загружена:", discountMatrix);
        console.log("Предложения дефектов для автодополнения (расширенные):", defectsSuggestions);

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
                    i++; // Пропускаем следующую кавычку
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

    // 3. Проверяем, является ли слово синонимом для какого-либо ключа
    for (const key in synonymsDict) {
        if (Array.isArray(synonymsDict[key]) && synonymsDict[key].includes(lowerWord)) {
            terms.add(key.toLowerCase()); // Добавляем базовый ключ
            synonymsDict[key].forEach(syn => terms.add(syn.toLowerCase())); // Добавляем все синонимы для этого ключа
        }
    }

    // 4. Ручное сопоставление общих флексий с их базовыми формами, которые являются ключами в synonyms.json
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
        const lowerVal = val.toLowerCase();
        // Фильтруем массив arr, чтобы получить только те элементы, которые содержат val
        const filteredArr = arr.filter(item => item.toLowerCase().includes(lowerVal));
        
        for (i = 0; i < filteredArr.length && count < 10; i++) { // Ограничиваем до 10 предложений
            const item = filteredArr[i];
            b = document.createElement("DIV");
            // Выделяем совпадающую часть жирным шрифтом
            const matchIndex = item.toLowerCase().indexOf(lowerVal);
            const preMatch = item.substr(0, matchIndex);
            const match = item.substr(matchIndex, lowerVal.length);
            const postMatch = item.substr(matchIndex + lowerVal.length);

            b.innerHTML = preMatch + "<strong>" + match + "</strong>" + postMatch;
            b.innerHTML += "<input type='hidden' value='" + item + "'>";
            b.addEventListener("click", function(e) {
                inp.value = this.getElementsByTagName("input")[0].value;
                closeAllLists();
                filterResults(); // Запускаем фильтрацию при выборе
            });
            a.appendChild(b);
            count++;
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

    // Генерируем расширенные поисковые термины из ввода пользователя, игнорируя стоп-слова
    const userSearchWords = defectSearchTerm.split(' ').filter(word => word.length > 0 && !stopWords.has(word));
    
    // Если после фильтрации по стоп-словам ничего не осталось, значит запрос нерелевантен
    if (userSearchWords.length === 0 && defectSearchTerm.length > 0) {
        resultsTable.innerHTML = '<p class="text-center text-gray-500">Не удалось найти релевантные термины в вашем запросе. Попробуйте использовать более специфичные слова.</p>';
        return;
    }


    const filteredResults = discountMatrix.filter(row => {
        const categoryNameForComparison = categories[selectedCategoryCode];
        const categoryMatch = !selectedCategoryCode || (row['Категотория товара'] === categoryNameForComparison);

        let defectMatch = false;
        if (!defectSearchTerm) { // Если нет термина дефекта, это совпадение по умолчанию, если категория совпадает
            defectMatch = true;
        } else {
            const defectColumns = ['Детальное описание дефекта (10% Упаковка)', 'Детальное описание дефекта (20%)',
                                   'Детальное описание дефекта (50%)', 'Детальное описание дефекта (100%)',
                                   'Диагностика в СЛЦ'];

            // Проверяем, что каждое из *отфильтрованных* слов запроса (или его синоним) найдено в правилах
            const allRelevantWordsMatched = userSearchWords.every(searchWord => {
                const termsToMatch = getExpandedTermsForWord(searchWord, synonyms);
                
                // Проверяем, содержится ли любой из терминов для searchWord в любой колонке дефектов ИЛИ в категории товара (по явному сопоставлению)
                const foundInDefectColumnOrCategory = defectColumns.some(col => {
                    if (row[col]) {
                        const ruleDefectDescriptions = row[col].toLowerCase().split(';').map(s => s.trim()).filter(s => s.length > 0);
                        return ruleDefectDescriptions.some(ruleDesc => {
                            return termsToMatch.some(term => ruleDesc.includes(term));
                        });
                    }
                    return false;
                }) || termsToMatch.some(term => {
                    // Проверяем, если термин соответствует типу продукта, который затем сопоставляется с категорией правила
                    const mappedCategory = productTypeToCategoryMapping[term];
                    // Если mappedCategory существует и совпадает с категорией текущей строки (или если категория не выбрана)
                    return mappedCategory && row['Категория товара'].toLowerCase() === mappedCategory.toLowerCase();
                });
                
                return foundInDefectColumnOrCategory;
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
    loadData().then(() => { // Убедимся, что данные загружены перед инициализацией автодополнения
        const categorySelect = document.getElementById('categorySelect');
        const defectSearchInput = document.getElementById('defectSearch');

        // Фильтрация результатов при изменении категории
        categorySelect.addEventListener('change', filterResults);

        // Применяем автодополнение к полю ввода дефекта
        autocomplete(defectSearchInput, Array.from(defectsSuggestions));

        // Фильтрация результатов при вводе дефекта (с небольшой задержкой для лучшей производительности)
        let typingTimer;
        const doneTypingInterval = 300; // миллисекунды
        defectSearchInput.addEventListener('keyup', () => {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(filterResults, doneTypingInterval);
        });
    }).catch(error => {
        console.error("Ошибка при инициализации приложения:", error);
    });
});

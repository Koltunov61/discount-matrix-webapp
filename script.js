let discountMatrix = [];
let categories = {};
let synonyms = {}; // Добавляем переменную для синонимов
let defectsSuggestions = new Set(); // Store unique defect descriptions for autocomplete

// Mapping of common product types to their corresponding category display names from categories.json
// Это позволяет связать введенные пользователем названия товаров с их общими категориями.
const productTypeToCategoryMapping = {
    // Крупно- и средне-габаритный товар
    "холодильник": "Крупно- и средне-габаритный товар",
    "кондиционер": "Крупно- и средне-габаритный товар",
    "встраиваемая техника": "Крупно- и средне-габаритный товар",
    "стиральная машина": "Крупно- и средне-габаритный товар",
    "посудомоечная машина": "Крупно- и средне-габаритный товар",
    "телевизор": "Крупно- и средне-габаритный товар",
    "монитор": "Крупно- и средне-габаритный товар",
    "музыкальный центр": "Крупно- и средне-габаритный товар",
    "магнитола": "Крупно- и средне-габаритный товар",
    "hi-fi техника": "Крупно- и средне-габаритный товар",
    "акустическая система": "Крупно- и средне-габаритный товар",
    "свч": "Крупно- и средне-габаритный товар",
    "микроволновка": "Крупно- и средне-габаритный товар",
    "пылесос": "Крупно- и средне-габаритный товар",
    "гладильная доска": "Крупно- и средне-габаритный товар",
    "сушка для белья": "Крупно- и средне-габаритный товар",
    "духовой шкаф": "Крупно- и средне-габаритный товар",
    "плита": "Крупно- и средне-габаритный товар",
    "варочная панель": "Крупно- и средне-габаритный товар",
    "тв": "Крупно- и средне-габаритный товар",
    "плитка": "Крупно- и средне-габаритный товар",


    // Мелко-габаритный товар и аксессуары
    "телефон": "Мелко-габаритный товар и аксессуары",
    "смартфон": "Мелко-габаритный товар и аксессуары",
    "мобильник": "Мелко-габаритный товар и аксессуары",
    "сотовый": "Мелко-габаритный товар и аксессуары",
    "планшет": "Мелко-габаритный товар и аксессуары",
    "ноутбук": "Мелко-габаритный товар и аксессуары", // Может быть и крупным, но по вашему описанию отнесен сюда.
    "лэптоп": "Мелко-габаритный товар и аксессуары",
    "нетбук": "Мелко-габаритный товар и аксессуары",
    "системный блок": "Мелко-габаритный товар и аксессуары",
    "компьютер": "Мелко-габаритный товар и аксессуары", // Общий компьютер может быть, но ПК комплектующие отдельно.
    "фотоаппарат": "Мелко-габаритный товар и аксессуары",
    "видеокамера": "Мелко-габаритный товар и аксессуары",
    "часы": "Мелко-габаритный товар и аксессуары",
    "утюг": "Мелко-габаритный товар и аксессуары",
    "чайник": "Мелко-габаритный товар и аксессуары",
    "кофемолка": "Мелко-габаритный товар и аксессуары",
    "тостер": "Мелко-габаритный товар и аксессуары",
    "щипцы": "Мелко-габаритный товар и аксессуары",
    "кофемашина": "Мелко-габаритный товар и аксессуары",
    "бритва": "Мелко-габаритный товар и аксессуары",
    "машинка для стрижки": "Мелко-габаритный товар и аксессуары",
    "эпилятор": "Мелко-габаритный товар и аксессуары",
    "зубная щётка": "Мелко-габаритный товар и аксессуары",
    "наушники": "Мелко-габаритный товар и аксессуары",
    "аксессуары": "Мелко-габаритный товар и аксессуары",
    "мелкогабаритный": "Мелко-габаритный товар и аксессуары",
    "кабель": "Мелко-габаритный товар и аксессуары",
    "переходник": "Мелко-габаритный товар и аксессуары",
    "флешка": "Мелко-габаритный товар и аксессуары",
    "жесткий диск внешний": "Мелко-габаритный товар и аксессуары",
    "мышь": "Мелко-габаритный товар и аксессуары",
    "клавиатура": "Мелко-габаритный товар и аксессуары",
    "роутер": "Мелко-габаритный товар и аксессуары",
    "веб-камера": "Мелко-габаритный товар и аксессуары",
    "микрофон": "Мелко-габаритный товар и аксессуары",
    "зарядка": "Мелко-габаритный товар и аксессуары",
    "power bank": "Мелко-габаритный товар и аксессуары",
    "фитнес-браслет": "Мелко-габаритный товар и аксессуары",
    "колонка": "Мелко-габаритный товар и аксессуары",
    "блютуз колонка": "Мелко-габаритный товар и аксессуары",
    "игрушка": "Мелко-габаритный товар и аксессуары",
    "канцтовары": "Мелко-габаритный товар и аксессуары",
    "медицинская техника": "Мелко-габаритный товар и аксессуары",
    "товары для дома": "Мелко-габаритный товар и аксессуары",
    "источники питания": "Мелко-габаритный товар и аксессуары",
    "удлинитель": "Мелко-габаритный товар и аксессуары",
    "сетевой фильтр": "Мелко-габаритный товар и аксессуары",
    "хозяйственные товары": "Мелко-габаритный товар и аксессуары",
    "накопитель": "Мелко-габаритный товар и аксессуары",


    // Комплектующие для ПК
    "видеокарта": "Комплектующие для ПК",
    "процессор": "Комплектующие для ПК",
    "материнская плата": "Комплектующие для ПК",
    "оперативная память": "Комплектующие для ПК",
    "ram": "Комплектующие для ПК",
    "ssd": "Комплектующие для ПК",
    "внутренний жесткий диск": "Комплектующие для ПК",
    "cpu": "Комплектующие для ПК",
    "hdd": "Комплектующие для ПК",
    "блок питания": "Комплектующие для ПК",
    "корпус пк": "Комплектующие для ПК",
    "кулер": "Комплектующие для ПК",
    "процессорный кулер": "Комплектующие для ПК",
    "вентилятор для пк": "Комплектующие для ПК",
    "звуковая карта": "Комплектующие для ПК",
    "сетевая карта": "Комплектующие для ПК",
    "оптический привод": "Комплектующие для ПК",
    "контроллер": "Комплектующие для ПК",
    "га": "Комплектующие для ПК",
    "мб": "Комплектующие для ПК"
};


// Функция загрузки данных
async function loadData() {
    try {
        const [rulesResponse, categoriesResponse, synonymsResponse] = await Promise.all([
            fetch('Rules.txt'),
            fetch('categories.json'),
            fetch('synonyms.json')
        ]);

        const rulesText = await rulesResponse.text();
        categories = await categoriesResponse.json();
        synonyms = await synonymsResponse.json(); // Загружаем синонимы

        // Парсинг CSV данных из Rules.txt
        discountMatrix = rulesText.split('\n').slice(1).map(row => {
            const columns = row.split('","').map(col => col.replace(/"/g, '').trim());
            if (columns.length === 8) { // Проверка на ожидаемое количество столбцов
                return {
                    'Категория товара': columns[0],
                    'Системный классификатор': columns[1],
                    'Тип дефекта (общий)': columns[2],
                    'Детальное описание дефекта (10% Упаковка)': columns[3],
                    'Детальное описание дефекта (20%)': columns[4],
                    'Детальное описание дефекта (50%)': columns[5],
                    'Детальное описание дефекта (100%)': columns[6],
                    'Диагностика в СЛЦ': columns[7]
                };
            }
            return null; // Возвращаем null для некорректных строк
        }).filter(row => row !== null); // Отфильтровываем некорректные строки

        // Заполнение выпадающего списка категорий
        const categorySelect = document.getElementById('categorySelect');
        // Очищаем существующие опции перед добавлением новых, если функция вызывается повторно
        categorySelect.innerHTML = '<option value="">Выберите категорию</option>';
        for (const key in categories) {
            const option = document.createElement('option');
            option.value = categories[key];
            option.textContent = categories[key];
            categorySelect.appendChild(option);
        }

        // Заполнение defectsSuggestions для автодополнения
        discountMatrix.forEach(row => {
            for (const key in row) {
                // Извлекаем только описание дефекта из скобок, если они есть, или берем все содержимое
                if (key.startsWith('Детальное описание дефекта') || key === 'Тип дефекта (общий)' || key === 'Диагностика в СЛЦ') {
                    // Разделяем по ";", затем очищаем каждый дефект и добавляем в набор
                    const descriptions = row[key].split(';').map(d => d.trim()).filter(d => d);
                    descriptions.forEach(desc => defectsSuggestions.add(desc));
                }
            }
        });

    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
}


// Функция для нормализации текста (приведение к нижнему регистру, удаление лишних пробелов)
function normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

// Функция для получения всех синонимов для данного термина, включая сам термин
function getAllSynonyms(term) {
    const normalizedTerm = normalizeText(term);
    let allRelatedTerms = new Set([normalizedTerm]); // Всегда включаем сам термин

    // Ищем термин как ключ в синонимах
    if (synonyms[normalizedTerm]) {
        synonyms[normalizedTerm].forEach(syn => allRelatedTerms.add(normalizeText(syn)));
    }

    // Ищем термин в значениях синонимов (как точное совпадение, так и частичное)
    for (const key in synonyms) {
        if (synonyms[key].some(s => normalizeText(s) === normalizedTerm || normalizeText(s).includes(normalizedTerm))) {
            allRelatedTerms.add(normalizeText(key)); // Добавляем ключ, если термин найден в его значениях
            synonyms[key].forEach(syn => allRelatedTerms.add(normalizeText(syn))); // Добавляем все синонимы этого ключа
        }
    }
    return Array.from(allRelatedTerms);
}

// Функция фильтрации результатов
function filterResults() {
    const categorySelect = document.getElementById('categorySelect');
    const defectSearchInput = document.getElementById('defectSearch');
    const resultsTable = document.getElementById('resultsTable');
    let selectedCategory = categorySelect.value; // Может быть пустым, если не выбрано
    const searchDefectText = normalizeText(defectSearchInput.value);

    let filteredData = discountMatrix;
    let initialCategoryFoundByProduct = false;

    // 1. Попытка определить категорию по названию товара в поисковом запросе, если категория не выбрана
    if (!selectedCategory && searchDefectText) {
        for (const productType in productTypeToCategoryMapping) {
            // Проверяем, содержит ли поисковый текст название продукта или его синонимы
            const productSynonyms = getAllSynonyms(productType);
            const foundProduct = productSynonyms.some(syn => searchDefectText.includes(syn));

            if (foundProduct) {
                selectedCategory = productTypeToCategoryMapping[productType];
                initialCategoryFoundByProduct = true;
                break;
            }
        }
    }

    // Фильтрация по категории, если она определена
    if (selectedCategory) {
        filteredData = filteredData.filter(row => row['Категория товара'] === selectedCategory);
        // Устанавливаем выбранную категорию в выпадающем списке, если она была определена по продукту
        if (initialCategoryFoundByProduct && categorySelect.value !== selectedCategory) {
            categorySelect.value = selectedCategory;
        }
    }


    // 2. Фильтрация по дефекту (учитывая синонимы)
    if (searchDefectText) {
        // Получаем все возможные синонимы для каждого слова в поисковом запросе
        // Важно: если в запросе несколько слов (например, "разбитый экран"),
        // мы хотим, чтобы они все присутствовали.
        const searchTerms = searchDefectText.split(' ').filter(term => term.length > 0)
                                          .map(term => getAllSynonyms(term))
                                          .flat();
        const uniqueSearchTerms = new Set(searchTerms);

        filteredData = filteredData.filter(row => {
            const relevantFields = [
                row['Тип дефекта (общий)'],
                row['Детальное описание дефекта (10% Упаковка)'],
                row['Детальное описание дефекта (20%)'],
                row['Детальное описание дефекта (50%)'],
                row['Детальное описание дефекта (100%)'],
                row['Диагностика в СЛЦ']
            ].filter(Boolean).join('; '); // Объединяем все релевантные поля в одну строку

            const normalizedRelevantFields = normalizeText(relevantFields);

            // Проверяем, что ВСЕ поисковые термины (или их синонимы) найдены в релевантных полях
            return Array.from(uniqueSearchTerms).every(searchTerm => {
                // Используем регулярное выражение для поиска целых слов или фраз, чтобы избежать частичных совпадений
                const regex = new RegExp(`\\b${searchTerm}\\b`, 'i');
                return regex.test(normalizedRelevantFields) || normalizedRelevantFields.includes(searchTerm);
            });
        });
    }

    // Отображение результатов
    displayResults(filteredData, selectedCategory);
}

// Функция отображения результатов
function displayResults(data, currentCategory) {
    const resultsTable = document.getElementById('resultsTable');
    let tableHtml = `
        <table class="min-w-full bg-white border border-gray-300">
            <thead>
                <tr>
                    <th class="py-2 px-4 border-b">Категория товара</th>
                    <th class="py-2 px-4 border-b">Системный классификатор</th>
                    <th class="py-2 px-4 border-b">Тип дефекта (общий)</th>
                    <th class="py-2 px-4 border-b">10% (Упаковка)</th>
                    <th class="py-2 px-4 border-b ${currentCategory === 'Комплектующие для ПК' ? 'hidden' : ''}">20%</th>
                    <th class="py-2 px-4 border-b ${currentCategory === 'Комплектующие для ПК' ? 'hidden' : ''}">50%</th>
                    <th class="py-2 px-4 border-b">100%</th>
                    <th class="py-2 px-4 border-b">Диагностика в СЛЦ</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (data.length === 0) {
        tableHtml += `
            <tr>
                <td colspan="8" class="text-center py-4">Нет данных, соответствующих вашему запросу.</td>
            </tr>
        `;
    } else {
        data.forEach(row => {
            tableHtml += `
                <tr class="hover:bg-gray-50">
                    <td class="py-3 px-4">${row['Категория товара'] || ''}</td>
                    <td class="py-3 px-4">${row['Системный классификатор'] || ''}</td>
                    <td class="py-3 px-4">${row['Тип дефекта (общий)'] || ''}</td>
                    <td class="py-3 px-4">${row['Детальное описание дефекта (10% Упаковка)'] || ''}</td>
                    <td class="py-3 px-4 ${currentCategory === 'Комплектующие для ПК' ? 'hidden' : ''}">${row['Детальное описание дефекта (20%)'] || ''}</td>
                    <td class="py-3 px-4 ${currentCategory === 'Комплектующие для ПК' ? 'hidden' : ''}">${row['Детальное описание дефекта (50%)'] || ''}</td>
                    <td class="py-3 px-4">${row['Детальное описание дефекта (100%)'] || ''}</td>
                    <td class="py-3 px-4">${row['Диагностика в СЛЦ'] || ''}</td>
                </tr>
            `;
        });
    }

    tableHtml += `
            </tbody>
        </table>
    `;
    resultsTable.innerHTML = tableHtml;
}

// Функции автодополнения (autocomplete) - без изменений, но убедимся, что они вызываются после загрузки данных
function autocomplete(inp, arr) {
    let currentFocus;
    inp.addEventListener("input", function(e) {
        let a, b, i, val = this.value;
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        for (i = 0; i < arr.length; i++) {
            // Используем normalizeText для сравнения, чтобы автодополнение работало с разными регистрами
            if (normalizeText(arr[i]).includes(normalizeText(val))) {
                b = document.createElement("DIV");
                // Подсвечиваем совпадающие части
                const startIndex = normalizeText(arr[i]).indexOf(normalizeText(val));
                const endIndex = startIndex + val.length;
                b.innerHTML = arr[i].substr(0, startIndex) + "<strong>" + arr[i].substr(startIndex, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(endIndex);
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    filterResults(); // Автоматически фильтруем при выборе
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    });

    inp.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode == 40) { // DOWN key
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // UP key
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // ENTER key
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            } else {
                // Если Enter нажат без выбора из списка, просто фильтруем по текущему вводу
                filterResults();
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


// Слушатели событий
document.addEventListener('DOMContentLoaded', () => {
    loadData().then(() => { // Убедимся, что данные загружены перед инициализацией автодополнения
        const categorySelect = document.getElementById('categorySelect');
        const defectSearchInput = document.getElementById('defectSearch');

        // Фильтрация результатов при изменении категории
        categorySelect.addEventListener('change', filterResults);

        // Применяем автодополнение к полю ввода дефекта
        // Важно: defectsSuggestions должны быть уникальными и отформатированными для пользователя,
        // но поиск должен быть гибким
        autocomplete(defectSearchInput, Array.from(defectsSuggestions));

        // Фильтрация результатов при вводе дефекта (с небольшой задержкой для лучшей производительности)
        let typingTimer;
        const doneTypingInterval = 300; // миллисекунды
        defectSearchInput.addEventListener('keyup', (e) => {
            // Исключаем Enter, так как он обрабатывается в autocomplete
            if (e.keyCode !== 13) {
                clearTimeout(typingTimer);
                typingTimer = setTimeout(filterResults, doneTypingInterval);
            }
        });
        
        // Дополнительная очистка поля при клике на крестик в некоторых браузерах
        defectSearchInput.addEventListener('search', function(e) {
            if (e.target.value === '') {
                filterResults();
            }
        });

        // Инициализация при первой загрузке
        filterResults();

    }).catch(error => {
        console.error("Initialization failed:", error);
    });
});

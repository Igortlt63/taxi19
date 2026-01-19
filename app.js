// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Данные пользователя из Telegram
const user = tg.initDataUnsafe?.user || {
    id: 123456789,
    first_name: 'Тест',
    username: 'test_user'
};

// Элементы DOM
const btnTest = document.getElementById('btn-test');
const btnOrder = document.getElementById('btn-order');
const resultDiv = document.getElementById('result');
const resultText = document.getElementById('result-text');

// Тест API
btnTest.addEventListener('click', async () => {
    try {
        resultText.textContent = 'Тестируем API...';
        resultDiv.classList.remove('hidden');
        
        const response = await fetch('http://localhost:3000/api/health');
        const data = await response.json();
        
        resultText.textContent = JSON.stringify(data, null, 2);
        
        tg.showAlert('✅ API работает!');
    } catch (error) {
        resultText.textContent = 'Ошибка: ' + error.message;
        tg.showAlert('❌ Ошибка подключения');
    }
});

// Создание заказа
btnOrder.addEventListener('click', async () => {
    const from = prompt('Откуда едем?', 'ул. Ленина, 10');
    const to = prompt('Куда едем?', 'ТРЦ Москва');
    const price = prompt('Ваша цена (руб.):', '300');
    
    if (!from || !to || !price) {
        tg.showAlert('❌ Заполните все поля');
        return;
    }
    
    try {
        resultText.textContent = 'Создаем заказ...';
        resultDiv.classList.remove('hidden');
        
        const orderData = {
            passenger_id: user.id,
            address_a: from,
            address_b: to,
            passenger_price: parseInt(price),
            point_a: '55.7558,37.6176',
            point_b: '55.7602,37.6185'
        };
        
        console.log('Отправляем:', orderData);
        
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        resultText.textContent = JSON.stringify(data, null, 2);
        
        if (data.success) {
            tg.showAlert(`✅ Заказ #${data.order?.id || ''} создан!`);
        } else {
            tg.showAlert('⚠️ Заказ создан в тестовом режиме');
        }
    } catch (error) {
        resultText.textContent = 'Ошибка: ' + error.message;
        tg.showAlert('❌ Ошибка создания заказа');
    }
});

// Регистрация пользователя при загрузке
async function registerUser() {
    try {
        const response = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                telegram_id: user.id,
                username: user.username || '',
                first_name: user.first_name || 'Пользователь',
                user_type: 'passenger'
            })
        });
        
        const data = await response.json();
        console.log('Пользователь зарегистрирован:', data);
    } catch (error) {
        console.log('Регистрация в тестовом режиме');
    }
}

// Запускаем регистрацию
registerUser();

// Показываем информацию о пользователе
console.log('Telegram пользователь:', user);
console.log('API сервер: http://localhost:3000');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== НАСТРОЙКА CORS ==========
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// ========== ПРОВЕРКА СЕРВЕРА ==========
console.log('🚀 Сервер запускается...');
console.log('Порт:', PORT);
console.log('Токен бота:', process.env.TOKEN ? 'Есть' : 'Нет');
console.log('База данных:', process.env.DATABASE_URL ? 'Настроена' : 'Не настроена');

// ========== ОСНОВНЫЕ МАРШРУТЫ ==========

// Главная страница
app.get('/', (req, res) => {
    res.json({
        status: 'OK',
        message: '🚕 Сервер такси работает!',
        time: new Date().toISOString(),
        endpoints: [
            'GET  /api/health - Проверка сервера',
            'GET  /api/test - Тест API',
            'POST /api/register - Регистрация',
            'POST /api/orders - Создание заказа',
            'GET  /api/orders/active - Активные заказы',
            'POST /api/proposals - Предложение цены'
        ]
    });
});

// Проверка здоровья
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        server: 'Taxi Backend',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        database: 'Тестовый режим'
    });
});

// Простой тест
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ API работает отлично!',
        data: {
            user: 'Тестовый пользователь',
            time: new Date().toISOString(),
            randomId: Math.floor(Math.random() * 1000)
        }
    });
});

// ========== БИЗНЕС-ЛОГИКА (ТЕСТОВЫЙ РЕЖИМ) ==========

// Регистрация пользователя
app.post('/api/register', (req, res) => {
    console.log('📝 Регистрация пользователя:', req.body);
    
    const userData = {
        id: Date.now(),
        ...req.body,
        created_at: new Date().toISOString(),
        rating: 5.0
    };
    
    res.json({
        success: true,
        message: 'Пользователь зарегистрирован',
        user: userData
    });
});

// Создание заказа
app.post('/api/orders', (req, res) => {
    console.log('📦 Создание заказа:', req.body);
    
    if (!req.body.passenger_id || !req.body.address_a || !req.body.address_b || !req.body.passenger_price) {
        return res.status(400).json({
            success: false,
            error: 'Не хватает обязательных полей: passenger_id, address_a, address_b, passenger_price'
        });
    }
    
    const orderData = {
        id: Math.floor(Math.random() * 9000) + 1000,
        ...req.body,
        status: 'pending',
        created_at: new Date().toISOString(),
        driver_id: null,
        final_price: null,
        first_name: req.body.first_name || 'Пассажир',
        username: req.body.username || ''
    };
    
    res.json({
        success: true,
        message: 'Заказ успешно создан!',
        order: orderData
    });
});

// Получение активных заказов
app.get('/api/orders/active', (req, res) => {
    const testOrders = [
        {
            id: 1001,
            passenger_price: 300,
            address_a: 'ул. Ленина, 10',
            address_b: 'ТРЦ "Москва"',
            first_name: 'Иван',
            username: 'ivan_123',
            created_at: new Date(Date.now() - 3600000).toISOString(),
            status: 'pending'
        },
        {
            id: 1002,
            passenger_price: 450,
            address_a: 'пр. Мира, 25',
            address_b: 'Аэропорт',
            first_name: 'Мария',
            username: 'maria_taxi',
            created_at: new Date(Date.now() - 1800000).toISOString(),
            status: 'pending'
        },
        {
            id: 1003,
            passenger_price: 280,
            address_a: 'ул. Центральная, 5',
            address_b: 'ЖД вокзал',
            first_name: 'Алексей',
            username: 'alex_driver',
            created_at: new Date().toISOString(),
            status: 'pending'
        }
    ];
    
    res.json(testOrders);
});

// Предложение цены от водителя
app.post('/api/proposals', (req, res) => {
    console.log('💰 Предложение цены:', req.body);
    
    if (!req.body.order_id || !req.body.driver_id || !req.body.proposed_price) {
        return res.status(400).json({
            success: false,
            error: 'Не хватает обязательных полей'
        });
    }
    
    res.json({
        success: true,
        message: 'Предложение отправлено пассажиру',
        proposal: {
            id: Math.floor(Math.random() * 9000) + 1000,
            ...req.body,
            status: 'pending',
            created_at: new Date().toISOString()
        }
    });
});

// ========== ЗАПУСК СЕРВЕРА ==========
app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log(`🚕 СЕРВЕР ЗАПУЩЕН УСПЕШНО!`);
    console.log(`👉 Локальный адрес: http://localhost:${PORT}`);
    console.log(`👉 Проверка API: http://localhost:${PORT}/api/test`);
    console.log('='.repeat(50));
    console.log('\n📋 Доступные эндпоинты:');
    console.log('  GET  /              - Главная страница');
    console.log('  GET  /api/health    - Проверка здоровья');
    console.log('  GET  /api/test      - Тест API');
    console.log('  POST /api/register  - Регистрация пользователя');
    console.log('  POST /api/orders    - Создание заказа');
    console.log('  GET  /api/orders/active - Активные заказы');
    console.log('  POST /api/proposals - Предложение цены');
    console.log('\n⚠️  Работаем в тестовом режиме (без базы данных)');
});

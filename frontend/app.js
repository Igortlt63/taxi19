// Основной файл Mini App - Local Taxi
class TaxiApp {
    constructor() {
        this.tg = null;
        this.isTelegram = false;
        this.user = null;
        this.currentScreen = 'home';
        this.currentOrder = null;
        this.serverUrl = 'http://localhost:3000';
        this.driverOffers = [];
        
        this.init();
    }
    
    // Инициализация приложения
    async init() {
        console.log('🚀 Инициализация Local Taxi App...');
        
        // Инициализация Telegram Web App
        this.initTelegram();
        
        // Инициализация интерфейса
        this.initUI();
        
        // Проверка сервера
        await this.checkServer();
        
        // Регистрация пользователя
        await this.registerUser();
        
        // Показываем приложение
        this.showApp();
    }
    
    // Инициализация Telegram
    initTelegram() {
        if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
            this.tg = window.Telegram.WebApp;
            this.isTelegram = true;
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            console.log('✅ Запущено в Telegram');
        } else {
            // Заглушка для браузера
            this.tg = {
                showAlert: (msg) => {
                    alert('Telegram: ' + msg);
                    console.log('Alert:', msg);
                },
                showConfirm: (msg) => {
                    return confirm('Telegram: ' + msg);
                },
                expand: () => console.log('Расширение экрана'),
                initDataUnsafe: {
                    user: {
                        id: Date.now(),
                        first_name: 'Тестовый',
                        username: 'test_user',
                        language_code: 'ru'
                    }
                }
            };
            console.log('⚠️ Запущено в браузере, используем заглушку');
        }
        
        this.user = this.tg.initDataUnsafe?.user || {
            id: Date.now(),
            first_name: 'Гость',
            username: 'guest_' + Date.now()
        };
    }
    
    // Инициализация интерфейса
    initUI() {
        // Приветствие пользователя
        document.getElementById('user-greeting').textContent = 
            `Привет, ${this.user.first_name}!`;
        
        // Инициализация всех кнопок
        this.initButtons();
        
        // Заполняем тестовые данные для быстрого теста
        document.getElementById('from-address').value = 'ул. Ленина, 10';
        document.getElementById('to-address').value = 'ТРЦ "Москва"';
        document.getElementById('price').value = '300';
    }
    
    // Инициализация всех кнопок
    initButtons() {
        // Кнопка создания заказа
        document.getElementById('btn-create-order').addEventListener('click', () => this.createOrder());
        
        // Кнопка просмотра заказов
        document.getElementById('btn-view-orders').addEventListener('click', () => this.showScreen('orders-list'));
        
        // Кнопка профиля
        document.getElementById('btn-profile').addEventListener('click', () => this.showScreen('profile'));
        
        // Кнопка отмены заказа
        document.getElementById('btn-cancel-order').addEventListener('click', () => this.cancelOrder());
        
        // Кнопка возврата на главную
        document.getElementById('btn-back-home').addEventListener('click', () => this.showScreen('home'));
        
        // Кнопка обновления списка заказов
        document.getElementById('btn-refresh-orders').addEventListener('click', () => this.loadAvailableOrders());
        
        // Кнопка возврата из списка заказов
        document.getElementById('btn-back-from-orders').addEventListener('click', () => this.showScreen('home'));
        
        // Кнопка возврата из профиля
        document.getElementById('btn-back-from-profile').addEventListener('click', () => this.showScreen('home'));
    }
    
    // Проверка сервера
    async checkServer() {
        try {
            const response = await fetch(`${this.serverUrl}/api/health`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            document.getElementById('server-status').textContent = '✅ Сервер: Работает';
            document.getElementById('server-status').style.color = '#00b894';
            
            console.log('✅ Сервер доступен:', data);
            return true;
        } catch (error) {
            document.getElementById('server-status').textContent = '🔴 Сервер: Недоступен';
            document.getElementById('server-status').style.color = '#e17055';
            
            console.error('❌ Сервер недоступен:', error);
            this.showNotification('⚠️ Сервер недоступен. Запустите backend сервер командой: npm start', 5000);
            return false;
        }
    }
    
    // Регистрация пользователя
    async registerUser() {
        try {
            const response = await fetch(`${this.serverUrl}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram_id: this.user.id,
                    username: this.user.username || '',
                    first_name: this.user.first_name,
                    user_type: 'passenger'
                })
            });
            
            const data = await response.json();
            console.log('✅ Пользователь зарегистрирован:', data);
            
            document.getElementById('user-status').textContent = `👤 ${this.user.first_name}`;
            document.getElementById('profile-info').textContent = 
                `${this.user.first_name} (пассажир) | ID: ${this.user.id}`;
                
        } catch (error) {
            console.log('⚠️ Регистрация в тестовом режиме');
            document.getElementById('user-status').textContent = '👤 Гость (тест)';
            document.getElementById('profile-info').textContent = 'Тестовый режим (сервер недоступен)';
        }
    }
    
    // Создание заказа
    async createOrder() {
        const from = document.getElementById('from-address').value.trim();
        const to = document.getElementById('to-address').value.trim();
        const price = document.getElementById('price').value.trim();
        
        if (!from || !to || !price) {
            this.showAlert('❌ Заполните все поля!');
            return;
        }
        
        const priceNum = parseInt(price);
        if (isNaN(priceNum) || priceNum < 50) {
            this.showAlert('❌ Минимальная цена - 50 рублей');
            return;
        }
        
        // Сохраняем текущий заказ
        this.currentOrder = {
            from,
            to,
            price: priceNum,
            status: 'waiting',
            id: Math.floor(Math.random() * 9000) + 1000
        };
        
        try {
            this.showNotification('📦 Создаем заказ...');
            
            const response = await fetch(`${this.serverUrl}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passenger_id: this.user.id,
                    address_a: from,
                    address_b: to,
                    passenger_price: priceNum,
                    point_a: '55.7558,37.6176',
                    point_b: '55.7602,37.6185',
                    first_name: this.user.first_name,
                    username: this.user.username || ''
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentOrder.id = data.order.id;
                this.showScreen('waiting');
                
                // Заполняем детали заказа
                document.getElementById('waiting-from').textContent = from;
                document.getElementById('waiting-to').textContent = to;
                document.getElementById('waiting-price').textContent = priceNum + ' ₽';
                document.getElementById('waiting-id').textContent = '#' + this.currentOrder.id;
                
                // Очищаем предыдущие предложения
                this.driverOffers = [];
                document.getElementById('no-offers').classList.remove('hidden');
                
                // Запускаем симуляцию предложений от водителей
                this.simulateDriverOffers();
                
                this.showAlert('✅ Заказ создан! Ожидайте предложений от водителей.');
            } else {
                this.showAlert('❌ Ошибка при создании заказа: ' + (data.error || 'Неизвестная ошибка'));
            }
            
        } catch (error) {
            console.error('Ошибка создания заказа:', error);
            
            // В тестовом режиме все равно показываем экран ожидания
            this.showScreen('waiting');
            
            document.getElementById('waiting-from').textContent = from;
            document.getElementById('waiting-to').textContent = to;
            document.getElementById('waiting-price').textContent = priceNum + ' ₽';
            document.getElementById('waiting-id').textContent = '#' + this.currentOrder.id;
            
            // Очищаем предыдущие предложения
            this.driverOffers = [];
            document.getElementById('no-offers').classList.remove('hidden');
            
            // Запускаем симуляцию
            this.simulateDriverOffers();
            
            this.showAlert('✅ Заказ создан (тестовый режим)');
        }
    }
    
    // Симуляция предложений от водителей
    simulateDriverOffers() {
        const offersContainer = document.getElementById('driver-offers');
        const noOffersText = document.getElementById('no-offers');
        
        // Очищаем старые предложения
        const oldOffers = offersContainer.querySelectorAll('.offer-item');
        oldOffers.forEach(offer => offer.remove());
        
        const drivers = [
            { id: 1, name: 'Алексей', car: 'Kia Rio', rating: 4.8, color: '#00b894' },
            { id: 2, name: 'Дмитрий', car: 'Hyundai Solaris', rating: 4.9, color: '#0984e3' },
            { id: 3, name: 'Иван', car: 'Toyota Camry', rating: 4.7, color: '#6c5ce7' },
            { id: 4, name: 'Михаил', car: 'Lada Vesta', rating: 4.5, color: '#fd79a8' },
            { id: 5, name: 'Сергей', car: 'Volkswagen Polo', rating: 4.6, color: '#fdcb6e' }
        ];
        
        // Создаем предложения с задержкой
        drivers.forEach((driver, index) => {
            setTimeout(() => {
                // Генерируем цену предложения (обычно немного выше или ниже запрошенной)
                const priceDiff = Math.floor(Math.random() * 100) - 40; // от -40 до +60
                const offerPrice = Math.max(50, this.currentOrder.price + priceDiff);
                
                // Создаем элемент предложения
                const offerElement = document.createElement('div');
                offerElement.className = 'offer-item';
                offerElement.style.borderLeftColor = driver.color;
                offerElement.innerHTML = `
                    <div>
                        <div class="offer-driver">
                            <strong>${driver.name}</strong> • ${driver.car} ⭐${driver.rating}
                        </div>
                        <div class="offer-price">${offerPrice} ₽</div>
                        <div style="font-size: 12px; color: #636e72;">
                            Предложил ${offerPrice > this.currentOrder.price ? 'выше' : 'ниже'} вашей цены
                        </div>
                    </div>
                    <div class="offer-actions">
                        <button class="btn btn-success btn-small btn-accept" 
                                data-price="${offerPrice}" 
                                data-driver="${driver.name}"
                                data-driver-id="${driver.id}">
                            <i class="fas fa-check"></i> Принять
                        </button>
                        <button class="btn btn-secondary btn-small btn-counter" 
                                data-price="${offerPrice}" 
                                data-driver="${driver.name}">
                            <i class="fas fa-handshake"></i> Предложить свою
                        </button>
                    </div>
                `;
                
                offersContainer.appendChild(offerElement);
                
                // Добавляем обработчики для новых кнопок
                const acceptBtn = offerElement.querySelector('.btn-accept');
                acceptBtn.addEventListener('click', (e) => {
                    const price = e.target.getAttribute('data-price');
                    const driverName = e.target.getAttribute('data-driver');
                    this.acceptOffer(price, driverName);
                });
                
                const counterBtn = offerElement.querySelector('.btn-counter');
                counterBtn.addEventListener('click', (e) => {
                    const driverName = e.target.getAttribute('data-driver');
                    this.makeCounterOffer(driverName);
                });
                
                // Сохраняем предложение
               

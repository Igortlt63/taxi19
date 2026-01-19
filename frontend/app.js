// Основной файл Mini App
class TaxiApp {
    constructor() {
        this.tg = null;
        this.isTelegram = false;
        this.user = null;
        this.currentScreen = 'home';
        this.currentOrder = null;
        this.serverUrl = 'http://localhost:3000';
        
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
        
        // Загружаем данные
        this.loadData();
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
                showAlert: (msg) => alert('Telegram: ' + msg),
                showConfirm: (msg) => confirm('Telegram: ' + msg),
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
            console.log('⚠️ Запущено в браузере');
        }
        
        this.user = this.tg.initDataUnsafe?.user || {
            id: Date.now(),
            first_name: 'Гость',
            username: 'guest'
        };
    }
    
    // Инициализация интерфейса
    initUI() {
        // Приветствие пользователя
        document.getElementById('user-greeting').textContent = 
            `Привет, ${this.user.first_name}!`;
        
        // Кнопки
        document.getElementById('btn-create-order').addEventListener('click', () => this.createOrder());
        document.getElementById('btn-view-orders').addEventListener('click', () => this.showScreen('orders-list'));
        document.getElementById('btn-profile').addEventListener('click', () => this.showNotification('Раздел в разработке'));
        document.getElementById('btn-cancel-order').addEventListener('click', () => this.cancelOrder());
        document.getElementById('btn-back-home').addEventListener('click', () => this.showScreen('home'));
        document.getElementById('btn-refresh-orders').addEventListener('click', () => this.loadAvailableOrders());
        document.getElementById('btn-back-from-orders').addEventListener('click', () => this.showScreen('home'));
        
        // Заполняем тестовые данные для быстрого теста
        document.getElementById('from-address').value = 'ул. Ленина, 10';
        document.getElementById('to-address').value = 'ТРЦ "Москва"';
        document.getElementById('price').value = '300';
    }
    
    // Проверка сервера
    async checkServer() {
        try {
            const response = await fetch(`${this.serverUrl}/api/health`);
            const data = await response.json();
            
            document.getElementById('server-status').textContent = '✅ Сервер: Работает';
            document.getElementById('server-status').style.color = '#00b894';
            
            console.log('✅ Сервер доступен:', data);
            return true;
        } catch (error) {
            document.getElementById('server-status').textContent = '🔴 Сервер: Недоступен';
            document.getElementById('server-status').style.color = '#e17055';
            
            console.error('❌ Сервер недоступен:', error);
            this.showNotification('Сервер недоступен. Запустите backend сервер.');
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
                `${this.user.first_name} (пассажир)`;
                
        } catch (error) {
            console.log('⚠️ Регистрация в тестовом режиме');
            document.getElementById('user-status').textContent = '👤 Гость (тест)';
        }
    }
    
    // Создание заказа
    async createOrder() {
        const from = document.getElementById('from-address').value;
        const to = document.getElementById('to-address').value;
        const price = document.getElementById('price').value;
        
        if (!from || !to || !price) {
            this.showAlert('Заполните все поля!');
            return;
        }
        
        if (parseInt(price) < 50) {
            this.showAlert('Минимальная цена - 50 рублей');
            return;
        }
        
        this.currentOrder = {
            from,
            to,
            price: parseInt(price),
            status: 'waiting'
        };
        
        try {
            this.showNotification('Создаем заказ...');
            
            const response = await fetch(`${this.serverUrl}/api/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passenger_id: this.user.id,
                    address_a: from,
                    address_b: to,
                    passenger_price: parseInt(price),
                    point_a: '55.7558,37.6176', // Москва для теста
                    point_b: '55.7602,37.6185'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentOrder.id = data.order.id;
                this.showScreen('waiting');
                
                // Заполняем детали заказа
                document.getElementById('waiting-from').textContent = from;
                document.getElementById('waiting-to').textContent = to;
                document.getElementById('waiting-price').textContent = price;
                
                // Симуляция предложений от водителей
                this.simulateDriverOffers();
                
                this.showAlert('Заказ создан! Ожидайте предложений от водителей.');
            } else {
                this.showAlert('Ошибка при создании заказа');
            }
            
        } catch (error) {
            console.error('Ошибка создания заказа:', error);
            
            // В тестовом режиме все равно показываем экран ожидания
            this.currentOrder.id = Math.floor(Math.random() * 1000) + 1000;
            this.showScreen('waiting');
            
            document.getElementById('waiting-from').textContent = from;
            document.getElementById('waiting-to').textContent = to;
            document.getElementById('waiting-price').textContent = price;
            
            this.simulateDriverOffers();
            this.showAlert('Заказ создан (тестовый режим)');
        }
    }
    
    // Симуляция предложений от водителей
    simulateDriverOffers() {
        const offersContainer = document.getElementById('driver-offers');
        offersContainer.innerHTML = '<h3><i class="fas fa-car"></i> Предложения водителей:</h3>';
        
        const drivers = [
            { name: 'Алексей', car: 'Kia Rio', rating: 4.8 },
            { name: 'Дмитрий', car: 'Hyundai Solaris', rating: 4.9 },
            { name: 'Иван', car: 'Toyota Camry', rating: 4.7 }
        ];
        
        // Очищаем существующие предложения
        const existingOffers = offersContainer.querySelectorAll('.offer-item');
        existingOffers.forEach(offer => offer.remove());
        
        // Создаем предложения
        drivers.forEach((driver, index) => {
            setTimeout(() => {
                const offerPrice = this.currentOrder.price + Math.floor(Math.random() * 100) - 30;
                
                const offerElement = document.createElement('div');
                offerElement.className = 'offer-item';
                offerElement.innerHTML = `
                    <div>
                        <div class="offer-driver">
                            <strong>${driver.name}</strong> • ${driver.car} ⭐${driver.rating}
                        </div>
                        <div class="offer-price">${offerPrice} ₽</div>
                    </div>
                    <div class="offer-actions">
                        <button class="btn btn-success" style="padding: 8px 12px;" 
                                onclick="app.acceptOffer(${offerPrice}, '${driver.name}')">
                            Принять
                        </button>
                    </div>
                `;
                
                offersContainer.appendChild(offerElement);
                
                // Уведомление о новом предложении
                if (index === 0) {
                    this.showNotification(`🎉 Первый водитель предложил ${offerPrice} ₽`);
                }
            }, index * 2000); // Каждые 2 секунды новое предложение
        });
    }
    
    // Принять предложение
    acceptOffer(price, driverName) {
        if (this.tg.showConfirm(`Принять предложение ${price} ₽ от ${driverName}?`)) {
            this.showAlert(`✅ Заказ принят! ${driverName} скоро будет на месте.`);
            
            // В реальном приложении здесь бы отправлялось на сервер
            setTimeout(() => {
                this.showScreen('home');
                this.showNotification('🚗 Водитель в пути к вам!');
            }, 2000);
        }
    }
    
    // Отменить заказ
    cancelOrder() {
        if (this.tg.showConfirm('Отменить заказ?')) {
            this.showAlert('Заказ отменен');
            this.showScreen('home');
        }
    }
    
    // Загрузка доступных заказов
    async loadAvailableOrders() {
        const container = document.getElementById('available-orders');
        container.innerHTML = '<p class="empty-state">Загрузка...</p>';
        
        try {
            const response = await fetch(`${this.serverUrl}/api/orders/active`);
            const orders = await response.json();
            
            if (!orders || orders.length === 0) {
                container.innerHTML = '<p class="empty-state">Нет доступных заказов</p>';
                return;
            }
            
            container.innerHTML = '';
            
            orders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.className = 'offer-item';
                orderElement.innerHTML = `
                    <div>
                        <div class="offer-driver">
                            <strong>${order.first_name || 'Пассажир'}</strong>
                            ${order.username ? `@${order.username}` : ''}
                        </div>
                        <div>${order.address_a} → ${order.address_b}</div>
                        <div class="offer-price">${order.passenger_price} ₽</div>
                    </div>
                    <div class="offer-actions">
                        <button class="btn btn-success" style="padding: 8px 12px;" 
                                onclick="app.takeOrder(${order.id}, ${order.passenger_price})">
                            Взять
                        </button>
                        <button class="btn btn-secondary" style="padding: 8px 12px;" 
                                onclick="app.makeOffer(${order.id})">
                            Предложить
                        </button>
                    </div>
                `;
                container.appendChild(orderElement);
            });
            
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            
            // Тестовые данные
            const testOrders = [
                { id: 1, passenger_price: 300, address_a: 'ул. Ленина', address_b: 'ТРЦ', first_name: 'Иван' },
                { id: 2, passenger_price: 450, address_a: 'пр. Мира', address_b: 'Аэропорт', first_name: 'Мария' }
            ];
            
            container.innerHTML = '';
            testOrders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.className = 'offer-item';
                orderElement.innerHTML = `
                    <div>
                        <div class="offer-driver">
                            <strong>${order.first_name}</strong>
                        </div>
                        <div>${order.address_a} → ${order.address_b}</div>
                        <div class="offer-price">${order.passenger_price} ₽</div>
                    </div>
                    <div class="offer-actions">
                        <button class="btn btn-success" style="padding: 8px 12px;" 
                                onclick="app.takeOrder(${order.id}, ${order.passenger_price})">
                            Взять
                        </button>
                    </div>
                `;
                container.appendChild(orderElement);
            });
        }
    }
    
    // Взять заказ (для водителя)
    takeOrder(orderId, price) {
        this.showAlert(`✅ Вы приняли заказ #${orderId} за ${price} ₽`);
        this.showScreen('home');
    }
    
    // Сделать предложение
    makeOffer(orderId) {
        const price = prompt('Ваше предложение (руб.):');
        if (price) {
            this.showAlert(`Предложение ${price} ₽ отправлено пассажиру`);
        }
    }
    
    // Показать экран
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        const targetScreen = document.getElementById(`screen-${screenName}`);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenName;
            
            if (screenName === 'orders-list') {
                this.loadAvailableOrders();
            }
        }
    }
    
    // Показать приложение
    showApp() {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
            document.getElementById('app').classList.remove('hidden');
        }, 300);
    }
    
    // Загрузка данных
    loadData() {
        // Здесь можно загружать дополнительные данные
    }
    
    // Вспомогательные методы
    showAlert(message) {
        if (this.isTelegram) {
            this.tg.showAlert(message);
        } else {
            alert(message);
        }
    }
    
    showNotification(message, duration = 3000) {
        const notification = document.getElementById('notification');
        const content = document.querySelector('.notification-content');
        
        content.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, duration);
    }
}

// Создаем глобальный объект для доступа из HTML
window.app = new TaxiApp();
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
                this.driverOffers.push({
                    id: driver.id,
                    name: driver.name,
                    car: driver.car,
                    rating: driver.rating,
                    price: offerPrice,
                    element: offerElement
                });
                
                // Скрываем текст "нет предложений"
                if (noOffersText) {
                    noOffersText.classList.add('hidden');
                }
                
                // Уведомление о новом предложении
                if (index === 0) {
                    this.showNotification(`🎉 ${driver.name} предложил ${offerPrice} ₽`);
                }
                
            }, (index + 1) * 2000); // Каждые 2 секунды новое предложение
        });
    }
    
    // Принять предложение водителя
    acceptOffer(price, driverName) {
        const confirmMessage = `Принять предложение ${price} ₽ от ${driverName}?`;
        
        if (this.isTelegram) {
            if (this.tg.showConfirm(confirmMessage)) {
                this.processAcceptedOffer(price, driverName);
            }
        } else {
            if (confirm(confirmMessage)) {
                this.processAcceptedOffer(price, driverName);
            }
        }
    }
    
    // Обработка принятого предложения
    processAcceptedOffer(price, driverName) {
        this.showAlert(`✅ Заказ принят! ${driverName} скоро будет на месте.`);
        
        // Отмечаем заказ как принятый
        this.currentOrder.status = 'accepted';
        this.currentOrder.driver = driverName;
        this.currentOrder.finalPrice = price;
        
        // В реальном приложении здесь бы отправлялось на сервер
        // fetch(`${this.serverUrl}/api/orders/${this.currentOrder.id}/accept`, { ... })
        
        // Показываем уведомление и возвращаем на главный экран
        setTimeout(() => {
            this.showScreen('home');
            this.showNotification(`🚗 ${driverName} выехал к вам! Следите за перемещением в приложении.`);
            this.currentOrder = null;
        }, 2000);
    }
    
    // Предложить свою цену в ответ
    makeCounterOffer(driverName) {
        const userPrice = prompt(`Ваша цена для ${driverName} (руб.):`, this.currentOrder.price);
        
        if (userPrice && !isNaN(parseInt(userPrice))) {
            const priceNum = parseInt(userPrice);
            if (priceNum < 50) {
                this.showAlert('❌ Минимальная цена - 50 рублей');
                return;
            }
            
            this.showAlert(`📩 Ваше предложение ${priceNum} ₽ отправлено ${driverName}`);
            
            // В реальном приложении здесь бы отправлялось на сервер
            // fetch(`${this.serverUrl}/api/proposals`, { ... })
        }
    }
    
    // Отменить заказ
    cancelOrder() {
        const confirmMessage = 'Вы уверены, что хотите отменить заказ?';
        
        if (this.isTelegram) {
            if (this.tg.showConfirm(confirmMessage)) {
                this.processOrderCancellation();
            }
        } else {
            if (confirm(confirmMessage)) {
                this.processOrderCancellation();
            }
        }
    }
    
    // Обработка отмены заказа
    processOrderCancellation() {
        this.showAlert('❌ Заказ отменен');
        
        // В реальном приложении здесь бы отправлялось на сервер
        // fetch(`${this.serverUrl}/api/orders/${this.currentOrder.id}/cancel`, { ... })
        
        // Возвращаем на главный экран
        this.showScreen('home');
        this.currentOrder = null;
        
        // Очищаем форму
        document.getElementById('from-address').value = '';
        document.getElementById('to-address').value = '';
        document.getElementById('price').value = '';
    }
    
    // Загрузка доступных заказов (для водителей)
    async loadAvailableOrders() {
        const container = document.getElementById('available-orders');
        container.innerHTML = '<p class="empty-state">Загрузка заказов...</p>';
        
        try {
            const response = await fetch(`${this.serverUrl}/api/orders/active`);
            
            if (!response.ok) {
                throw new Error(`HTTP ошибка: ${response.status}`);
            }
            
            const orders = await response.json();
            
            if (!orders || orders.length === 0) {
                container.innerHTML = '<p class="empty-state">Нет доступных заказов в данный момент</p>';
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
                        <div style="margin: 8px 0;">
                            <i class="fas fa-map-marker-alt"></i> ${order.address_a}<br>
                            <i class="fas fa-flag"></i> ${order.address_b}
                        </div>
                        <div class="offer-price">${order.passenger_price} ₽</div>
                        <div style="font-size: 12px; color: #636e72;">
                            Заказ #${order.id} • ${new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </div>
                    <div class="offer-actions">
                        <button class="btn btn-success btn-small btn-take-order" 
                                data-order-id="${order.id}" 
                                data-price="${order.passenger_price}">
                            <i class="fas fa-car"></i> Взять
                        </button>
                        <button class="btn btn-secondary btn-small btn-make-offer" 
                                data-order-id="${order.id}">
                            <i class="fas fa-handshake"></i> Предложить
                        </button>
                    </div>
                `;
                
                container.appendChild(orderElement);
                
                // Добавляем обработчики для кнопок
                const takeBtn = orderElement.querySelector('.btn-take-order');
                takeBtn.addEventListener('click', (e) => {
                    const orderId = e.target.getAttribute('data-order-id');
                    const price = e.target.getAttribute('data-price');
                    this.takeOrder(orderId, price);
                });
                
                const offerBtn = orderElement.querySelector('.btn-make-offer');
                offerBtn.addEventListener('click', (e) => {
                    const orderId = e.target.getAttribute('data-order-id');
                    this.makeOfferToPassenger(orderId);
                });
            });
            
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            
            // Тестовые данные при ошибке
            container.innerHTML = '';
            const testOrders = [
                { id: 1001, passenger_price: 300, address_a: 'ул. Ленина, 10', address_b: 'ТРЦ "Москва"', first_name: 'Иван' },
                { id: 1002, passenger_price: 450, address_a: 'пр. Мира, 25', address_b: 'Аэропорт', first_name: 'Мария' }
            ];
            
            testOrders.forEach(order => {
                const orderElement = document.createElement('div');
                orderElement.className = 'offer-item';
                orderElement.innerHTML = `
                    <div>
                        <div class="offer-driver">
                            <strong>${order.first_name}</strong>
                        </div>
                        <div style="margin: 8px 0;">
                            <i class="fas fa-map-marker-alt"></i> ${order.address_a}<br>
                            <i class="fas fa-flag"></i> ${order.address_b}
                        </div>
                        <div class="offer-price">${order.passenger_price} ₽</div>
                    </div>
                    <div class="offer-actions">
                        <button class="btn btn-success btn-small btn-take-test" 
                                data-order-id="${order.id}" 
                                data-price="${order.passenger_price}">
                            <i class="fas fa-car"></i> Взять
                        </button>
                    </div>
                `;
                
                container.appendChild(orderElement);
                
                const takeBtn = orderElement.querySelector('.btn-take-test');
                takeBtn.addEventListener('click', (e) => {
                    const orderId = e.target.getAttribute('data-order-id');
                    const price = e.target.getAttribute('data-price');
                    this.takeOrder(orderId, price);
                });
            });
        }
    }
    
    // Взять заказ (для водителя)
    takeOrder(orderId, price) {
        const confirmMessage = `Взять заказ #${orderId} за ${price} ₽?`;
        
        if (this.isTelegram) {
            if (this.tg.showConfirm(confirmMessage)) {
                this.processTakenOrder(orderId, price);
            }
        } else {
            if (confirm(confirmMessage)) {
                this.processTakenOrder(orderId, price);
            }
        }
    }
    
    // Обработка взятого заказа
    processTakenOrder(orderId, price) {
        this.showAlert(`✅ Вы приняли заказ #${orderId} за ${price} ₽`);
        
        // В реальном приложении здесь бы отправлялось на сервер
        // fetch(`${this.serverUrl}/api/orders/${orderId}/take`, { ... })
        
        // Возвращаем на главный экран
        this.showScreen('home');
        this.showNotification(`🚕 Вы взяли заказ #${orderId}. Свяжитесь с пассажиром для уточнения деталей.`);
    }
    
    // Сделать предложение пассажиру
    makeOfferToPassenger(orderId) {
        const price = prompt('Ваше предложение (руб.):');
        
        if (price && !isNaN(parseInt(price))) {
            const priceNum = parseInt(price);
            if (priceNum < 50) {
                this.showAlert('❌ Минимальная цена - 50 рублей');
                return;
            }
            
            this.showAlert(`📩 Предложение ${priceNum} ₽ отправлено пассажиру`);
            
            // В реальном приложении здесь бы отправлялось на сервер
            // fetch(`${this.serverUrl}/api/proposals`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({
            //         order_id: orderId,
            //         driver_id: this.user.id,
            //         proposed_price: priceNum
            //     })
            // });
        }
    }
    
    // Показать экран
    showScreen(screenName) {
        // Скрываем все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        // Показываем выбранный экран
        const targetScreen = document.getElementById(`screen-${screenName}`);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenName;
            
            // Загружаем данные если нужно
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
            this.showNotification('🚕 Local Taxi готов к работе!', 2000);
        }, 300);
    }
    
    // Вспомогательные методы
    showAlert(message) {
        if (this.isTelegram) {
            this.tg.showAlert(message);
        } else {
            alert(message);
        }
        console.log('Alert:', message);
    }
    
    showNotification(message, duration = 3000) {
        const notification = document.getElementById('notification');
        const content = document.querySelector('.notification-content');
        
        if (!notification || !content) return;
        
        content.textContent = message;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, duration);
        
        console.log('Notification:', message);
    }
}

// Создаем и запускаем приложение
document.addEventListener('DOMContentLoaded', () => {
    window.taxiApp = new TaxiApp();
});

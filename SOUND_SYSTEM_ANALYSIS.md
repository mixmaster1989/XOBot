# 🔊 Техническая документация звуковой системы XOBot

## 📋 Общая архитектура

### Файловая структура
```
webapp/
├── assets/
│   └── sound.js          # SoundManager класс - генератор звуков
├── app.js                # Вызовы звуков при игровых событиях
├── index.html            # Подключение sound.js
└── telegram-init.js      # Инициализация Telegram WebApp
```

## 🎵 Как работает звук

### 1. Технология: Web Audio API
- **НЕ используются файлы** (MP3, WAV и т.д.)
- Звук **генерируется в браузере** через `OscillatorNode`
- Создаются синусоидальные волны на разных частотах

### 2. Класс SoundManager (`/webapp/assets/sound.js`)

```javascript
class SoundManager {
    constructor() {
        this.audioContext = null;  // AudioContext создается динамически
        this.enabled = true;       // Состояние: вкл/выкл
    }
}
```

#### Методы генерации звука:
- `playClick()` - 800 Hz, 0.15 сек, громкость 0.5
- `playWin()` - мелодия C-E-G-C (523→659→784→1046 Hz)
- `playLose()` - мелодия G-E-C (784→659→523 Hz)
- `playDraw()` - двойная нота E-E (659 Hz)

### 3. Инициализация AudioContext

**Критически важно:** AudioContext можно создать **только после пользовательского взаимодействия**!

#### Текущая схема инициализации:
```javascript
// Шаг 1: При загрузке страницы (sound.js:13-28)
window.addEventListener('click', initAudio, { once: true });
window.addEventListener('touchstart', initAudio, { once: true });
window.addEventListener('touchend', initAudio, { once: true });
window.addEventListener('keydown', initAudio, { once: true });

// Шаг 2: При нажатии "Начать игру" (app.js:67-73)
if (!window.soundManager.audioContext) {
    window.soundManager.audioContext = new AudioContext();
}

// Шаг 3: При первом клике по клетке (sound.js:78-85)
if (!this.audioContext) {
    this.audioContext = new AudioContext();
}
```

### 4. Вызовы звуков в игре (`app.js`)

```javascript
// При клике по клетке (строка 110)
window.soundManager.playClick();

// При победе (строка 177-179)
window.soundManager.playWin();

// При проигрыше (строка 194-196)
window.soundManager.playLose();

// При ничьей (строка 203-205)
window.soundManager.playDraw();
```

## ✅ Где звук РАБОТАЕТ

### 1. Обычный браузер (Chrome, Firefox, Safari)
- ✅ Открыто напрямую: `https://контентбот.рф/webapp/`
- ✅ AudioContext создается при первом клике
- ✅ Все звуки играют корректно
- ✅ Громкость достаточная (0.5-0.6)

**Почему работает:**
- Прямой доступ к Web Audio API
- Нет ограничений на autoplay
- Пользовательское взаимодействие (клик) разрешает звук

## ❌ Где звук НЕ работает

### 1. Telegram WebApp (встроенный браузер)
- ❌ Звук не играет при открытии через бота
- ✅ Код выполняется без ошибок (`Sound played successfully!` в логах)
- ✅ AudioContext создается успешно
- ❌ Но звук не слышен

**Почему НЕ работает:**

#### Причина 1: Autoplay Policy в WebView
Telegram использует WebView (встроенный браузер), который имеет **строгие ограничения autoplay**:
- WebView может блокировать Web Audio API даже после user interaction
- Политика безопасности в WebView строже чем в обычном браузере
- Chrome WebView требует "gesture" (жест пользователя), но не все события считаются жестом

#### Причина 2: AudioContext suspended state
```javascript
// AudioContext может быть в состоянии "suspended"
console.log(audioContext.state); // может быть "suspended" вместо "running"
```

Когда AudioContext создается, он может быть в состоянии `suspended` и требует явного `.resume()`:
```javascript
await audioContext.resume();
```

#### Причина 3: Telegram WebApp iframe sandbox
- Telegram WebApp открывается в `<iframe>`
- У iframe могут быть ограничения `sandbox`
- Необходим атрибут `allow="autoplay"` или `sandbox="allow-scripts allow-same-origin"`

#### Причина 4: Неправильный user gesture
События которые НЕ считаются user gesture в WebView:
- Программные клики
- События dispatched через JavaScript
- Некоторые touch события

События которые ДОЛЖНЫ работать:
- Физический tap/click пользователем
- Submit формы
- Keypress

## 🔍 Возможные решения

### Решение 1: Явный resume() AudioContext
```javascript
// В startGame() и перед каждым playNote()
if (audioContext.state === 'suspended') {
    await audioContext.resume();
}
```

### Решение 2: Использовать HTMLAudioElement вместо Web Audio API
```javascript
// Вместо OscillatorNode использовать Audio()
const beep = new Audio('data:audio/wav;base64,...'); // inline WAV
beep.play();
```

### Решение 3: Требовать явное разрешение от пользователя
```javascript
// Добавить кнопку "Включить звук"
<button onclick="initSound()">🔊 Включить звук</button>
```

### Решение 4: Проверка Media Engagement Index (MEI)
Chrome отслеживает "вовлеченность" пользователя. В Telegram WebView MEI может быть низким.

### Решение 5: Использовать Telegram Haptic Feedback вместо звука
```javascript
// Для Telegram можно использовать вибрацию
window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
```

## 📊 Debugging чеклист

### Проверить в консоли Telegram WebApp:

```javascript
// 1. Проверить состояние AudioContext
console.log('AudioContext state:', window.soundManager.audioContext.state);
// Должно быть "running", не "suspended"

// 2. Проверить поддержку Web Audio API
console.log('AudioContext available:', 'AudioContext' in window);

// 3. Проверить есть ли ошибки при создании
try {
    const ctx = new AudioContext();
    console.log('AudioContext created:', ctx);
    console.log('State:', ctx.state);
} catch (e) {
    console.error('AudioContext error:', e);
}

// 4. Попробовать resume()
if (window.soundManager.audioContext.state === 'suspended') {
    window.soundManager.audioContext.resume().then(() => {
        console.log('AudioContext resumed!');
    });
}

// 5. Проверить разрешения
navigator.permissions.query({name: 'microphone'}).then(result => {
    console.log('Microphone permission:', result.state);
});
```

## 🎯 Рекомендации для deep research

### 1. Проверить Telegram WebApp документацию
- Есть ли ограничения на Web Audio API в Telegram WebApp?
- Какие sandbox атрибуты использует Telegram для iframe?

### 2. Сравнить с рабочими примерами
- Найти другие Telegram боты которые воспроизводят звук
- Посмотреть как они это делают

### 3. Тестировать разные устройства
- iOS vs Android (WebView разные)
- Telegram Desktop vs Mobile

### 4. Проверить альтернативные библиотеки
- Howler.js - популярная библиотека для звука
- Tone.js - более продвинутая для Web Audio API
- SoundJS - CreateJS suite

### 5. Fallback стратегии
- Если Web Audio API не работает → использовать HTML5 Audio
- Если Audio не работает → использовать Haptic Feedback
- Показать визуальную анимацию вместо звука

## 📝 Текущий статус

| Платформа | Звук работает | AudioContext создается | Примечание |
|-----------|---------------|------------------------|------------|
| Chrome Desktop | ✅ Да | ✅ Да | Работает идеально |
| Firefox Desktop | ✅ Да | ✅ Да | Работает идеально |
| Safari Desktop | ✅ Да | ✅ Да | Работает идеально |
| Telegram WebApp iOS | ❌ Нет | ✅ Да | Context suspended? |
| Telegram WebApp Android | ❌ Нет | ✅ Да | Context suspended? |
| Telegram Desktop | ❓ Не тестировалось | ❓ | Нужно проверить |

## 🔧 Файлы для анализа

1. `/home/user1/XOBot/webapp/assets/sound.js` - SoundManager класс
2. `/home/user1/XOBot/webapp/app.js` - Вызовы звуков (строки 67-73, 110, 177-205)
3. `/home/user1/XOBot/webapp/index.html` - Порядок загрузки скриптов (строка 176)

## 🆘 Быстрый фикс для тестирования

Добавить явный resume в каждый звуковой метод:

```javascript
async playClick() {
    if (!this.enabled || !this.audioContext) return;
    
    // ФИКС: Resume если suspended
    if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
    }
    
    this.playNote(800, 0.15, 'sine', 0.5);
}
```

---

**Вывод:** Проблема скорее всего в том что AudioContext создается в состоянии `suspended` в Telegram WebView и требует явного `.resume()` перед воспроизведением звука.

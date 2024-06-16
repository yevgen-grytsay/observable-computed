# Мої експерименти з ECMAScript 6 Proxy

## Path Detection Proxy
Визначає шлях до поля, в яке здійснюється запис.
```javascript
const tree = {
  id: 100,
  settings: {
    foo: 'bar'
  },
  children: [
    {
      id: 1,
      name: 'Child #1'
    }
  ],
  callback: () => {}
}
const listener = (path) => {}

const proxy = createPathProxy(tree, listener)

proxy.id = 2 // path: id
proxy.settings.foo = 'new bar' // path: settings.foo

// Array
proxy.children[0].id = 100 // path: children.0.id
proxy.children[0] = {id: 2, name: 'Child #2'} // path: children.0
proxy.children.push({id: 2, name: 'Child #2'}) // path: children.1, children.length
proxy.children[0].name += 'upd' // path: children.0.name

// non-existing property
proxy.noSuchProperty // path: noSuchProperty
proxy.settings.noSuchProperty // path: settings.noSuchProperty
proxy.children[0].noSuchProperty = 10 // path: children.0.noSuchProperty

proxy.callback.prototype = {} // ignored
```


Якщо записуємо у проперті якийсь об'єкт, 
то проксі не включає до результуючого шляху `path` внутрішні шляхи цього об'єкта.
```javascript
const tree = {
  settings: {
    font: {
      size: 12,
      family: 'monospaced',
    }
  }
}
const proxy = createPathProxy(tree, listener)

proxy.settings = {
  font: {
    size: 100,
    family: 'sans-serif',
  }
}
// Отримаємо такий шлях: settings
// Але не такий: settings.font.size, settings.font.family

// Те саме з масивами
proxy.children[0] = {id: 2, name: 'Child #2'} // path: children.0
// Отримаємо такий шлях: children.0
// Але не такий: children.0.id, children.0.name
```

### Notes
Якби можна було створювати кілька проксі, це дало б можливість вішати більше ніж одного слухача на об'єкт.

### Обмеження
1. Не можна створити більше ніж одну проксі для певного об'єкта. Причина: я не знаю, чи правильно це працюватиме.
2. Виходячи з п.1, оскільки будь-який об'єкт може мати тільки одну проксі, то і слухач для кожного об'єкта може бути тільки один.
3. Не можна завернути проксі у проксі. Причина: я не знаю, чи правильно це працюватиме. Потенційно це могло б дати можливість мати кілька слухачів для
   одного об'єкта, але боюся, що це занадто ускладнює бібліотеку. Від цього буде тільки більше помилок і годин дебагу.
   Як варіант, зробити параметр `listener` необов'язковим, і якщо перший параметр (`object`) є зареєстрованою проксі, то повертати його як є.
4. Не можна використовувати `Symbol` як ім'я поля.

### TODO
- Розібратися з повідомленням `Starting a new path stack but the tack is not empty`. Перед стартом нового стеку не очищається старий.
  Це або баг, і його треба пофіксити, або це не баг, і треба прибрати повідомлення.
- зараз імовірно не можна мати кілька проксі, тому що у них спільний стан (`pathStack`, `contextObj`).
  Дослідити це питання. Зробити так, щоб можна було мати кілька проксі.
- подумати, коли сетимо в проперті якийсь об'єкт, чи треба детектити зміни у цьому об'єкті
  й інформувати слухачів. Може це зайве і краще залишити як є.
- надсилати слухачу нове і старе значення зміненої проксі.
- додати тести, які б працювали з одним і тим же об'єктом проксі, щоб перевірити,
  чи не накопичуються помилки.

---
## Deep Observable
Мої експерименти з `Proxy`.

```javascript
const nodes = makeDeepObservable([])

computed(() => {
  console.log(nodes)
})

nodes.push({
  id: 1,
  name: 'Node 1',
})
```

### TODO
- Подумати, може варто ігнорувати доступ до нерелевантних методів, типу `forEach`, `map` тощо.
- Якщо викликати колбеки синхронно із функції `set` (`Proxy`), то вони не бачать змін. Треба розібратися, можливо я чогось не розумію.

# observable-computed

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

## TODO
- Подумати, може варто ігнорувати доступ до нерелевантних методів, типу `forEach`, `map` тощо.
- Якщо викликати колбеки синхронно із функції `set` (`Proxy`), то вони не бачать змін. Треба розібратися, можливо я чогось не розумію.

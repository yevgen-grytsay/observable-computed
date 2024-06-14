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

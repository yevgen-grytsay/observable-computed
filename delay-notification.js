const handlerQueue = new Set()
const callHandlers = () => {
    handlerQueue.forEach(handler => handler())
    handlerQueue.clear()
}
/*const listener = (obj) => {
    console.log({id: obj.id, name: obj.name})
}*/


const proxyHandlers = {
    set(target, p, newValue, receiver) {
        const result = Reflect.set(target, p, newValue, receiver)

        handlerQueue.add(listener)
        Promise.resolve().then(callHandlers)
        console.log('set')
        /*Promise.resolve().then(() => {
            listener(receiver)
        })*/

        // setTimeout()

        return result
    }
};

const obj = new Proxy({id: 1, name: 'initial'}, proxyHandlers)

const listener = () => {
    console.log("#\n# Delayed Notification\n#")
    console.log({id: obj.id, name: obj.name})
}


/**
 * Listener буде викликано тільки один раз після зміни кількох полів
 */
obj.id = 2
obj.name = 'name #2'

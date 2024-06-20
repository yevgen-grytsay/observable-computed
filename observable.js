
const rawToProxy = new WeakMap()
const proxyToRaw = new WeakMap()
let propAccessStackStack = []
/*const debug = {
    computedMap: new Map()
}*/

const startNewPropAccessStack = () => {
    propAccessStackStack.push([])
}

const endPropAccessStack = () => {
    return Array.from(propAccessStackStack.pop())
}

const pushToPropAccessStack = ({target, key}) => {
    if (proxyToRaw.has(target)) {
        target = proxyToRaw.get(target)
    }
    if (propAccessStackStack.length === 0) {
        return
    }
    propAccessStackStack[propAccessStackStack.length - 1].push({target, key})
}

let computedByTarget = new WeakMap()

let handlerQueue = new Set()
const enqueueComputed = (target, p) => {
    // if target is proxy
    if (proxyToRaw.has(target)) {
        target = proxyToRaw.get(target)
    }

    const computedByKey = computedByTarget.get(target)
    if (!computedByKey) {
        return
    }

    const computed = computedByKey.get(p)
    if (!computed) {
        return
    }

    handlerQueue = new Set([...handlerQueue, ...computed])
}
const handleComputedQueue = () => {
    const queue = handlerQueue
    handlerQueue = new Set()

    queue.forEach(fnc => {
        runComputed(fnc)
    })
}

/**
 * @param {object} target
 * @param {string|symbol} p
 */
const registerAccess = (target, p) => {
    // if target is proxy
    if (proxyToRaw.has(target)) {
        target = proxyToRaw.get(target)
    }

    let computedByKey = computedByTarget.get(target)
    if (!computedByKey) {
        computedByKey = new Map()
    }

    let computed = computedByKey.get(p)
    if (!computed) {
        computed = new Set()
    }

    computedByKey.set(p, computed)
    computedByTarget.set(target, computedByKey)

    // computed.forEach(cmp => {
    //     const targets = debug.computedMap.get(cmp)
    //     if (targets) {
    //         targets.push({target, p})
    //     }
    // })
    // console.log({debug})
}

let observerStackStack = []
function startNewObserverStack() {
    observerStackStack.push([])
}

function endObserverStack() {
    return observerStackStack.pop()
}

function pushToObserverStack(fnc) {
    if (observerStackStack.length === 0) {
        return
    }
    observerStackStack[observerStackStack.length - 1].push(fnc)
}

/**
 * @template T
 *
 * @param {T} value
 * @returns {Proxy<T>|T}
 */
const makeAndRegisterObservable = (value) => {
    if (typeof value !== 'object' || value === null) {
        return value
    }

    let proxy = rawToProxy.get(value)
    if (!proxy) {
        proxy = makeObservable(value)
        rawToProxy.set(value, proxy)
    }
    proxyToRaw.set(proxy, value)

    return proxy
}

const proxyHandler = {
    get(target, p, receiver) {
        let value = Reflect.get(target, p, receiver)

        value = makeAndRegisterObservable(value)

        // registerAccess and pushToPropAccessStack must be called after makeAndRegisterObservable
        registerAccess(target, p)
        pushToPropAccessStack({
            target,
            key: p,
        })

        return value
    },
    set(target, p, newValue, receiver) {
        const result = Reflect.set(target, p, newValue, receiver)

        enqueueComputed(target, p)
        Promise.resolve().then(handleComputedQueue)

        return result
    },
    has(target, p) {
        const result = Reflect.has(target, p)

        registerAccess(target, p)
        pushToPropAccessStack({
            target,
            key: p,
        })

        return result
    }
};

/**
 * @template T
 *
 * @param {T} obj
 * @returns {Proxy<T>|T}
 */
export function makeObservable(obj) {
    return new Proxy(obj, proxyHandler)
}

/**
 * @param {function} fnc
 */
const runComputed = (fnc) => {
    fnc.nestedObservers = fnc.nestedObservers || []
    fnc.nestedObservers.forEach(nestedFnc => {
        nestedFnc.cleaners.forEach(clean => {
            const msg = `running ${fnc.role} child's cleaners`
            console.log(msg)
            clean()
        })
    })
    fnc.nestedObservers = []

    pushToObserverStack(fnc)

    startNewPropAccessStack()
    startNewObserverStack()
    fnc()
    const childObservers = endObserverStack()
    const dependencies = endPropAccessStack()

    fnc.nestedObservers = childObservers

    dependencies.forEach(({target, key}) => {
        const computedByKey = computedByTarget.get(target) || new Map()
        const computedSet = computedByKey.get(key) || new Set()

        computedSet.add(fnc)

        computedByKey.set(key, computedSet)

        computedByTarget.set(target, computedByKey)

        fnc.cleaners = fnc.cleaners || []
        fnc.cleaners.push(() => {
            console.log(`delete listener for ${fnc.role}`)
            computedSet.delete(fnc)
        })

        /*let targets = debug.computedMap.get(fnc)
        if (!targets) {
            targets = new Map()
        }
        let props = targets.get(target)
        if (!props) {
            props = new Set()
        }
        props.add(key)

        targets.set(target, props)
        debug.computedMap.set(fnc, targets)
        console.log({computedMap: debug.computedMap})*/
    })
}

/**
 * @param {function} fnc
 */
export function makeObserver(fnc) {
    runComputed(fnc)
}

export function handleQueue() {
    handleComputedQueue()
}

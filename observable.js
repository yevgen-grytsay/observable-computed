
const rawToProxy = new WeakMap()
const proxyToRaw = new WeakMap()
let propAccessStackStack = []
/*const debug = {
    computedMap: new Map()
}*/

const oStack = {
    stack: [],
    store: [],
    push(descriptor) {
        this.stack.push(descriptor)
    },
    pop() {
        const descriptor = this.stack.pop()
        this.store.push(descriptor)
    }
}
function oPush({}) {
    oStack.p
}

export const debug = {
    byTarget: new Map(),
    start() {
        this.byTarget = new Map()
    },
    add(fnc, target, key) {
        let byKey = this.byTarget.get(target)
        if (!byKey) {
            byKey = new Map()
        }

        let handlers = byKey.get(key)
        if (!handlers) {
            handlers = new Set()
        }

        handlers.add(fnc)
        byKey.set(key, handlers)
        this.byTarget.set(target, byKey)
    },
    /*add(fnc, target, key) {
        let targets = this.computedMap.get(fnc)
        if (!targets) {
            targets = new Map()
        }
        let props = targets.get(target)
        if (!props) {
            props = new Set()
        }
        props.add(key)

        targets.set(target, props)
        this.computedMap.set(fnc, targets)
        // console.log({computedMap: debug.computedMap})
    },*/
    toString() {
        const result = []
        this.byTarget.forEach((byKey, target) => {
            const parts = []
            byKey.forEach((handlers, key) => {
                const handlerIds = Array.from(handlers.values()).map(h => h._id || h.role)
                parts.push(`${key}=${handlerIds.join(',')}`)
            })
            result.push(`${JSON.stringify(target)}: ${parts.join('; ')}`)
        })

        return result.join("\n")
    }
}

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

let unregisteredSet = new Set() // todo make weak
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
        if (unregisteredSet.has(fnc)) {
            console.log(`skip unregistered fnc: ${fnc.role}`)
            return
        }
        makeObserver(fnc)
        // runComputed(fnc) // todo maybe run makeObserver instead
    })

    unregisteredSet = new Set()
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
let stackLevel = -1
function startNewObserverStack() {
    if (observerStackStack.length < (stackLevel + 2)) {
        observerStackStack.push([])
    }

    stackLevel++
}

function endObserverStack() {
    const level = stackLevel
    stackLevel--

    return observerStackStack[level]
}

function pushToObserverStack(fnc) {
    // if (observerStackStack.length === 0) {
    //     return
    // }
    observerStackStack[stackLevel].push(fnc)
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
        proxyToRaw.set(proxy, value)
    }

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
            // const msg = `running ${fnc.role} child's cleaners`
            // console.log(msg)
            clean()
        })
        unregisteredSet.add(nestedFnc)
    })
    fnc.nestedObservers = []

    /*if (unregisteredSet.has(fnc)) {
        return
    }*/
    const config = {
        fnc
    }

    // pushToObserverStack(config)

    startNewPropAccessStack()
    fnc()
    const dependencies = endPropAccessStack()

    config.init = () => {
        dependencies.forEach(({target, key}) => {
            const computedByKey = computedByTarget.get(target) || new Map()
            const computedSet = computedByKey.get(key) || new Set()

            computedSet.add(fnc)

            computedByKey.set(key, computedSet)

            computedByTarget.set(target, computedByKey)

            fnc.cleaners = fnc.cleaners || []
            fnc.cleaners.push(() => {
                // console.log(`delete listener for ${fnc.role}, key=${key}`)
                computedSet.delete(fnc)
                unregisteredSet.add(fnc)
            })

            debug.add(fnc, target, key)
        })
    }

    return config
}

/**
 * @param {function} fnc
 */
export function makeObserver(fnc) {
    startNewObserverStack()

    const config = runComputed(fnc)
    pushToObserverStack(config)


    const childObservers = observerStackStack.length >= (stackLevel + 2) ? observerStackStack[stackLevel + 1] : []
    fnc.nestedObservers = childObservers.map(o => o.fnc)
    // stackLevel--

    if (stackLevel === 0) {
        const stack = [...observerStackStack]
        stack.flat().forEach(({init}) => {
            init()
        })
        observerStackStack = []
    }

    stackLevel--
}

export function handleQueue() {
    handleComputedQueue()
}

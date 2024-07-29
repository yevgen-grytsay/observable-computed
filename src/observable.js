
const rawToProxy = new WeakMap()
const proxyToRaw = new WeakMap()
let propAccessStackStack = []

const nestedObserversKey = Symbol('MyObservable_NestedObservers')

export const debug = {
    enabled: false,
    byTarget: new Map(),
    start() {
        this.enabled = true
        this.byTarget = new Map()
    },
    clean() {
        this.enabled = false
        this.byTarget = new Map()
    },
    add(fnc, target, key) {
        if (!this.enabled) {
            return
        }

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
    toString() {
        const result = []
        this.byTarget.forEach((byKey, target) => {
            const parts = []
            byKey.forEach((handlers, key) => {
                if (typeof key === 'symbol') {
                    key = '<symbol>'
                }
                const handlerIds = Array.from(handlers.values()).map(h => h.role)
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

let unregisteredSet = new WeakSet()
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

    const configs = observerStackStack[stackLevel] ?? []
    const {fnc} = configs.length > 0 ? configs[configs.length - 1] : {fnc: null}
    fnc && computed.add(fnc)

    fnc && debug.add(fnc, target, p)

    computedByKey.set(p, computed)
    computedByTarget.set(target, computedByKey)
}

let observerStackStack = []
let stackLevel = -1
function startNewObserverStack() {
    if (observerStackStack.length < (stackLevel + 2)) {
        observerStackStack.push([])
    }

    stackLevel++
}

function pushToObserverStack(fnc) {
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
    startNewPropAccessStack()
    fnc()
    endPropAccessStack()
}

/**
 * @param {function} fnc
 */
export function makeObserver(fnc) {
    fnc[nestedObserversKey] = fnc[nestedObserversKey] || []
    fnc[nestedObserversKey].forEach(nestedFnc => {
        unregisteredSet.add(nestedFnc)
    })
    fnc[nestedObserversKey] = []

    startNewObserverStack()

    // Щоб в registerAccess знати контекст, pushToObserverStack треба виконати до runComputed
    pushToObserverStack({fnc})
    runComputed(fnc)

    const childObservers = observerStackStack.length >= (stackLevel + 2) ? observerStackStack[stackLevel + 1] : []
    fnc[nestedObserversKey] = childObservers.map(o => o.fnc)

    stackLevel--
    if (stackLevel === -1) {
        observerStackStack = []
    }
}

export function handleQueue() {
    handleComputedQueue()
}

//
// in-source test suites
//
if (import.meta.vitest) {
    const { it, expect } = import.meta.vitest

    it('test stack of simple observer', () => {
        const stack = []
        observerStackStack = new Proxy([], {
            set(target, p, newValue, receiver) {
                const result = Reflect.set(target, p, newValue, receiver)

                if (typeof p !== 'symbol' && /[0-9]+/.test(p)) {
                    stack.push(newValue)
                }

                return result
            }
        })

        const data = makeObservable({a: 'test'})

        makeObserver(() => {
            const {a} = data;
        })
        data.a += ' upd'

        expect(stack).to.have.lengthOf(1);
    })
}

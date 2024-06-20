
const rawToProxy = new WeakMap()
let getPropStack = []

const startStack = () => {
    getPropStack = []
}

const endStack = () => {
    const result = Array.from(getPropStack)
    getPropStack = []

    return result
}

const computedByTarget = new WeakMap()

let handlerQueue = new Set()
const enqueueComputed = (target, p) => {
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

    return proxy
}

const proxyHandler = {
    get(target, p, receiver) {
        const value = Reflect.get(target, p, receiver)

        registerAccess(target, p)
        getPropStack.push({
            target,
            key: p,
        })

        return makeAndRegisterObservable(value)
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
        getPropStack.push({
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
    startStack()
    fnc()
    const dependencies = endStack()

    dependencies.forEach(({target, key}) => {
        const computedByKey = computedByTarget.get(target) || new Map()
        const computedSet = computedByKey.get(key) || new Set()

        computedSet.add(fnc)

        computedByKey.set(key, computedSet)

        computedByTarget.set(target, computedByKey)
    })
}

/**
 * @param {function} fnc
 */
export function makeObserver(fnc) {
    runComputed(fnc)
}

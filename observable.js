
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
const enqueueComputed = (target, p, newValue) => {
    const computedByKey = computedByTarget.get(target)
    if (!computedByKey) {
        return
    }

    const computed = computedByKey.get(p)
    if (!computed) {
        return
    }

    // handlerQueue = handlerQueue.union(computed)
    handlerQueue = new Set([...handlerQueue, ...computed])
}
const handleComputedQueue = () => {
    const queue = handlerQueue
    handlerQueue = new Set()

    queue.forEach(fnc => {
        runComputed(fnc)
    })
}


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

/*const callComputed = (target, p, newValue) => {
    const computedByKey = computedByTarget.get(target)
    if (!computedByKey) {
        return
    }

    const computed = computedByKey.get(p)
    if (!computed) {
        return
    }

    console.log({reactions: computed.size})
    computed.forEach(fnc => {
        runComputed(fnc)
    })
}*/

const proxyHandler = {
    get(target, p, receiver) {
        const value = Reflect.get(target, p, receiver)

        registerAccess(target, p)
        getPropStack.push({
            target,
            key: p,
        })

        if (typeof value === 'object' && value !== null) {
            let proxy = rawToProxy.get(value)
            if (typeof proxy === 'undefined') {
                proxy = makeObservable(value)
                rawToProxy.set(value, proxy)
            }

            return proxy
        }

        return value
    },
    set(target, p, newValue, receiver) {
        const result = Reflect.set(target, p, newValue, receiver)

        enqueueComputed(target, p, newValue)
        Promise.resolve().then(handleComputedQueue)
        // Promise.resolve().then(() => {
        //     callComputed(target, p, newValue)
        // })

        return result
    }
};

/**
 * @template T
 *
 * @param {T} obj
 * @returns {T}
 */
export function makeObservable(obj) {
    return new Proxy(obj, proxyHandler)
}


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

export function makeObserver(fnc) {
    runComputed(fnc)
}


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

const callComputed = (target, p, newValue) => {
    const computedByKey = computedByTarget.get(target)
    if (!computedByKey) {
        return
    }

    const computed = computedByKey.get(p)
    if (!computed) {
        return
    }

    computed.forEach(fnc => {
        runComputed(fnc)
    })
}

const proxyHandler = {
    get(target, p, receiver) {
        const value = Reflect.get(target, p, receiver)

        getPropStack.push({
            target,
            key: p,
        })

        if (typeof value === 'object' && value !== null) {
            let proxyValue = rawToProxy.get(value)
            if (typeof proxyValue === 'undefined') {
                proxyValue = makeDeepObservable(value)
                rawToProxy.set(value, proxyValue)
            }

            return proxyValue
        }

        return value
    },
    set(target, p, newValue, receiver) {
        const result = Reflect.set(target, p, newValue, receiver)

        Promise.resolve().then(() => {
            callComputed(target, p, newValue)
        })

        return result
    }
};

/**
 * @template T
 *
 * @param {T} obj
 * @returns {T}
 */
export function makeDeepObservable(obj) {
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

export function computed(fnc) {
    runComputed(fnc)
}

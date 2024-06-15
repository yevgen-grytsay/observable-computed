let pathStack = []
let contextObj = new WeakRef({})
/**
 * @returns {Array<String>}
 */
const popPath = () => {
    const path = Array.from(pathStack)
    console.debug('restart: pop path')
    pathStack = []

    return path
}

const setContextObject = (object) => {
    contextObj = new WeakRef(object)
}

const getContextObject = () => {
    return contextObj.deref()
}

const getPath = () => {
    return Array.from(pathStack)
}

const startPath = (target, prop, value, handler) => {
    if (pathStack.length > 0) {
        console.error({message: 'Starting a new path stack but the tack is not empty', pathStack})
    }

    if (typeof value !== 'object' || value === null) { /* typeof null === 'object' */
        return value
    }

    console.debug('restart: start path')
    pathStack = [prop]
    setContextObject(value)

    return new Proxy(value, handler)
}

export function createPathProxy(object, listener) {
    console.debug("#\n# Path Detection Proxy\n#")

    const config = {
        rootProxy: null,
    }

    const handler = {
        get(target, p, receiver) {
            console.debug(`get ${p}`, pathStack)
            const value = Reflect.get(target, p, receiver)

            if (typeof value !== 'object' || value === null) { /* typeof null === 'object' */
                if (target !== getContextObject()) {
                    console.debug('restart: got non-object')
                    pathStack = [] // this is property reading operation
                    setContextObject(target)
                }

                return value
            }

            if (receiver === config.rootProxy) {
                return startPath(target, p, value, handler)
            } else {
                setContextObject(value)
                pathStack.push(p)
            }

            return new Proxy(value, handler)
        },
        set(target, p, newValue, receiver) {
            console.debug(`set ${p}`, pathStack)
            const result = Reflect.set(target, p, newValue, receiver)

            if (receiver === config.rootProxy) {
                if (typeof newValue !== 'object' || newValue === null) { /* typeof null === 'object' */
                    console.debug(`path: ${p} (1-level)`)
                    listener(p)
                }
            } else {
                const path = getPath().concat([p])
                console.debug(`path: ${path.join('.')}`)
                listener(path.join('.'))
            }

            return result
        }
    };
    const rootProxy = new Proxy(object, handler)

    config.rootProxy = rootProxy

    return rootProxy
}

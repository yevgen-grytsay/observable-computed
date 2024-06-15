let pathStack = []
let contextObj = null // todo weak ref
/**
 * @returns {Array<String>}
 */
const popPath = () => {
    const path = Array.from(pathStack)
    console.log('restart: pop path')
    pathStack = []

    return path
}

const getPath = () => {
    return Array.from(pathStack)
}

const startPath = (target, prop, value, handler) => {
    if (pathStack.length > 0) {
        console.error({message: 'Starting a new path stack but the tack is not empty', pathStack})
    }

    if (typeof value !== 'object' || value === null) {
        return value
    }

    console.log('restart: start path')
    pathStack = [prop]
    contextObj = value

    return new Proxy(value, handler)
}

export function createPathProxy(object, listener) {
    console.log("#\n# Path Detection Proxy\n#")

    const config = {
        rootProxy: null,
    }

    const handler = {
        get(target, p, receiver) {
            console.debug(`get ${p}`, pathStack)
            const value = Reflect.get(target, p, receiver)

            if (typeof value !== 'object' || value === null) {
                if (target !== contextObj) {
                    console.log('restart: got non-object')
                    pathStack = [] // this is property reading operation
                    contextObj = target
                }

                return value
            }

            if (receiver === config.rootProxy) {
                return startPath(target, p, value, handler)
            } else {
                contextObj = value
                pathStack.push(p)
            }

            return new Proxy(value, handler)
        },
        set(target, p, newValue, receiver) {
            console.debug(`set ${p}`, pathStack)
            const result = Reflect.set(target, p, newValue, receiver)

            if (receiver === config.rootProxy) {
                if (typeof newValue !== 'object' || newValue === null) {
                    console.log(`path: ${p} (1-level)`)
                    listener(p)
                }
            } else {
                const path = getPath().concat([p])
                console.log(`path: ${path.join('.')}`)
                listener(path.join('.'))
            }

            return result
        }
    };
    const rootProxy = new Proxy(object, handler)

    config.rootProxy = rootProxy

    return rootProxy
}

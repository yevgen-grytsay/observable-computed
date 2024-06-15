let pathStack = []
/**
 * @returns {Array<String>}
 */
const popPath = () => {
    const path = Array.from(pathStack);
    pathStack = []

    return path
}

const pathProxyHandler = {
    get(target, p, receiver) {
        const value = Reflect.get(target, p, receiver)

        pathStack.push(p)

        if (typeof value !== 'object' || value === null) {
            return
        }

        return new Proxy(value, pathProxyHandler)
    },
    set(target, p, newValue, receiver) {
        const result = Reflect.set(target, p, newValue, receiver)

        const path = popPath().concat([p])
        console.log(`path: ${path.join('.')}`)

        return result
    }
};

const startPath = (prop, value) => {
    if (pathStack.length > 0) {
        console.error({message: 'Starting a new path stack but the tack is not empty', pathStack})
    }

    if (typeof value !== 'object' || value === null) {
        return value
    }

    pathStack = [prop]

    return new Proxy(value, pathProxyHandler)
}

export function createPathProxy(object) {
    console.log("#\n# Path Detection Proxy\n#")

    const rootProxy = new Proxy(object, {
        get(target, p, receiver) {
            let value = Reflect.get(target, p, receiver)
            if (receiver !== rootProxy) { // todo can it be true?
                return value
            }

            return startPath(p, value)
        },
        set(target, p, newValue, receiver) {
            const result = Reflect.set(target, p, newValue, receiver)

            if (typeof newValue !== 'object' || newValue === null) {
                console.log(`path: ${p} (1-level)`)
            }

            return result
        }
    })

    return rootProxy
}

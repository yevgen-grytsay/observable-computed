// import {vi} from "vitest";
import {handleQueue, makeObservable, makeObserver} from "../observable.js";

const testData = {
    settings: {
        users: [
            {id: 1, name: 'Alice'},
            {id: 2, name: 'Bob'},
        ]
    }
}

const data = makeObservable(testData)
const nestedObserver = () => {
    const name = data.settings.users[0].name
    console.log('#2', name)
}
nestedObserver.role = 'nested'

function createNestedObserver() {
    const nestedObserver = () => {
        const name = data.settings.users[0].name
        console.log('#2', name)
    }
    nestedObserver.role = 'nested'

    return nestedObserver
}

const rootObserver = () => {
    console.log('#1')
    const users = data.settings.users
    // makeObserver(createNestedObserver())
    makeObserver(nestedObserver)
}
rootObserver.role = 'root'

makeObserver(rootObserver)

console.log("\n-=[ start ]=-")
console.log("-=[ step #1 ]=-\n")

data.settings.users = [...data.settings.users]
data.settings.users = [...data.settings.users]
handleQueue()

console.log("\n-=[ step #2 ]=-\n")
data.settings.users[0].name = `Name ${Date.now()}`
handleQueue()

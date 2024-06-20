// import {vi} from "vitest";
import {debug, handleQueue, makeObservable, makeObserver} from "./observable.js";

let childNo = 0
function getChildNo() {
    childNo++

    return childNo
}

const data = makeObservable({
    users: [
        {id: 1, name: 'Alice'},
        {id: 2, name: 'Bob'},
    ]
})
const nestedObserver = () => {
    const name = data.users[0].name
    console.log(`#2 ${nestedObserver.role}`, name)
}
nestedObserver.role = `child-${getChildNo()}`
const nestedObserver2 = () => {
    const name = data.users[0].id
    console.log(`#2-2 ${nestedObserver2.role}`, name)
}
nestedObserver2.role = `child2-${getChildNo()}`

function createNestedObserver() {
    const nestedObserver = () => {
        const name = data.users[0].name
        console.log('#2', name)
    }
    nestedObserver.role = 'child'

    return nestedObserver
}

const rootObserver = () => {
    console.log('#1')
    const users = data.users
    // makeObserver(createNestedObserver())
    makeObserver(nestedObserver)
    makeObserver(nestedObserver2)
}
rootObserver.role = 'root'

makeObserver(rootObserver)

// console.log("\n-=[ start ]=-")
// console.log("-=[ step #1 ]=-\n")
//
data.users = [...data.users]
handleQueue()
//
// console.log("\n-=[ step #2 ]=-\n")
// data.users[0].name = `Name ${Date.now()}`
// handleQueue()

console.log(`${debug}`)

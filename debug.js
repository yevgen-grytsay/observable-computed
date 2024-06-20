import {debug, handleQueue, makeObservable, makeObserver} from "./observable.js";

let childNo = 0
function getChildNo() {
    childNo++

    return childNo
}
let rootNo = 0
function getRootNo() {
    rootNo++

    return rootNo
}

const data = makeObservable({
    settings: {
        users: [
            {id: 1, name: 'Alice'},
            // {id: 2, name: 'Bob'},
        ]
    }
})

const rootFnc = () => {
    console.log('#1')
    // const names = data.settings.users.map(u => u.name)
    data.settings.users.forEach(u => {
        const a = u.name
    })
    // console.log(names)
    const fnc = () => {
        const name = data.settings.users[0]?.name
        console.log(`#2 ${fnc.role}`, name)
    };
    fnc.role = `child-${getChildNo()}`
    makeObserver(fnc)
    /*data.settings.users.forEach((u) => {
        const fnc = () => {
            const name = u.name
            console.log('#2', name)
        }
        fnc.role = `child #${getChildNo()}`
        makeObserver(fnc)
    })*/
}
rootFnc.role = `root #${getRootNo()}`

makeObserver(rootFnc)

console.log("\n-=[ start ]=-")
console.log("-=[ step #1 ]=-\n")

data.settings.users = [data.settings.users[0]]
// data.settings.users = [...data.settings.users]
// data.settings.users = [...data.settings.users]
// data.settings.users = [...data.settings.users]
// data.settings.users = [...data.settings.users]
handleQueue()

// console.log("\n-=[ step #2 ]=-\n")
// data.settings.users[0].name = `Name ${Date.now()}`
// data.settings.users[0].name = `Name ${Date.now()}`
// data.settings.users[0].name = `Name ${Date.now()}`
// data.settings.users[0].name = `Name ${Date.now()}`
handleQueue()

console.log(`${debug}`)

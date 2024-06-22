import './style.css'
import {makeObservable, makeObserver} from "./observable.js";
import {createPathProxy} from "./path-detection-proxy.js";


const store = makeObservable({
    nodes: [],
})

const nodes = store.nodes
const printText = () => {
    console.log('Call!')

    const container = document.createElement('div')
    container.id = 'container'

    nodes.forEach(node => {
        const el = document.createElement('div')
        el.textContent = `${node.name} [${node.id}]`
        container.append(el)
    })

    if (nodes.length === 2) {
        console.log({addedToLengthTwo: nodes[1]})
    }

    let oldContainer = document.getElementById('container')
    if (oldContainer) {
        oldContainer.replaceWith(container)
    } else {
        document.getElementById('app').append(container)
    }
}

makeObserver(printText, {delay: true});

(function () {
    const nodes = store.nodes
    nodes.push({
        id: 1,
        name: 'Root node #1',
    })

    nodes[0].name = 'New name'
    console.log(nodes[0].name)

    nodes[0].name = 'New name #1'
    console.log(nodes[0].name)
})()


const phrases= [
    'The stage is set, the green flag drops!',
    'Is dominating the race!',
    'Looks lost out there!',
    'Jams into first!',
    'Fades into last!',
    'Is headed the wrong way!',
    'Hits the warp!',
    'Launches himself!',

]
const larrySays = () => {
    const randomPhraseIndex = Math.floor(Math.random() * phrases.length)
    const randomNodeIndex = Math.floor(Math.random() * nodes.length)
    const node = nodes[randomNodeIndex];

    node.name = `${node.name} -> ${phrases[randomPhraseIndex]}`
    console.log({larrySays: phrases[randomPhraseIndex]})
};
// setInterval(larrySays, 10000)

const deleteRandomNode = () => {
    const randomIndex = Math.floor(Math.random() * nodes.length)
    const deleted = nodes.splice(randomIndex, 1)

    console.log({deleted})
};
// setInterval(larry, 15000)

let nextId = 2
const reverse = () => {
    nodes.reverse()
    console.log('reversed')
};
// setInterval(reverse, 10000)

const insertNewNode = () => {
    const id = nextId++
    const inserted = {
        id,
        name: `Node #${id}`,
    };
    nodes.push(inserted)
    console.log({inserted})
};
// setInterval(insertNewNode, 5000)

document.getElementById('button-push').addEventListener('click', ev => {
    insertNewNode()
})

window.app = {
    nodes: store.nodes,
    insertNewNode,
    deleteRandomNode,
    reverse,
    larrySays,
}


const tree = {
    id: 1,
    settings: {
        foo: 'bar',
        options: {
            font: {
                size: 12,
                family: 'monospaced',
            }
        }
    },
    children: [
        {
            id: 10,
            name: 'Child #10',
        }
    ],
    callback: () => {}
};
const rootProxy = createPathProxy(tree, () => {})

// let id = rootProxy.id
// rootProxy.settings.foo = 'new bar'
// rootProxy.id = 100
// rootProxy.settings.options.font.size = 24
// rootProxy.settings.options.font.family = 'serif'
// rootProxy.children[0].name += ' upd' // children.0.name.name
// rootProxy.children[0].name = 'test name'
/*rootProxy.children.push({
    id: 2,
    name: 'Child #2',
})*/
// rootProxy.callback.prototype = {}

rootProxy.settings = {
    font: {
        size: 100,
        family: 'sans-serif',
    }
}

// import './delay-notification.js'


function fncA() {
    console.log('A start')
    Promise.resolve().then(function () {
        console.log('A delayed')
    })
    /*setTimeout(function () {
        console.log('A delayed')
    }, 0)*/
    console.log('A end')
}

function fncB() {
    console.log('B start')
    Promise.resolve().then(function () {
        console.log('B delayed')
    })
    /*setTimeout(function () {
        console.log('B delayed')
    }, 0)*/
    console.log('B end')
}

function fncMain() {
    /*setTimeout(function () {
        console.log('MAIN delayed')
    }, 0)*/
    Promise.resolve().then(function () {
        console.log('MAIN #1 delayed')
    })
    console.log('MAIN start')
    fncA()
    Promise.resolve().then(function () {
        console.log('MAIN #2 delayed')
    })
    fncB()
    Promise.resolve().then(function () {
        console.log('MAIN #3 delayed')
    })
    console.log('MAIN end')
}

// fncMain()
Promise.resolve().then(fncMain)

/*
MAIN start
main.js:148 A start
main.js:155 A end
main.js:159 B start
main.js:166 B end
main.js:185 MAIN end
main.js:174 MAIN #1 delayed
main.js:150 A delayed
main.js:179 MAIN #2 delayed
main.js:161 B delayed
main.js:183 MAIN #3 delayed
 */


const data = makeObservable({
    settings: {
        users: [
            {id: 1, name: 'Alice'},
            // {id: 2, name: 'Bob'},
        ]
    }
})

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

const rootFnc = () => {
    console.log('#1')
    // const names = counter.settings.users.map(u => u.name)
    // console.log(names)
    data.settings.users.forEach((u) => {
        const fnc = () => {
            const name = u.name
            console.log('#2', name)
        }
        fnc.role = `child #${getChildNo()}`
        makeObserver(fnc)
    })
}
rootFnc.role = `root #${getRootNo()}`
makeObserver(rootFnc)

window.app = {
    triggerRoot() {
        data.settings.users = [...data.settings.users]
    },
    triggerNested() {
        data.settings.users[0].name = `Name ${Date.now()}`
    },
    ...window.app,
}

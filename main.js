import './style.css'
import {makeDeepObservable, computed} from "./observable.js";


const nodes = makeDeepObservable([])

const printText = () => {
    // console.log('Call!')

    const container = document.createElement('div')
    container.id = 'container'

    nodes.forEach(node => {
        const el = document.createElement('div')
        el.textContent = node.name
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

computed(printText)


nodes.push({
    id: 1,
    name: 'Root node #1',
})

nodes[0].name = 'New name'
console.log(nodes[0].name)

nodes[0].name = 'New name #1'
console.log(nodes[0].name)

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


window.app = {
    nodes,
    insertNewNode,
    deleteRandomNode,
    reverse,
    larrySays,
}

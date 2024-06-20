import {bench, describe} from "vitest";
import {makeObservable, makeObserver} from "../observable.js";


const createObject = function() {
    return {
        id: 100,
        name: 'Root node',
        children: [
            {
                id: 1,
                name: 'Child #1',
            }
        ],
        callback: () => {},
    }
}

describe('Benchmarks', () => {
    bench('memory', () => {
        for (let i = 0; i < 100000; i++) {
            const data = makeObservable(createObject())
            const listener = () => {
                const temp = {
                    id: data.id,
                    name: data.name,
                    children: data.children.map(item => {
                        return {
                            id: item.id,
                            name: item.name,
                        }
                    })
                }
            }
            makeObserver(listener)
        }
    }, {time: 10000})
})

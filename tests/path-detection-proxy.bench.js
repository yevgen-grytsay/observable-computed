import {describe, bench} from "vitest";
import {createPathProxy} from "../path-detection-proxy.js";

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
        const listener = () => {}
        for (let i = 0; i < 100000; i++) {
            createPathProxy(createObject(), listener)
        }
    }, {time: 10000})
})

import {makeObserver, makeObservable} from "../observable.js";
import {describe, it, expect, vi, beforeEach} from "vitest";

let testData = {}

describe('Observable Tests', () => {
    beforeEach(() => {
        testData = {
            counter: 0,
            nodes: {
                children: []
            },
            users: [
                {
                    id: 1,
                    name: 'Alice',
                },
                {
                    id: 2,
                    name: 'Bob',
                },
            ]
        }
    })

    it('should notify listener', () => {
        const data = makeObservable({counter: 0})
        const config = {
            onChange() {
                console.log(data.counter)
            }
        }
        const listener = vi.spyOn(config, 'onChange')

        makeObserver(listener)

        expect(listener).toBeCalledTimes(1)
    })

    it('listener should have access to most recent value', async () => {
        const data = makeObservable({counter: 0})
        let value
        const config = {
            onChange() {
                value = data.counter
            }
        }
        const listener = vi.spyOn(config, 'onChange')

        makeObserver(listener)

        expect(listener).toBeCalledTimes(1)
        expect(value).toBe(0)

        data.counter = 10

        await vi.waitFor(() => {
            expect(listener).toBeCalledTimes(2)
            expect(value).toBe(10)
            console.debug({value})
        })
    })

    it('listener detached array', async () => {
        const data = makeObservable(testData)
        let value = []
        const config = {
            onChange() {
                value = []
                data.nodes.children.forEach(item => {
                    value.push(item)
                })
            }
        }
        const listener = vi.spyOn(config, 'onChange')

        makeObserver(listener)

        expect(listener).toBeCalledTimes(1)
        expect(value).toStrictEqual([])

        const children = data.nodes.children
        const counter = data.counter

        children.push({id: 1, name: 'Node #1'})
        children.push({id: 2, name: 'Node #2'})

        const actual = await vi.waitFor(() => {
            expect(listener).toBeCalledTimes(2)

            return value
        })

        expect(actual).toStrictEqual([
            {id: 1, name: 'Node #1'},
            {id: 2, name: 'Node #2'}
        ])
    })

    it('replace array item', async () => {
        const data = makeObservable(testData)
        let value = []
        const config = {
            onChange() {
                value = []
                data.users.forEach(item => {
                    value.push(item)
                })
            }
        }
        const listener = vi.spyOn(config, 'onChange')

        makeObserver(listener)
        expect(listener).toBeCalledTimes(1)

        data.users[1] = {
            id: 4,
            name: 'Dean',
        }
        expect(listener).toBeCalledTimes(1)

        const result = await vi.waitFor(() => {
            expect(listener).toBeCalledTimes(2)

            return value
        })
    })

    it('push to array', async () => {
        const data = makeObservable(testData)
        let value = []
        const config = {
            onChange() {
                data.users.forEach(item => {
                    value.push(item)
                })
            }
        }
        const listener = vi.spyOn(config, 'onChange')

        makeObserver(listener)
        expect(listener).toBeCalledTimes(1)

        data.users.push({
            id: 4,
            name: 'Dean'
        })
        expect(listener).toBeCalledTimes(1)

        const result = await vi.waitFor(() => {
            expect(listener).toBeCalledTimes(2)
        })

        expect(value).toStrictEqual([
            {id: 1, name: 'Alice'},
            {id: 2, name: 'Bob'},
            {id: 1, name: 'Alice'},
            {id: 2, name: 'Bob'},
            {id: 4, name: 'Dean'},
        ])
    })

    // todo fix
    it.skip('update array item', async () => {
        const data = makeObservable(testData)
        let value = []
        const config = {
            onChange() {
                value = []
                data.users.forEach(item => {
                    value.push(item)
                })
            }
        }
        const listener = vi.spyOn(config, 'onChange')

        makeObserver(listener)
        expect(listener).toBeCalledTimes(1)

        data.users[1].name = 'Charlie'
        expect(listener).toBeCalledTimes(1)

        await vi.waitFor(() => {
            expect(listener).toBeCalledTimes(2)
        })
    })
})

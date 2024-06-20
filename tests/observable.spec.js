import {debug, makeObserver, makeObservable, handleQueue} from "../observable.js";
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
        expect(listener).toBeCalledTimes(1)

        handleQueue()
        expect(listener).toBeCalledTimes(2)
        expect(value).toBe(10)

        /*await vi.waitFor(() => {
            expect(listener).toBeCalledTimes(2)
            expect(value).toBe(10)
            console.debug({value})
        })*/
    })

    it('listener detached array', async () => {
        debug.start()
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
        expect(listener).toBeCalledTimes(1)

        children.push({id: 1, name: 'Node #1'})
        children.push({id: 2, name: 'Node #2'})


        const debugStr = `${debug}`;
        console.log(debugStr)
        handleQueue()
        const actual = value
        /*const actual = await vi.waitFor(() => {
            expect(listener).toBeCalledTimes(2)

            return value
        })*/

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

    it('update array item', async () => {
        const data = makeObservable(testData)
        let value = []
        const config = {
            onChange() {
                data.users.forEach(item => {
                    value.push(item.name)
                })
            }
        }
        const listener = vi.spyOn(config, 'onChange')

        makeObserver(listener)
        expect(listener).toBeCalledTimes(1)

        data.users[1].name = 'Charlie'
        expect(listener).toBeCalledTimes(1)

        const result = await vi.waitFor(() => {
            expect(listener).toBeCalledTimes(2)

            return value
        })

        expect(value).toStrictEqual([
            'Alice',
            'Bob',
            'Alice',
            'Charlie',
        ])
    })

    it('replace object in root property', async () => {
        const data = makeObservable({
            tree: {
                nodes: [
                    {id: 1, name: 'Node #1'},
                    {id: 2, name: 'Node #2'},
                ]
            }
        })
        let value = []
        const config = {
            onChange() {
                data.tree.nodes.forEach(item => {
                    value.push(item.name)
                })
            }
        }
        const listener = vi.spyOn(config, 'onChange')

        makeObserver(listener)
        expect(listener).toBeCalledTimes(1)

        expect(value).toStrictEqual([
            'Node #1',
            'Node #2',
        ])

        data.tree = {
            nodes: [
                {id: 3, name: 'Node #3'},
                {id: 4, name: 'Node #4'},
            ]
        }
        const result = await vi.waitFor(() => {
            expect(listener).toBeCalledTimes(2)

            return value
        })
        expect(result).toStrictEqual([
            'Node #1',
            'Node #2',
            'Node #3',
            'Node #4',
        ])
    })

    it('replace object in root property #2', async () => {
        const data = makeObservable({
            tree: {
                nodes: [
                    {id: 1, name: 'Node #1'},
                    {id: 2, name: 'Node #2'},
                ]
            }
        })
        let value = []
        const config = {
            onChange() {
                data.tree.nodes.forEach(item => {
                    value.push(item)
                })
            }
        }
        const listener = vi.spyOn(config, 'onChange')

        makeObserver(listener)
        expect(listener).toBeCalledTimes(1)

        expect(value).toStrictEqual([
            {id: 1, name: 'Node #1'},
            {id: 2, name: 'Node #2'},
        ])

        data.tree = {
            nodes: [
                {id: 3, name: 'Node #3'},
                {id: 4, name: 'Node #4'},
            ]
        }
        const result = await vi.waitFor(() => {
            expect(listener).toBeCalledTimes(2)

            return value
        })
        expect(result).toStrictEqual([
            {id: 1, name: 'Node #1'},
            {id: 2, name: 'Node #2'},
            {id: 3, name: 'Node #3'},
            {id: 4, name: 'Node #4'},
        ])
    })

    describe('Conditional branches', () => {
        it('use condition in observer, change value in condition', async () => {
            const data = makeObservable(testData)
            let value = []
            const config = {
                onChange() {
                    if (data.counter === 0) {
                        value.push(data.users[0].name)
                    } else {
                        value.push(data.users[1].name)
                    }
                }
            }
            const listener = vi.spyOn(config, 'onChange')
            makeObserver(listener)
            expect(listener).toBeCalledTimes(1)
            expect(value).toStrictEqual(['Alice'])

            data.counter = 1
            expect(listener).toBeCalledTimes(1)
            expect(value).toStrictEqual(['Alice'])

            const result = await vi.waitFor(() => {
                expect(listener).toBeCalledTimes(2)

                return value
            })
            expect(value).toStrictEqual([
                'Alice',
                'Bob',
            ])
        })

        it('use condition in observer, change other value', async () => {
            const data = makeObservable(testData)
            let value = []
            const config = {
                onChange() {
                    if (data.counter === 0) {
                        value.push(data.users[0].name)
                    } else {
                        value.push(data.users[1].name)
                    }
                }
            }
            const listener = vi.spyOn(config, 'onChange')
            makeObserver(listener)
            expect(listener).toBeCalledTimes(1)
            expect(value).toStrictEqual(['Alice'])

            data.users[0].name = 'New Name'
            expect(listener).toBeCalledTimes(1)
            expect(value).toStrictEqual(['Alice'])

            const result = await vi.waitFor(() => {
                expect(listener).toBeCalledTimes(2)

                return value
            })
            expect(value).toStrictEqual([
                'Alice',
                'New Name',
            ])
        })

        it.fails('use condition in observer, condition value is not observed', async () => {
            const data = makeObservable(testData)
            let value = []
            let flag = true
            const config = {
                onChange() {
                    if (flag) {
                        value.push(data.users[0].name)
                    } else {
                        value.push(data.users[1].name)
                    }
                }
            }
            const listener = vi.spyOn(config, 'onChange')
            makeObserver(listener)
            expect(listener).toBeCalledTimes(1)
            expect(value).toStrictEqual(['Alice'])

            flag = false
            expect(listener).toBeCalledTimes(1)
            expect(value).toStrictEqual(['Alice'])

            const result = await vi.waitFor(() => {
                expect(listener).toBeCalledTimes(2)

                return value
            })
        })
    })

    describe('nested observers', () => {
        it('', () => {
            const data = makeObservable(testData)
            const nestedObserver = () => {
                const name = data.users[0].name
            }
            const nestedSpy = vi.spyOn({onChange: nestedObserver}, 'onChange')

            const rootObserver = () => {
                const users = data.users
                makeObserver(nestedSpy)
            }
            const rootSpy = vi.spyOn({onChange: rootObserver}, 'onChange')

            makeObserver(rootSpy)
            expect(rootSpy).toBeCalledTimes(1)
            expect(nestedSpy).toBeCalledTimes(1)

            handleQueue()
            expect(rootSpy).toBeCalledTimes(1)
            expect(nestedSpy).toBeCalledTimes(1)

            data.users[0].name = 'New name'
            handleQueue()
            expect(rootSpy).toBeCalledTimes(1)
            expect(nestedSpy).toBeCalledTimes(2)

            data.users = [...data.users]
            handleQueue()
            expect(rootSpy).toBeCalledTimes(2)
            expect(nestedSpy).toBeCalledTimes(3) // todo oops, looks like we called the old nested function too
        })
    })

    describe('nested observers unobserveAll', () => {
        it('', () => {
            const data = makeObservable(testData)
            const nestedObserver = () => {
                const name = data.users[0].name
            }
            const nestedSpy = vi.spyOn({onChange: nestedObserver}, 'onChange')
            nestedSpy.role = 'nested'

            const rootObserver = () => {
                const users = data.users
                makeObserver(nestedSpy)
            }
            const rootSpy = vi.spyOn({onChange: rootObserver}, 'onChange')
            rootSpy.role = 'root'

            makeObserver(rootSpy)
            expect(rootSpy).toBeCalledTimes(1)
            expect(nestedSpy).toBeCalledTimes(1)

            // unobserveAll()
            data.users = [...data.users]
            handleQueue()
            expect(rootSpy).toBeCalledTimes(2)
            expect(nestedSpy).toBeCalledTimes(2)

            /*data.users = [...data.users]
            expect(rootSpy).toBeCalledTimes(2)
            expect(nestedSpy).toBeCalledTimes(3)
            handleQueue()
            expect(rootSpy).toBeCalledTimes(3)
            expect(nestedSpy).toBeCalledTimes(5)*/
        })

        let childNo = 0
        function getChildNo() {
            childNo++

            return childNo
        }

        it('#2', () => {
            debug.start()
            const data = makeObservable(testData)
            const nestedObserver = () => {
                const name = data.users[0].name
            }
            let spies = []

            const rootObserver = () => {
                const users = data.users
                const nestedSpy = vi.spyOn({onChange: nestedObserver}, 'onChange')
                nestedSpy.role = `child-${getChildNo()}`
                spies.push(nestedSpy)
                makeObserver(nestedSpy)
            }
            const rootSpy = vi.spyOn({onChange: rootObserver}, 'onChange')
            rootSpy.role = 'root'

            makeObserver(rootSpy)
            expect(rootSpy).toBeCalledTimes(1)
            expect(spies).length(1)
            expect(spies[0]).toBeCalledTimes(1)

            data.users = [...data.users]
            expect(spies).length(1)

            handleQueue()
            console.debug(`${debug}`)
            expect(spies).length(2)
            expect(rootSpy).toBeCalledTimes(2)
            expect(spies[1]).toBeCalledTimes(1)
            expect(spies[0]).toBeCalledTimes(1)

            /*data.users = [...data.users]
            expect(rootSpy).toBeCalledTimes(2)
            expect(nestedSpy).toBeCalledTimes(3)
            handleQueue()
            expect(rootSpy).toBeCalledTimes(3)
            expect(nestedSpy).toBeCalledTimes(5)*/
        })

        /*let childNo = 0
        function getChildNo() {
            childNo++

            return childNo
        }
        let rootNo = 0
        function getRootNo() {
            rootNo++

            return rootNo
        }

        it('nested', () => {
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

            data.settings.users = [...data.settings.users]
            handleQueue()

            data.settings.users[0].name = `Name ${Date.now()}`
            handleQueue()
        })*/
    })
})

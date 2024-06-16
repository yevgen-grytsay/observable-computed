import { describe, expect, it, vi, beforeEach } from 'vitest'
import {createPathProxy} from "../path-detection-proxy.js";

let tree = {}

describe('Path Detection Proxy', () => {
    beforeEach(() => {
        tree = {
            id: 1,
            settings: {
                callback: () => {},
                parent: null,
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
            parent: null,
            callback: () => {}
        };
    })

    it('get 1st-level property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let a = proxy.id

        expect(listener).not.toHaveBeenCalled()
    })

    it('get 2nd-level property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let a = proxy.settings.foo

        expect(listener).not.toHaveBeenCalled()
    })

    it('set 1st-level', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.id = 2

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('id')
    })

    it('set 2nd-level', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.settings.foo = 'new bar'

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('settings.foo')
    })

    it('get array property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let _ = proxy.children.length

        expect(listener).not.toHaveBeenCalled()
    })

    it('get array item property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let _ = proxy.children[0].id

        expect(listener).not.toHaveBeenCalled()
    })

    it('get null value', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let _ = proxy.parent

        expect(listener).not.toHaveBeenCalled()
    })

    it('get 2nd-level null value', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let _ = proxy.settings.parent

        expect(listener).not.toHaveBeenCalled()
    })

    it('get function', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let _ = proxy.callback

        expect(listener).not.toHaveBeenCalled()
    })

    it('get 2nd-level function', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let _ = proxy.settings.callback

        expect(listener).not.toHaveBeenCalled()
    })

    it('get function property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let _ = proxy.callback.name

        expect(listener).not.toHaveBeenCalled()
    })

    it('call function', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let _ = proxy.callback.call()

        expect(listener).not.toHaveBeenCalled()
    })

    it('set function property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.callback.prototype = {}

        expect(listener).not.toHaveBeenCalled()
    })

    it('set array property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.children[0].id = 100

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('children.0.id')
    })

    it('set property which is object', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.settings = {
            font: {
                size: 100,
                family: 'sans-serif',
            }
        }

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('settings')
    })

    it('overwrite item in array', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.children[0] = {
            id: 2,
            name: 'Child #2'
        }

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('children.0')
    })

    it('push 1-array', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.children.push({
            id: 2,
            name: 'Child #2'
        })

        expect(listener).toHaveBeenCalledTimes(2)
        expect(listener).toHaveBeenNthCalledWith(1, 'children.1')
        expect(listener).toHaveBeenNthCalledWith(2, 'children.length')
    })

    it('concat with +=', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.children[0].name += 'upd'

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('children.0.name')
    })

    it('write non-existing property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.noSuchProperty = 'test'

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('noSuchProperty')
    })

    it('write nested non-existing property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.settings.noSuchProperty = 'test'

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('settings.noSuchProperty')
    })

    it('write non-existing property of array item', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.children[0].noSuchProperty = 10

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('children.0.noSuchProperty')
    })

    it('read non-existing property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let a = proxy.noSuchProperty

        expect(listener).not.toHaveBeenCalled()
    })

    it('read non-existing nested property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        let a = proxy.settings.noSuchProperty
        let b = proxy.children[0].noSuchProperty

        expect(listener).not.toHaveBeenCalled()
    })

    it.fails('do not wrap in a proxy if already wrapped', () => {
        const listener = vi.fn()
        const proxy_1 = createPathProxy(tree, listener)
        createPathProxy(proxy_1, listener)
    })

    it('ignore symbols read', () => {
        const listener = vi.fn()
        const proxy_1 = createPathProxy(tree, listener)

        for (const item of proxy_1.children) {}
    })

    it('ignore symbols write', () => {
        const listener = vi.fn()
        const proxy_1 = createPathProxy(tree, listener)

        const key = Symbol('some_key');
        proxy_1.settings[key] = 'value'
    })

    it.fails('can not create proxy for same object twice', () => {
        const listener = vi.fn()
        const proxy_1 = createPathProxy(tree, listener)
        const proxy_2 = createPathProxy(tree, listener)
    })
})

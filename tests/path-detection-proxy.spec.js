import { assert, describe, expect, it, vi } from 'vitest'
import {createPathProxy} from "../path-detection-proxy.js";

const tree = {
    id: 1,
    settings: {
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
};

describe('Path Detection Proxy', () => {
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

    it('set array property', () => {
        const listener = vi.fn()
        const proxy = createPathProxy(tree, listener)

        proxy.children[0].id = 100

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('children.0.id')
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

        proxy.children[0].age = 10

        expect(listener).toHaveBeenCalledTimes(1)
        expect(listener).toHaveBeenCalledWith('children.0.age')
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
})

import 'should'
import { createStore, compose } from 'redux'
import {
  persistentStore,
  persistentReducer,
  waitInitialization,
  waitPersistence
} from '../src/index'
import load from '../src/utils/load'
import PouchDB from 'pouchdb'
import timeout from 'timeout-then'

const waitAction = store => type =>
  new Promise(resolve => {
    store.subscribe((...p) => {
      const state = store.getState()
      resolve(state)
    })
  })

describe('redux-pouchdb tests', () => {
  const db = new PouchDB('app', { db: require('memdown') })
  const INCREMENT = 'INCREMENT'
  const DECREMENT = 'DECREMENT'

  const createPersistentStore = compose(persistentStore)(createStore)

  const reducer = (state = { x: 0 }, action) => {
    switch (action.type) {
      case INCREMENT:
        return { x: state.x + 1 }
      case DECREMENT:
        return { x: state.x - 1 }
      default:
        return state
    }
  }
  const reducerName = 'counter'
  const finalReducer = persistentReducer(db, reducerName)(reducer)

  it(
    'should persist store state',
    async done => {
      let store = createPersistentStore(finalReducer)

      await waitInitialization(reducerName)

      const doc = await load(db)(reducerName)

      const x1a = store.getState().x
      const x1b = doc.state.x

      x1a.should.be.equal(x1b)

      store.dispatch({
        type: INCREMENT
      })

      await waitPersistence(reducerName)

      const doc2 = await load(db)(reducerName)

      const x2a = store.getState().x
      const x2b = doc2.state.x

      x2a.should.be.equal(x2b)

      done()
    },
    10000
  )
})
import { Probot } from 'probot'
// Requiring our fixtures
import payload from './fixtures/push.json'

// Requiring our app implementation
import myProbotApp from '../src/index'

import {default as conflict} from '../src/conflict-alerter'

describe('Conflict Alerter', () => {
  let context: Record<string, any>
  const mergeable = true
  const login = 'bwayne'
  const info = {
    repo: 'myRepo',
    owner: 'batman',
    number: 1
  }

  beforeEach(() => {
    const mockCallback = jest.fn((): {
      data: {
        mergeable: boolean | null;
        label?: string;
        user?: Record<string, string>;
      }
     } => ({
       data: {
         mergeable,
         label: 'Merge Conflict',
         user: {
           login
         }
       }
     })).mockImplementationOnce(() => ({
       data: {
         mergeable: null
       }
     }))

    context = {
      github: {
        pullRequests: {
          get: mockCallback
        }
      }
    }
  })

  test('helper handlePushEvent is called when probot receive push event', async () => {
    const original = conflict.handlePushEvent
    conflict.handlePushEvent = jest.fn()

    const probot = new Probot({})
    // Load our app into probot
    const app = probot.load(myProbotApp)
    // just return a test token
    app.app = () => 'test'

    // Receive a webhook event
    await probot.receive({ name: 'push', payload })

    expect(conflict.handlePushEvent).toHaveBeenCalled()
    expect(conflict.handlePushEvent).toHaveBeenCalledWith(expect.objectContaining({
      payload
    }))

    conflict.handlePushEvent = original
  })

  test('expect pollPullRequest to only be called once with multiple of the same PRs', async () => {
    const mock = jest.spyOn(conflict, 'pollPullRequest')

    context.github.pullRequests.list = jest.fn(() => ({
      data: [{
        id: 1,
        number: 520
      }, {
        id: 2,
        number: 520
      }]
    }))
    context.payload = {
      repository: {
        name: 'batmobile',
        owner: {
          name: 'batman'
        }
      }
    }

    await conflict.handlePushEvent(context)
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenNthCalledWith(1, {
      repo: 'batmobile',
      owner: 'batman',
      number: 520
    }, context)
  })

  test('expected result is returned for pollPullRequest function', async () => {
    const result = await conflict.pollPullRequest(info, context)
    expect(result).toEqual({
      hasConflictLabel: false,
      mergeable,
      user: '@' + login
    })
  })

  test('expect pollPullRequest to return default object when Git request fails', async () => {
    context = {
      github: {
        pullRequests: {
          get: jest.fn(() => ({
            data: {
              mergeable: null,
              label: '',
              user: {}
            }
          }))
        }
      }
    }

    expect(await conflict.pollPullRequest(info, context)).toEqual({
      user: '',
      mergeable: null,
      hasConflictLabel: false
    })
  })

  xtest('expect handleRequest to throw error when request has mergeable as null', async () => {
    const request = {
      user: '',
      mergeable: null,
      hasConflictLabel: false
    }

    expect(() => {
      conflict.handleRequest(request, info, context)
    }).toThrowError()
  })
})

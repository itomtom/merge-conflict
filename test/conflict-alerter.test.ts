import { Probot } from 'probot'
// Requiring our fixtures
import payload from './fixtures/push.json'

// Requiring our app implementation
import myProbotApp from '../src/index'

import { handlePushEvent, pollPullRequest, handleRequest } from '../src/conflict-alerter'

jest.mock('../src/conflict-alerter', () => ({
  handlePushEvent: jest.fn(),
  pollPullRequest: require.requireActual('../src/conflict-alerter').pollPullRequest
}))

describe('Conflict Alerter', () => {
  let probot: any
  let mockCallback: any
  let context: Record<string, any>
  const mergeable = true
  const login = 'bwayne'
  const info = {
    repo: 'myRepo',
    owner: 'batman',
    number: 1
  }

  beforeEach(() => {
    probot = new Probot({})
    // Load our app into probot
    const app = probot.load(myProbotApp)
    // just return a test token
    app.app = () => 'test'

    mockCallback = jest.fn(() => ({
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
    // Receive a webhook event
    await probot.receive({ name: 'push', payload })

    expect(handlePushEvent).toHaveBeenCalled()
    expect(handlePushEvent).toHaveBeenCalledWith(expect.objectContaining({
      payload
    }))
  })

  test('expected result is returned for pollPullRequest function', async () => {
    const result = await pollPullRequest(info, context)
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

    expect(await pollPullRequest(info, context)).toEqual({
      user: '',
      mergeable: null,
      hasConflictLabel: false
    })
  })

  test('expect handleRequest to throw error when request has mergeable as null', async () => {
    const request = {
      user: '',
      mergeable: null,
      hasConflictLabel: false
    }

    expect(() => {
      handleRequest(request, info, context)
    }).toThrowError()
  })
})

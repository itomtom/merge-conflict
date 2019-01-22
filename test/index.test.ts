import nock from 'nock'
// Requiring our app implementation
import myProbotApp from '../src/index'
import { Probot } from 'probot'
// Requiring our fixtures
import payload from './fixtures/installation.created.json'

nock.disableNetConnect()

describe('Merge Conflict Application', () => {
  let probot: any

  beforeEach(() => {
    probot = new Probot({})
    // Load our app into probot
    const app = probot.load(myProbotApp)
    // just return a test token
    app.app = () => 'test'
  })

  test('creates a label when an installation is created', async (done) => {
    // Test that a label is created
    nock('https://api.github.com')
      .post('/repos/itomtom/card/labels', (body: any) => {
        done(expect(body).toEqual(expect.objectContaining({
          color: expect.any(String),
          name: expect.any(String),
          description: expect.any(String)
        })))
        return true
      })
      .reply(200)

    // Receive a webhook event
    await probot.receive({ name: 'installation.created', payload })
  })
})

import { handleInstallation, labelName } from '../src/labeller'

describe('Labeller', () => {
  let mockCallback: any
  let context: Record<string, any>

  beforeEach(() => {
    mockCallback = jest.fn(() => {})
    context = {
      github: {
        issues: {
          createLabel: mockCallback
        }
      },
      payload: {
        repositories: [
          {
            full_name: 'itomtom/card'
          }
        ]
      }
    }
  })

  test('github createLabel to be called with expecting object', async () => {
    await handleInstallation(context)
    expect(mockCallback.mock.calls.length).toBe(1)
    expect(mockCallback).toBeCalledWith(
      expect.objectContaining({
        owner: 'itomtom',
        repo: 'card',
        name: labelName
      })
    )
  })
})

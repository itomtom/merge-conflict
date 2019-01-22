import { Application } from 'probot' // eslint-disable-line no-unused-vars
import { handlePushEvent } from './conflict-alerter'
import { handleInstallation } from './labeller'

export = (app: Application) => {
  app.on('push', handlePushEvent)
  app.on(['installation.created', 'installation_repositories.added'], handleInstallation)
}

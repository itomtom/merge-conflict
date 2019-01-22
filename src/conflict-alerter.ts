import { some } from 'lodash'
import { labelName } from './labeller'

/* eslint-disable */
type request = {
  user: string,
  mergeable: boolean | null,
  hasConflictLabel: boolean,
}

type githubInfo = {
  repo: string,
  owner: string,
  number: number,
}
/* eslint-enable */

export async function pollPullRequest (info: githubInfo, context: Record<string, any>): Promise<request> {
  const {repo, owner, number} = info
  let result: Record<string, any> = {}
  for (let attempts = 0; attempts < 3; attempts++) {
    result = await context.github.pullRequests.get({owner, repo, number})

    // If result of pr has mergable attribute then come out of attempts
    if (result.data.mergeable !== null) {
      break
    }
  }

  // If mergerable is still null then a error has occured
  if (result.data.mergeable === null) {
    return {
      user: '',
      mergeable: null,
      hasConflictLabel: false
    }
  }

  return {
    user: `@${result.data.user.login}`,
    mergeable: result.data.mergeable,
    hasConflictLabel: some(result.data.labels, {name: labelName})
  }
}

export function handleRequest (request: request, info: githubInfo, context: Record<string, any>) {
  const {repo, owner, number} = info
  const {user, mergeable, hasConflictLabel} = request

  if (mergeable === null) {
    throw new Error(`Can not fetch Pull Request ${number} for information`)
  }

  if (mergeable === false && !hasConflictLabel) {
    context.github.issues.addLabels({owner, repo, number, labels: [labelName]})
    context.github.pullRequests.createReview({
      owner,
      repo,
      number,
      event: 'COMMENT',
      body: `Apologies ${user} but it seems your pull request currently has a merge conflict :worried:. Please rebase your PR branch with respect to the base branch.`
    })
  }

  if (mergeable === true && hasConflictLabel) {
    context.github.issues.removeLabel({owner, repo, number, name: 'Merge Conflict'})
  }
}

export async function handlePushEvent (context: Record<string, any>) {
  const repo = context.payload.repository.name
  const owner = context.payload.repository.owner.name
  // List last 30 updated pull requests
  const pullRequests = await context.github.pullRequests.list({repo, owner, sort: 'updated', direction: 'desc'})

  pullRequests.data.forEach((pullRequest: Record<string, any>) => {
    const githubInfo = {repo, owner, number: pullRequest.number}
    pollPullRequest(githubInfo, context).then((pullRequest: request) => {
      handleRequest(pullRequest, githubInfo, context)
    })
  })
}

export const labelName = 'Merge Conflict'
const color = 'cc0000'
const description = 'Pull Request has merge conflict. Must require attention from Author.'

export async function handleInstallation (context: Record<string, any>) {
  const repositories = context.payload.repositories || context.payload.repositories_added
  repositories.forEach((repository: Record<string, any>) => {
    const [owner, repo] = repository.full_name.split('/')
    try {
      context.github.issues.createLabel({owner, repo, name: labelName, color, description})
    } catch (e) {
      console.debug(e)
    }
  })
}

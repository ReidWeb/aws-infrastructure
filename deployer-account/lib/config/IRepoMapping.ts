interface IBranchMapping {
	environmentName: string,
	accountId: string
}

export default interface IRepoMapping {
	repoName: string,
	roleName: string
	branches: IBranchMapping[]
}

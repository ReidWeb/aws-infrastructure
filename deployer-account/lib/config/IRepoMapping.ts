interface IBranchMapping {
	branch: string,
	accountId: string
}

export default interface IRepoMapping {
	repoName: string,
	roleName: string
	branches: IBranchMapping[]
}

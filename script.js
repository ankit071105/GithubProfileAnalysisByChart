async function fetchGitHubData() {
    const username = document.getElementById('githubUsername').value;

    if (!username) {
        alert("Please enter a GitHub username");
        return;
    }

    // Fetch user profile
    const profileResponse = await fetch(`https://api.github.com/users/${username}`);
    const profileData = await profileResponse.json();

    if (profileResponse.status !== 200) {
        alert("GitHub user not found or rate limit exceeded.");
        return;
    }

    displayStatsOverview(profileData);

    // Fetch user repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos`);
    const reposData = await reposResponse.json();

    processRepositoryData(reposData);
    processContributionData(reposData);
    processOpenSourceData(reposData, username);
}

function displayStatsOverview(profile) {
    document.getElementById('avatar').src = profile.avatar_url;
    document.getElementById('name').innerText = `Name: ${profile.name || profile.login}`;
    document.getElementById('bio').innerText = `Bio: ${profile.bio || 'No bio available'}`;
    document.getElementById('publicRepos').innerText = `Public Repositories: ${profile.public_repos}`;
    document.getElementById('followers').innerText = `Followers: ${profile.followers}`;
    document.getElementById('following').innerText = `Following: ${profile.following}`;
}

function processRepositoryData(repos) {
    const repoList = document.getElementById('repoList');
    repoList.innerHTML = '';

    repos.forEach(repo => {
        const repoItem = document.createElement('div');
        repoItem.className = 'repoItem';
        repoItem.innerHTML = `
            <p><strong>${repo.name}</strong></p>
            <p>Stars: ${repo.stargazers_count}, Forks: ${repo.forks_count}</p>
            <p>Language: ${repo.language || 'N/A'}</p>
        `;
        repoList.appendChild(repoItem);
    });

    const repoNames = repos.map(repo => repo.name);
    const repoStars = repos.map(repo => repo.stargazers_count);

    const ctxRepository = document.getElementById('repositoryChart').getContext('2d');
    new Chart(ctxRepository, {
        type: 'pie',
        data: {
            labels: repoNames,
            datasets: [{
                label: 'Repository Stars',
                data: repoStars,
                backgroundColor: repoNames.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`)
            }]
        }
    });
}

function processContributionData(repos) {
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    const totalCommits = repos.length; // Simplified, ideally should fetch commit data

    const ctxContributions = document.getElementById('contributionChart').getContext('2d');
    new Chart(ctxContributions, {
        type: 'line',
        data: {
            labels: ['Stars', 'Forks', 'Commits'],
            datasets: [{
                label: 'Contribution Analysis',
                data: [totalStars, totalForks, totalCommits],
                backgroundColor: 'rgba(52, 152, 219, 0.5)',
                borderColor: '#3498db',
                fill: true,
                tension: 0.4
            }]
        }
    });

    const languageUsage = {};
    repos.forEach(repo => {
        if (repo.language) {
            if (languageUsage[repo.language]) {
                languageUsage[repo.language] += 1;
            } else {
                languageUsage[repo.language] = 1;
            }
        }
    });

    const languages = Object.keys(languageUsage);
    const languageCounts = Object.values(languageUsage);

    const ctxLanguages = document.getElementById('languageChart').getContext('2d');
    new Chart(ctxLanguages, {
        type: 'pie',
        data: {
            labels: languages,
            datasets: [{
                label: 'Languages Used',
                data: languageCounts,
                backgroundColor: languages.map(() => `#${Math.floor(Math.random()*16777215).toString(16)}`)
            }]
        }
    });
}

async function processOpenSourceData(repos, username) {
    // Fetch user's pull requests in public repositories
    const pullsResponse = await fetch(`https://api.github.com/search/issues?q=type:pr+author:${username}`);
    const pullsData = await pullsResponse.json();

    const repoNames = repos.map(repo => repo.full_name);
    const contributionsCounts = repoNames.map(repoName => {
        return pullsData.items.filter(pr => pr.repository_url.includes(repoName)).length;
    });

    const ctxOpenSource = document.getElementById('openSourceChart').getContext('2d');
    new Chart(ctxOpenSource, {
        type: 'bar',
        data: {
            labels: repoNames,
            datasets: [{
                label: 'Open Source Contributions',
                data: contributionsCounts,
                backgroundColor: '#2ecc71'
            }]
        }
    });
}

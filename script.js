// Data storage
const DB = {
    users: JSON.parse(localStorage.getItem('users')) || [],
    posts: JSON.parse(localStorage.getItem('posts')) || [],
    currentUser: JSON.parse(localStorage.getItem('currentUser')) || null,
    
    saveUsers: function() {
        localStorage.setItem('users', JSON.stringify(this.users));
    },
    
    savePosts: function() {
        localStorage.setItem('posts', JSON.stringify(this.posts));
    },
    
    setCurrentUser: function(user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
    },
    
    clearCurrentUser: function() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
    }
};

// DOM Elements
const pages = {
    login: document.getElementById('login-page'),
    register: document.getElementById('register-page'),
    home: document.getElementById('home-page'),
    search: document.getElementById('search-page'),
    profile: document.getElementById('profile-page')
};

const navLinks = {
    home: document.getElementById('nav-home'),
    search: document.getElementById('nav-search'),
    profile: document.getElementById('nav-profile'),
    login: document.getElementById('nav-login'),
    logout: document.getElementById('nav-logout')
};

const heroSection = document.getElementById('hero-section');
const featuresSection = document.getElementById('features-section');
const footer = document.getElementById('main-footer');

// Auth Functions
function showPage(pageId) {
    // Hide all pages first
    Object.values(pages).forEach(page => page.classList.add('hidden'));
    
    // Show the requested page
    pages[pageId].classList.remove('hidden');
    
    // Update nav links
    Object.values(navLinks).forEach(link => link.classList.remove('active'));
    
    if (pageId === 'home') navLinks.home.classList.add('active');
    else if (pageId === 'search') navLinks.search.classList.add('active');
    else if (pageId === 'profile') navLinks.profile.classList.add('active');
    else if (pageId === 'login') navLinks.login.classList.add('active');
    
    // Special handling for authenticated state
    if (DB.currentUser) {
        navLinks.login.classList.add('hidden');
        navLinks.logout.classList.remove('hidden');
        heroSection.classList.add('hidden');
        featuresSection.classList.add('hidden');
        footer.classList.remove('hidden');
        
        if (pageId === 'home') loadHomePage();
        if (pageId === 'profile') loadProfilePage();
    } else {
        navLinks.login.classList.remove('hidden');
        navLinks.logout.classList.add('hidden');
        heroSection.classList.remove('hidden');
        featuresSection.classList.remove('hidden');
        footer.classList.add('hidden');
    }
}

function registerUser(username, college, email, password) {
    // Check if user already exists
    if (DB.users.some(user => user.email === email)) {
        alert('User with this email already exists!');
        return false;
    }
    
    // Create new user
    const newUser = {
        id: Date.now().toString(),
        username,
        college,
        email,
        password, // In a real app, this would be hashed
        profile: {
            about: '',
            experience: [],
            education: [],
            projects: [],
            certifications: [],
            social: []
        },
        following: [],
        savedPosts: []
    };
    
    DB.users.push(newUser);
    DB.saveUsers();
    DB.setCurrentUser(newUser);
    
    return true;
}

function loginUser(email, password) {
    const user = DB.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        DB.setCurrentUser(user);
        return true;
    }
    
    return false;
}

function logoutUser() {
    DB.clearCurrentUser();
    showPage('login');
}

// Post Functions
function createPost(content) {
    const newPost = {
        id: Date.now().toString(),
        userId: DB.currentUser.id,
        username: DB.currentUser.username,
        college: DB.currentUser.college,
        content,
        likes: [],
        dislikes: [],
        comments: [],
        createdAt: new Date().toISOString()
    };
    
    DB.posts.unshift(newPost);
    DB.savePosts();
    
    return newPost;
}

function likePost(postId) {
    const post = DB.posts.find(p => p.id === postId);
    const userId = DB.currentUser.id;
    
    if (post.likes.includes(userId)) {
        // Unlike
        post.likes = post.likes.filter(id => id !== userId);
    } else {
        // Like
        post.likes.push(userId);
        // Remove dislike if exists
        post.dislikes = post.dislikes.filter(id => id !== userId);
    }
    
    DB.savePosts();
}

function dislikePost(postId) {
    const post = DB.posts.find(p => p.id === postId);
    const userId = DB.currentUser.id;
    
    if (post.dislikes.includes(userId)) {
        // Undislike
        post.dislikes = post.dislikes.filter(id => id !== userId);
    } else {
        // Dislike
        post.dislikes.push(userId);
        // Remove like if exists
        post.likes = post.likes.filter(id => id !== userId);
    }
    
    DB.savePosts();
}

function commentOnPost(postId, comment) {
    const post = DB.posts.find(p => p.id === postId);
    
    post.comments.push({
        userId: DB.currentUser.id,
        username: DB.currentUser.username,
        comment,
        createdAt: new Date().toISOString()
    });
    
    DB.savePosts();
}

function savePost(postId) {
    const user = DB.currentUser;
    
    if (!user.savedPosts) {
        user.savedPosts = [];
    }
    
    if (user.savedPosts.includes(postId)) {
        // Unsave
        user.savedPosts = user.savedPosts.filter(id => id !== postId);
    } else {
        // Save
        user.savedPosts.push(postId);
    }
    
    // Update user in DB
    const index = DB.users.findIndex(u => u.id === user.id);
    DB.users[index] = user;
    DB.saveUsers();
    DB.setCurrentUser(user);
}

// Follow Functions
function followUser(userId) {
    const currentUserId = DB.currentUser.id;
    
    if (!DB.currentUser.following.includes(userId)) {
        DB.currentUser.following.push(userId);
        
        // Update user in DB
        const index = DB.users.findIndex(u => u.id === currentUserId);
        DB.users[index] = DB.currentUser;
        DB.saveUsers();
        
        return true;
    }
    
    return false;
}

function unfollowUser(userId) {
    const currentUserId = DB.currentUser.id;
    
    if (DB.currentUser.following.includes(userId)) {
        DB.currentUser.following = DB.currentUser.following.filter(id => id !== userId);
        
        // Update user in DB
        const index = DB.users.findIndex(u => u.id === currentUserId);
        DB.users[index] = DB.currentUser;
        DB.saveUsers();
        
        return true;
    }
    
    return false;
}

// Page Load Functions
function loadHomePage() {
    const postsContainer = document.getElementById('posts-container');
    postsContainer.innerHTML = '';
    
    // Get posts from same college or followed users
    const relevantPosts = DB.posts.filter(post => {
        return post.college === DB.currentUser.college || 
               DB.currentUser.following.includes(post.userId);
    });
    
    if (relevantPosts.length === 0) {
        postsContainer.innerHTML = '<div class="card"><p>No posts to show. Follow more users or wait for your college mates to post!</p></div>';
        return;
    }
    
    relevantPosts.forEach(post => {
        const postElement = createPostElement(post);
        postsContainer.appendChild(postElement);
    });
}

function createPostElement(post) {
    const postEl = document.createElement('div');
    postEl.className = 'card post fade-in';
    postEl.dataset.postId = post.id;
    
    const isLiked = post.likes.includes(DB.currentUser.id);
    const isDisliked = post.dislikes.includes(DB.currentUser.id);
    const isSaved = DB.currentUser.savedPosts && DB.currentUser.savedPosts.includes(post.id);
    
    postEl.innerHTML = `
        <div class="post-header">
            <div class="post-user-avatar">${post.username.charAt(0).toUpperCase()}</div>
            <div class="post-user-info">
                <h3>${post.username}</h3>
                <p>${post.college}</p>
            </div>
        </div>
        <div class="post-content">
            <p>${post.content}</p>
        </div>
        <div class="post-actions">
            <div class="post-action like-btn ${isLiked ? 'liked' : ''}">
                <span>👍</span> <span class="like-count">${post.likes.length}</span>
            </div>
            <div class="post-action dislike-btn ${isDisliked ? 'disliked' : ''}">
                <span>👎</span> <span class="dislike-count">${post.dislikes.length}</span>
            </div>
            <div class="post-action comment-btn">
                <span>💬</span> <span class="comment-count">${post.comments.length}</span>
            </div>
            <div class="post-action save-btn ${isSaved ? 'saved' : ''}">
                <span>${isSaved ? '📁' : '📂'}</span>
            </div>
        </div>
        <div class="post-comments hidden">
            <div class="comment-form">
                <input type="text" class="comment-input" placeholder="Write a comment...">
                <button class="btn btn-primary comment-submit">Comment</button>
            </div>
            <div class="comments-list"></div>
        </div>
    `;
    
    // Add event listeners
    postEl.querySelector('.like-btn').addEventListener('click', () => {
        likePost(post.id);
        loadHomePage(); // Refresh posts
    });
    
    postEl.querySelector('.dislike-btn').addEventListener('click', () => {
        dislikePost(post.id);
        loadHomePage(); // Refresh posts
    });
    
    postEl.querySelector('.comment-btn').addEventListener('click', () => {
        const commentsSection = postEl.querySelector('.post-comments');
        commentsSection.classList.toggle('hidden');
        
        if (!commentsSection.classList.contains('hidden')) {
            loadComments(post.id);
        }
    });
    
    postEl.querySelector('.save-btn').addEventListener('click', () => {
        savePost(post.id);
        loadHomePage(); // Refresh posts
    });
    
    postEl.querySelector('.comment-submit').addEventListener('click', () => {
        const commentInput = postEl.querySelector('.comment-input');
        const comment = commentInput.value.trim();
        
        if (comment) {
            commentOnPost(post.id, comment);
            commentInput.value = '';
            loadComments(post.id);
        }
    });
    
    return postEl;
}

function loadComments(postId) {
    const post = DB.posts.find(p => p.id === postId);
    const commentsList = document.querySelector(`[data-post-id="${postId}"] .comments-list`);
    
    commentsList.innerHTML = '';
    
    if (post.comments.length === 0) {
        commentsList.innerHTML = '<p>No comments yet.</p>';
        return;
    }
    
    post.comments.forEach(comment => {
        const commentEl = document.createElement('div');
        commentEl.className = 'comment';
        commentEl.innerHTML = `
            <div class="comment-header">
                <div class="comment-user-avatar">${comment.username.charAt(0).toUpperCase()}</div>
                <strong>${comment.username}</strong>
            </div>
            <p>${comment.comment}</p>
        `;
        commentsList.appendChild(commentEl);
    });
}

function loadProfilePage() {
    // Load basic info
    document.getElementById('profile-avatar').textContent = DB.currentUser.username.charAt(0).toUpperCase();
    document.getElementById('profile-username').textContent = DB.currentUser.username;
    document.getElementById('profile-college').textContent = DB.currentUser.college;
    document.getElementById('profile-email').textContent = DB.currentUser.email;
    
    // Load profile details
    const profile = DB.currentUser.profile;
    
    document.getElementById('profile-about').textContent = profile.about || 'No information provided yet.';
    
    // Load experience
    const experienceContainer = document.getElementById('profile-experience');
    if (profile.experience && profile.experience.length > 0) {
        experienceContainer.innerHTML = '';
        profile.experience.forEach(exp => {
            experienceContainer.innerHTML += `<p><strong>${exp.title}</strong> at ${exp.company} (${exp.duration})</p>`;
        });
    } else {
        experienceContainer.innerHTML = '<p>No experience added yet.</p>';
    }
    
    // Load education
    const educationContainer = document.getElementById('profile-education');
    if (profile.education && profile.education.length > 0) {
        educationContainer.innerHTML = '';
        profile.education.forEach(edu => {
            educationContainer.innerHTML += `<p><strong>${edu.degree}</strong> at ${edu.institution} (${edu.year})</p>`;
        });
    } else {
        educationContainer.innerHTML = '<p>No education information added yet.</p>';
    }
    
    // Load projects
    const projectsContainer = document.getElementById('profile-projects');
    if (profile.projects && profile.projects.length > 0) {
        projectsContainer.innerHTML = '';
        profile.projects.forEach(project => {
            projectsContainer.innerHTML += `<p><strong>${project.name}</strong>: ${project.description}</p>`;
        });
    } else {
        projectsContainer.innerHTML = '<p>No projects added yet.</p>';
    }
    
    // Load certifications
    const certificationsContainer = document.getElementById('profile-certifications');
    if (profile.certifications && profile.certifications.length > 0) {
        certificationsContainer.innerHTML = '';
        profile.certifications.forEach(cert => {
            certificationsContainer.innerHTML += `<p><strong>${cert.name}</strong> from ${cert.issuer} (${cert.year})</p>`;
        });
    } else {
        certificationsContainer.innerHTML = '<p>No certifications added yet.</p>';
    }
    
    // Load social links
    const socialContainer = document.getElementById('profile-social');
    if (profile.social && profile.social.length > 0) {
        socialContainer.innerHTML = '';
        profile.social.forEach(link => {
            socialContainer.innerHTML += `<p><a href="${link.url}" target="_blank">${link.platform}</a></p>`;
        });
    } else {
        socialContainer.innerHTML = '<p>No social links added yet.</p>';
    }
    
    // Load saved posts
    loadSavedPosts();
}

function loadSavedPosts() {
    const savedPostsContainer = document.getElementById('saved-posts');
    
    if (!DB.currentUser.savedPosts || DB.currentUser.savedPosts.length === 0) {
        savedPostsContainer.innerHTML = '<p>No saved posts yet.</p>';
        return;
    }
    
    savedPostsContainer.innerHTML = '';
    
    DB.currentUser.savedPosts.forEach(postId => {
        const post = DB.posts.find(p => p.id === postId);
        if (post) {
            const postEl = document.createElement('div');
            postEl.className = 'card post';
            postEl.innerHTML = `
                <div class="post-header">
                    <div class="post-user-avatar">${post.username.charAt(0).toUpperCase()}</div>
                    <div class="post-user-info">
                        <h3>${post.username}</h3>
                        <p>${post.college}</p>
                    </div>
                </div>
                <div class="post-content">
                    <p>${post.content}</p>
                </div>
            `;
            savedPostsContainer.appendChild(postEl);
        }
    });
}

function setupProfileForm() {
    const profile = DB.currentUser.profile;
    
    // Set about text
    document.getElementById('edit-about').value = profile.about || '';
    
    // Clear containers
    document.getElementById('experience-container').innerHTML = '';
    document.getElementById('education-container').innerHTML = '';
    document.getElementById('projects-container').innerHTML = '';
    document.getElementById('certifications-container').innerHTML = '';
    document.getElementById('social-container').innerHTML = '';
    
    // Add experience fields
    if (profile.experience && profile.experience.length > 0) {
        profile.experience.forEach(exp => {
            addExperienceField(exp.title, exp.company, exp.duration);
        });
    } else {
        addExperienceField();
    }
    
    // Add education fields
    if (profile.education && profile.education.length > 0) {
        profile.education.forEach(edu => {
            addEducationField(edu.degree, edu.institution, edu.year);
        });
    } else {
        addEducationField();
    }
    
    // Add project fields
    if (profile.projects && profile.projects.length > 0) {
        profile.projects.forEach(project => {
            addProjectField(project.name, project.description);
        });
    } else {
        addProjectField();
    }
    
    // Add certification fields
    if (profile.certifications && profile.certifications.length > 0) {
        profile.certifications.forEach(cert => {
            addCertificationField(cert.name, cert.issuer, cert.year);
        });
    } else {
        addCertificationField();
    }
    
    // Add social fields
    if (profile.social && profile.social.length > 0) {
        profile.social.forEach(link => {
            addSocialField(link.platform, link.url);
        });
    } else {
        addSocialField();
    }
}

function addExperienceField(title = '', company = '', duration = '') {
    const container = document.getElementById('experience-container');
    const fieldId = Date.now();
    
    const fieldHtml = `
        <div class="form-row" data-id="${fieldId}">
            <input type="text" class="form-control" placeholder="Title" value="${title}" name="exp-title-${fieldId}">
            <input type="text" class="form-control" placeholder="Company" value="${company}" name="exp-company-${fieldId}">
            <input type="text" class="form-control" placeholder="Duration" value="${duration}" name="exp-duration-${fieldId}">
            <button type="button" class="btn remove-btn">Remove</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', fieldHtml);
    
    // Add event listener to remove button
    container.querySelector(`[data-id="${fieldId}"] .remove-btn`).addEventListener('click', function() {
        this.parentElement.remove();
    });
}

function addEducationField(degree = '', institution = '', year = '') {
    const container = document.getElementById('education-container');
    const fieldId = Date.now();
    
    const fieldHtml = `
        <div class="form-row" data-id="${fieldId}">
            <input type="text" class="form-control" placeholder="Degree" value="${degree}" name="edu-degree-${fieldId}">
            <input type="text" class="form-control" placeholder="Institution" value="${institution}" name="edu-institution-${fieldId}">
            <input type="text" class="form-control" placeholder="Year" value="${year}" name="edu-year-${fieldId}">
            <button type="button" class="btn remove-btn">Remove</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', fieldHtml);
    
    // Add event listener to remove button
    container.querySelector(`[data-id="${fieldId}"] .remove-btn`).addEventListener('click', function() {
        this.parentElement.remove();
    });
}

function addProjectField(name = '', description = '') {
    const container = document.getElementById('projects-container');
    const fieldId = Date.now();
    
    const fieldHtml = `
        <div class="form-row" data-id="${fieldId}">
            <input type="text" class="form-control" placeholder="Project Name" value="${name}" name="project-name-${fieldId}">
            <input type="text" class="form-control" placeholder="Description" value="${description}" name="project-desc-${fieldId}">
            <button type="button" class="btn remove-btn">Remove</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', fieldHtml);
    
    // Add event listener to remove button
    container.querySelector(`[data-id="${fieldId}"] .remove-btn`).addEventListener('click', function() {
        this.parentElement.remove();
    });
}

function addCertificationField(name = '', issuer = '', year = '') {
    const container = document.getElementById('certifications-container');
    const fieldId = Date.now();
    
    const fieldHtml = `
        <div class="form-row" data-id="${fieldId}">
            <input type="text" class="form-control" placeholder="Certification Name" value="${name}" name="cert-name-${fieldId}">
            <input type="text" class="form-control" placeholder="Issuer" value="${issuer}" name="cert-issuer-${fieldId}">
            <input type="text" class="form-control" placeholder="Year" value="${year}" name="cert-year-${fieldId}">
            <button type="button" class="btn remove-btn">Remove</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', fieldHtml);
    
    // Add event listener to remove button
    container.querySelector(`[data-id="${fieldId}"] .remove-btn`).addEventListener('click', function() {
        this.parentElement.remove();
    });
}

function addSocialField(platform = '', url = '') {
    const container = document.getElementById('social-container');
    const fieldId = Date.now();
    
    const fieldHtml = `
        <div class="form-row" data-id="${fieldId}">
            <input type="text" class="form-control" placeholder="Platform" value="${platform}" name="social-platform-${fieldId}">
            <input type="url" class="form-control" placeholder="URL" value="${url}" name="social-url-${fieldId}">
            <button type="button" class="btn remove-btn">Remove</button>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', fieldHtml);
    
    // Add event listener to remove button
    container.querySelector(`[data-id="${fieldId}"] .remove-btn`).addEventListener('click', function() {
        this.parentElement.remove();
    });
}

function saveProfile(formData) {
    const profile = {
        about: formData.get('about'),
        experience: [],
        education: [],
        projects: [],
        certifications: [],
        social: []
    };
    
    // Extract experience
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('exp-title-') && value) {
            const id = key.split('-')[2];
            const company = formData.get(`exp-company-${id}`);
            const duration = formData.get(`exp-duration-${id}`);
            
            if (value && company) {
                profile.experience.push({
                    title: value,
                    company: company,
                    duration: duration || ''
                });
            }
        }
    }
    
    // Extract education
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('edu-degree-') && value) {
            const id = key.split('-')[2];
            const institution = formData.get(`edu-institution-${id}`);
            const year = formData.get(`edu-year-${id}`);
            
            if (value && institution) {
                profile.education.push({
                    degree: value,
                    institution: institution,
                    year: year || ''
                });
            }
        }
    }
    
    // Extract projects
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('project-name-') && value) {
            const id = key.split('-')[2];
            const description = formData.get(`project-desc-${id}`);
            
            if (value) {
                profile.projects.push({
                    name: value,
                    description: description || ''
                });
            }
        }
    }
    
    // Extract certifications
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('cert-name-') && value) {
            const id = key.split('-')[2];
            const issuer = formData.get(`cert-issuer-${id}`);
            const year = formData.get(`cert-year-${id}`);
            
            if (value && issuer) {
                profile.certifications.push({
                    name: value,
                    issuer: issuer,
                    year: year || ''
                });
            }
        }
    }
    
    // Extract social links
    for (let [key, value] of formData.entries()) {
        if (key.startsWith('social-platform-') && value) {
            const id = key.split('-')[2];
            const url = formData.get(`social-url-${id}`);
            
            if (value && url) {
                profile.social.push({
                    platform: value,
                    url: url
                });
            }
        }
    }
    
    // Update user profile
    const userIndex = DB.users.findIndex(u => u.id === DB.currentUser.id);
    DB.users[userIndex].profile = profile;
    DB.saveUsers();
    DB.setCurrentUser(DB.users[userIndex]);
}

function searchUsers(query) {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (!query) {
        resultsContainer.innerHTML = '<div class="card"><p>Please enter a search term</p></div>';
        return;
    }
    
    const results = DB.users.filter(user => {
        return user.id !== DB.currentUser.id && (
            user.username.toLowerCase().includes(query.toLowerCase()) ||
            user.college.toLowerCase().includes(query.toLowerCase())
        );
    });
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="card"><p>No users found</p></div>';
        return;
    }
    
    results.forEach(user => {
        const isFollowing = DB.currentUser.following.includes(user.id);
        
        const userEl = document.createElement('div');
        userEl.className = 'card user-result fade-in';
        userEl.innerHTML = `
            <div class="user-result-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="user-result-info">
                <h3>${user.username}</h3>
                <p>${user.college}</p>
            </div>
            <button class="btn ${isFollowing ? 'btn-outline' : 'btn-primary'} follow-btn" data-user-id="${user.id}">
                ${isFollowing ? 'Following' : 'Follow'}
            </button>
        `;
        
        resultsContainer.appendChild(userEl);
        
        // Add follow event listener
        userEl.querySelector('.follow-btn').addEventListener('click', function() {
            const userId = this.dataset.userId;
            
            if (isFollowing) {
                unfollowUser(userId);
                this.textContent = 'Follow';
                this.classList.remove('btn-outline');
                this.classList.add('btn-primary');
            } else {
                followUser(userId);
                this.textContent = 'Following';
                this.classList.remove('btn-primary');
                this.classList.add('btn-outline');
            }
        });
    });
}

// Event Listeners
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (loginUser(email, password)) {
        showPage('home');
    } else {
        alert('Invalid email or password!');
    }
});

document.getElementById('register-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('register-username').value;
    const college = document.getElementById('register-college').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    if (registerUser(username, college, email, password)) {
        showPage('home');
    }
});

document.getElementById('create-post-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const content = document.getElementById('post-content').value;
    
    if (content) {
        createPost(content);
        document.getElementById('post-content').value = '';
        loadHomePage();
    }
});

document.getElementById('search-btn').addEventListener('click', function() {
    const query = document.getElementById('search-input').value;
    searchUsers(query);
});

document.getElementById('profile-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    formData.set('about', document.getElementById('edit-about').value);
    
    saveProfile(formData);
    
    document.getElementById('edit-profile-form').classList.add('hidden');
    loadProfilePage();
});

document.getElementById('edit-profile-btn').addEventListener('click', function() {
    setupProfileForm();
    document.getElementById('edit-profile-form').classList.remove('hidden');
});

document.getElementById('cancel-edit').addEventListener('click', function() {
    document.getElementById('edit-profile-form').classList.add('hidden');
});

document.getElementById('add-experience').addEventListener('click', function() {
    addExperienceField();
});

document.getElementById('add-education').addEventListener('click', function() {
    addEducationField();
});

document.getElementById('add-project').addEventListener('click', function() {
    addProjectField();
});

document.getElementById('add-certification').addEventListener('click', function() {
    addCertificationField();
});

document.getElementById('add-social').addEventListener('click', function() {
    addSocialField();
});

// Navigation event listeners
navLinks.home.addEventListener('click', function(e) {
    e.preventDefault();
    if (DB.currentUser) {
        showPage('home');
    } else {
        showPage('login');
    }
});

navLinks.search.addEventListener('click', function(e) {
    e.preventDefault();
    if (DB.currentUser) {
        showPage('search');
    } else {
        showPage('login');
    }
});

navLinks.profile.addEventListener('click', function(e) {
    e.preventDefault();
    if (DB.currentUser) {
        showPage('profile');
    } else {
        showPage('login');
    }
});

navLinks.login.addEventListener('click', function(e) {
    e.preventDefault();
    showPage('login');
});

navLinks.logout.addEventListener('click', function(e) {
    e.preventDefault();
    logoutUser();
});

document.getElementById('switch-to-register').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('register');
});

document.getElementById('switch-to-login').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('login');
});

document.getElementById('hero-join-btn').addEventListener('click', function(e) {
    e.preventDefault();
    showPage('register');
});

// Initialize the app
if (DB.currentUser) {
    showPage('home');
} else {
    showPage('login');
}
